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
    const body = await request.json();
    
    // Validate customer order data
    const parseResult = CustomerCreateOrderSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid order data',
        details: parseResult.error.flatten()
      }, { status: 400 });
    }
    
    const orderData = parseResult.data;
    
    // Only allow prepaid orders through this endpoint
    if (orderData.paymentInfo.method !== 'Prepaid') {
      return NextResponse.json({
        success: false,
        error: 'This endpoint is only for prepaid orders'
      }, { status: 400 });
    }
    
    // Create or get customer
    const customer = await createOrUpdateCustomer(
      orderData.customerInfo.phone, 
      orderData.customerInfo,
      orderData.shippingAddress
    );
    
    // Get product details and validate items
    const itemsWithDetails = await validateAndEnrichItems(orderData.items);
    
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
    const { weight, dimensions, needsManualVerification } = await getOrderWeightAndDimensions(itemsWithDetails);
    
    // Generate order ID
    const orderId = await generateOrderId();
    
    // Create Razorpay order
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
      return NextResponse.json({
        success: false,
        error: 'Failed to create payment order',
        details: razorpayResult.error
      }, { status: 500 });
    }
    
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
    const orderRef = db.collection('orders').doc(orderId);
    await orderRef.set({
      ...pendingOrder,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
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
    console.error('[RAZORPAY_ORDER] Error creating order:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create order',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Validates items and enriches with product details
 */
async function validateAndEnrichItems(items: any[]) {
  const enrichedItems = [];
  
  for (const item of items) {
    const productDoc = await db.collection('products').doc(item.productId).get();
    
    if (!productDoc.exists) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    
    const product = productDoc.data()!;
    let variation = product.variations?.find((v: any) => v.sku === item.sku);
    
    if (!variation) {
      throw new Error(`Product variation not found: ${item.sku}`);
    }
    
    if (variation.stock < item.quantity) {
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
