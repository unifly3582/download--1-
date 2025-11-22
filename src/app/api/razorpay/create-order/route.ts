import { NextRequest, NextResponse } from 'next/server';
import { CustomerCreateOrderSchema } from '@/types/order';
import { db } from '@/lib/firebase/server';
import { createOrUpdateCustomer } from '@/lib/oms/customerUtils';
import { getOrderWeightAndDimensions } from '@/lib/oms/orderLogic';
import { validateCoupon, calculateDiscount } from '@/lib/oms/couponSystem';
import { createRazorpayOrder } from '@/lib/razorpay/client';
import admin from 'firebase-admin';

/**
 * POST /api/razorpay/create-order
 * Create a pending order and Razorpay payment order for prepaid orders
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[RAZORPAY_ORDER] Starting prepaid order creation...');
    const body = await request.json();
    console.log('[RAZORPAY_ORDER] Request body received');
    
    // Validate customer order data
    const parseResult = CustomerCreateOrderSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('[RAZORPAY_ORDER] Schema validation failed:', parseResult.error.flatten());
      return NextResponse.json({
        success: false,
        error: 'Invalid order data',
        details: parseResult.error.flatten()
      }, { status: 400 });
    }
    
    const orderData = parseResult.data;
    console.log('[RAZORPAY_ORDER] Schema validation passed');
    
    // Only allow prepaid orders through this endpoint
    if (orderData.paymentInfo.method !== 'Prepaid') {
      return NextResponse.json({
        success: false,
        error: 'This endpoint is only for prepaid orders'
      }, { status: 400 });
    }
    
    // Create or get customer
    console.log('[RAZORPAY_ORDER] Creating/updating customer...');
    const customer = await createOrUpdateCustomer(
      orderData.customerInfo.phone, 
      orderData.customerInfo,
      orderData.shippingAddress
    );
    console.log('[RAZORPAY_ORDER] Customer created/updated:', customer.customerId);
    
    // Get product details and validate items
    console.log('[RAZORPAY_ORDER] Validating and enriching items...');
    const itemsWithDetails = await validateAndEnrichItems(orderData.items);
    console.log('[RAZORPAY_ORDER] Items validated:', itemsWithDetails.length);
    
    // Calculate order value
    const subtotal = itemsWithDetails.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    
    // Validate and apply coupon if provided
    let discount = 0;
    let couponDetails = null;
    
    if (orderData.couponCode) {
      const couponValidation = await validateCoupon(
        orderData.couponCode,
        customer.customerId,
        orderData.customerInfo.phone,
        subtotal,
        itemsWithDetails
      );
      
      if (!couponValidation.isValid) {
        return NextResponse.json({
          success: false,
          error: couponValidation.error
        }, { status: 400 });
      }
      
      if (couponValidation.couponDetails) {
        discount = calculateDiscount(couponValidation.couponDetails, subtotal, itemsWithDetails);
        couponDetails = {
          couponId: couponValidation.couponDetails.couponId,
          discountAmount: discount,
          couponType: couponValidation.couponDetails.type
        };
      }
    }
    
    // Calculate final pricing
    const taxes = orderData.pricingInfo?.taxes || 0;
    const freeShippingCoupon = couponDetails?.couponType === 'free_shipping';
    const shippingCharges = orderData.pricingInfo?.shippingCharges ?? ((subtotal > 500 || freeShippingCoupon) ? 0 : 50);
    const prepaidDiscount = orderData.pricingInfo?.prepaidDiscount || 0;
    const grandTotal = subtotal - discount - prepaidDiscount + taxes + shippingCharges;
    
    // Get weight and dimensions
    console.log('[RAZORPAY_ORDER] Calculating weight and dimensions...');
    const { weight, dimensions, needsManualVerification } = await getOrderWeightAndDimensions(itemsWithDetails);
    console.log('[RAZORPAY_ORDER] Weight:', weight, 'Dimensions:', dimensions);
    
    // Generate order ID
    console.log('[RAZORPAY_ORDER] Generating order ID...');
    const orderId = await generateOrderId();
    console.log('[RAZORPAY_ORDER] Order ID generated:', orderId);
    
    // Create Razorpay order
    console.log('[RAZORPAY_ORDER] Creating Razorpay order for amount:', grandTotal);
    const razorpayResult = await createRazorpayOrder(
      grandTotal,
      orderId,
      {
        name: orderData.customerInfo.name,
        email: orderData.customerInfo.email,
        phone: orderData.customerInfo.phone
      }
    );
    
    if (!razorpayResult.success) {
      console.error('[RAZORPAY_ORDER] Razorpay order creation failed:', razorpayResult.error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create payment order',
        details: razorpayResult.error
      }, { status: 500 });
    }
    
    console.log('[RAZORPAY_ORDER] Razorpay order created:', razorpayResult.razorpayOrderId);
    
    // Create pending order object (will be confirmed after payment)
    const pendingOrder = {
      orderId,
      orderSource: 'customer_app' as const,
      
      // Traffic source tracking
      ...(orderData.trafficSource && { trafficSource: orderData.trafficSource }),
      
      // Coupon information
      ...(orderData.couponCode && { couponCode: orderData.couponCode }),
      ...(couponDetails && { couponDetails }),
      
      customerInfo: {
        ...orderData.customerInfo,
        customerId: customer.customerId,
      },
      
      shippingAddress: orderData.shippingAddress,
      items: itemsWithDetails,
      
      pricingInfo: {
        subtotal,
        discount,
        taxes,
        shippingCharges,
        grandTotal,
        codCharges: 0,
        prepaidDiscount
      },
      
      paymentInfo: {
        method: 'Prepaid' as const,
        status: 'Pending' as const,
        razorpayOrderId: razorpayResult.razorpayOrderId
      },
      
      approval: {
        status: 'pending' as const
      },
      
      shipmentInfo: {},
      
      internalStatus: 'payment_pending' as const,
      customerFacingStatus: 'payment_pending' as const,
      needsTracking: false,
      
      weight,
      dimensions,
      needsManualWeightAndDimensions: needsManualVerification
    };
    
    // Save pending order to database
    console.log('[RAZORPAY_ORDER] Saving pending order to database...');
    const orderRef = db.collection('orders').doc(orderId);
    await orderRef.set({
      ...pendingOrder,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('[RAZORPAY_ORDER] Pending order saved to database');
    
    console.log(`[RAZORPAY_ORDER] Pending order created: ${orderId}, Razorpay Order: ${razorpayResult.razorpayOrderId}`);
    
    // Return Razorpay order details for frontend to initiate payment
    return NextResponse.json({
      success: true,
      orderId,
      razorpayOrderId: razorpayResult.razorpayOrderId,
      amount: grandTotal,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      customerInfo: {
        name: orderData.customerInfo.name,
        email: orderData.customerInfo.email,
        phone: orderData.customerInfo.phone
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('[RAZORPAY_ORDER] CRITICAL ERROR creating order:', error);
    console.error('[RAZORPAY_ORDER] Error stack:', error.stack);
    console.error('[RAZORPAY_ORDER] Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    return NextResponse.json({
      success: false,
      error: 'Failed to create order',
      details: error.message,
      errorType: error.name,
      errorCode: error.code
    }, { status: 500 });
  }
}

/**
 * Validates items and enriches with product details
 */
async function validateAndEnrichItems(items: any[]) {
  const enrichedItems = [];
  
  for (const item of items) {
    console.log('[RAZORPAY_ORDER] Validating item:', item.productId, item.sku);
    
    const productDoc = await db.collection('products').doc(item.productId).get();
    
    if (!productDoc.exists) {
      console.error('[RAZORPAY_ORDER] Product not found:', item.productId);
      throw new Error(`Product not found: ${item.productId}`);
    }
    
    const product = productDoc.data()!;
    console.log('[RAZORPAY_ORDER] Product found:', product.name);
    
    let variation = product.variations?.find((v: any) => v.sku === item.sku);
    
    if (!variation) {
      console.error('[RAZORPAY_ORDER] Variation not found:', item.sku, 'Available variations:', product.variations?.map((v: any) => v.sku));
      throw new Error(`Product variation not found: ${item.sku}`);
    }
    
    console.log('[RAZORPAY_ORDER] Variation found:', variation.name, 'Stock:', variation.stock);
    
    if (variation.stock < item.quantity) {
      console.error('[RAZORPAY_ORDER] Insufficient stock:', product.name, 'Available:', variation.stock, 'Requested:', item.quantity);
      throw new Error(`Insufficient stock for ${product.name}. Available: ${variation.stock}, Requested: ${item.quantity}`);
    }
    
    enrichedItems.push({
      productId: item.productId,
      variationId: item.variationId || null,
      productName: `${product.name}${variation.name !== 'Default' ? ` - ${variation.name}` : ''}`,
      quantity: item.quantity,
      unitPrice: variation.salePrice || variation.price,
      sku: item.sku,
      hsnCode: variation.hsnCode,
      weight: variation.weight,
      dimensions: variation.dimensions
    });
  }
  
  return enrichedItems;
}

/**
 * Generate order ID
 */
async function generateOrderId(): Promise<string> {
  try {
    const snapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    let nextNumber = 1;
    
    if (!snapshot.empty) {
      let highestNumber = 0;
      
      snapshot.docs.forEach(doc => {
        const orderId = doc.data().orderId;
        
        if (/^\d+$/.test(orderId)) {
          const num = parseInt(orderId, 10);
          if (num > highestNumber) {
            highestNumber = num;
          }
        } else if (/^ORD\d{6}-(\d+)$/.test(orderId)) {
          const match = orderId.match(/^ORD\d{6}-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > highestNumber) {
              highestNumber = num;
            }
          }
        }
      });
      
      nextNumber = highestNumber + 1;
    }
    
    return nextNumber.toString();
  } catch (error) {
    console.error('[RAZORPAY_ORDER_ID_GENERATION] Error:', error);
    return Date.now().toString();
  }
}
