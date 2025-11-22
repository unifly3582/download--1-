import { NextRequest, NextResponse } from 'next/server';
import { CustomerCreateOrderSchema } from '@/types/order';
import { db } from '@/lib/firebase/server';
import { createOrUpdateCustomer } from '@/lib/oms/customerUtils';
import { getOrderWeightAndDimensions } from '@/lib/oms/orderLogic';
import { validateCoupon, calculateDiscount, recordCouponUsage } from '@/lib/oms/couponSystem';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/customer/orders/create
 * Create order from customer-facing app (no authentication required)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[CUSTOMER_ORDER] Starting order creation...');
    const body = await request.json();
    console.log('[CUSTOMER_ORDER] Request body received:', JSON.stringify(body, null, 2));
    
    // Validate customer order data
    const parseResult = CustomerCreateOrderSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('[CUSTOMER_ORDER] Schema validation failed:', parseResult.error.flatten());
      return NextResponse.json({
        success: false,
        error: 'Invalid order data',
        details: parseResult.error.flatten()
      }, { status: 400 });
    }
    
    const orderData = parseResult.data;
    console.log('[CUSTOMER_ORDER] Schema validation passed');
    
    // Only allow COD orders through this endpoint
    // Prepaid orders must go through /api/razorpay/create-order
    if (orderData.paymentInfo.method !== 'COD') {
      return NextResponse.json({
        success: false,
        error: 'This endpoint is only for COD orders. Use /api/razorpay/create-order for prepaid orders.'
      }, { status: 400 });
    }
    
    // Create or get customer
    console.log('[CUSTOMER_ORDER] Creating/updating customer...');
    const customer = await createOrUpdateCustomer(
      orderData.customerInfo.phone, 
      orderData.customerInfo,
      orderData.shippingAddress
    );
    console.log('[CUSTOMER_ORDER] Customer created/updated:', customer.customerId);
    
    // Get product details and validate items
    console.log('[CUSTOMER_ORDER] Validating and enriching items...');
    const itemsWithDetails = await validateAndEnrichItems(orderData.items);
    console.log('[CUSTOMER_ORDER] Items validated:', itemsWithDetails.length);
    
    // Calculate order value
    const subtotal = itemsWithDetails.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    
    // Validate and apply coupon if provided
    let discount = 0;
    let couponDetails = null;
    
    if (orderData.couponCode) {
      console.log('[CUSTOMER_ORDER] Validating coupon:', orderData.couponCode);
      const couponValidation = await validateCoupon(
        orderData.couponCode,
        customer.customerId,
        orderData.customerInfo.phone,
        subtotal,
        itemsWithDetails
      );
      
      if (!couponValidation.isValid) {
        console.log('[CUSTOMER_ORDER] Coupon validation failed:', couponValidation.error);
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
        console.log('[CUSTOMER_ORDER] Coupon applied, discount:', discount);
      }
    }
    
    // Calculate final pricing - use values from customer app (already calculated on frontend)
    const taxes = orderData.pricingInfo?.taxes || 0;
    const freeShippingCoupon = couponDetails?.couponType === 'free_shipping';
    const shippingCharges = orderData.pricingInfo?.shippingCharges ?? ((subtotal > 500 || freeShippingCoupon) ? 0 : 50);
    const codCharges = orderData.pricingInfo?.codCharges || 0;
    const prepaidDiscount = orderData.pricingInfo?.prepaidDiscount || 0;
    const grandTotal = subtotal - discount - prepaidDiscount + taxes + shippingCharges + codCharges;
    
    // Get weight and dimensions
    console.log('[CUSTOMER_ORDER] Calculating weight and dimensions...');
    const { weight, dimensions, needsManualVerification } = await getOrderWeightAndDimensions(itemsWithDetails);
    console.log('[CUSTOMER_ORDER] Weight:', weight, 'Dimensions:', dimensions);
    
    // Generate order ID
    console.log('[CUSTOMER_ORDER] Generating order ID...');
    const orderId = await generateOrderId();
    console.log('[CUSTOMER_ORDER] Order ID generated:', orderId);
    
    // Create order object
    const newOrder = {
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
        codCharges,
        prepaidDiscount
      },
      
      paymentInfo: {
        method: orderData.paymentInfo.method,
        status: 'Pending' as const
      },
      
      approval: {
        status: 'pending' as const
      },
      
      shipmentInfo: {},
      
      internalStatus: needsManualVerification ? 'needs_manual_verification' as const : 'created_pending' as const,
      customerFacingStatus: 'confirmed' as const,
      needsTracking: false,
      
      weight,
      dimensions,
      needsManualWeightAndDimensions: needsManualVerification
    };
    
    // Save order to database
    console.log('[CUSTOMER_ORDER] Saving order to database...');
    const orderRef = db.collection('orders').doc(orderId);
    await orderRef.set({
      ...newOrder,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('[CUSTOMER_ORDER] Order saved to database');
    
    // Record coupon usage if applicable
    if (couponDetails && orderData.couponCode) {
      try {
        await recordCouponUsage(
          couponDetails.couponId,
          orderData.couponCode,
          orderId,
          customer.customerId,
          orderData.customerInfo.phone,
          couponDetails.discountAmount,
          subtotal
        );
      } catch (couponError) {
        console.error(`[CUSTOMER_ORDER] Coupon usage recording failed for ${orderId}:`, couponError);
      }
    }
    
    // Trigger WhatsApp notification immediately on order creation
    try {
      const { createNotificationService } = await import('@/lib/oms/notifications');
      const notificationService = createNotificationService();
      const orderWithTimestamps = { 
        ...newOrder, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      } as any;
      await notificationService.sendOrderPlacedNotification(orderWithTimestamps);
      console.log(`[CUSTOMER_ORDER] WhatsApp notification sent for ${orderId}`);
    } catch (notificationError) {
      console.error(`[CUSTOMER_ORDER] Notification failed for ${orderId}:`, notificationError);
      // Don't fail order creation if notification fails
    }
    
    console.log(`[CUSTOMER_ORDER] Order created: ${orderId} by customer ${customer.customerId}`);
    
    return NextResponse.json({
      success: true,
      orderId,
      message: 'Order placed successfully',
      orderDetails: {
        orderId,
        totalAmount: grandTotal,
        discount,
        expectedDelivery: getExpectedDeliveryDate()
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('[CUSTOMER_ORDER] CRITICAL ERROR creating order:', error);
    console.error('[CUSTOMER_ORDER] Error stack:', error.stack);
    console.error('[CUSTOMER_ORDER] Error details:', {
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
    console.log('[CUSTOMER_ORDER] Validating item:', item.productId, item.sku);
    
    // Get product details
    const productDoc = await db.collection('products').doc(item.productId).get();
    
    if (!productDoc.exists) {
      console.error('[CUSTOMER_ORDER] Product not found:', item.productId);
      throw new Error(`Product not found: ${item.productId}`);
    }
    
    const product = productDoc.data()!;
    console.log('[CUSTOMER_ORDER] Product found:', product.name);
    
    // Find variation or use default
    let variation = product.variations?.find((v: any) => v.sku === item.sku);
    
    if (!variation) {
      console.error('[CUSTOMER_ORDER] Variation not found:', item.sku, 'Available variations:', product.variations?.map((v: any) => v.sku));
      throw new Error(`Product variation not found: ${item.sku}`);
    }
    
    console.log('[CUSTOMER_ORDER] Variation found:', variation.name, 'Stock:', variation.stock);
    
    // Check stock
    if (variation.stock < item.quantity) {
      console.error('[CUSTOMER_ORDER] Insufficient stock:', product.name, 'Available:', variation.stock, 'Requested:', item.quantity);
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
 * Generate order ID with new format ORDddmmyy-5xxx
 */
async function generateOrderId(): Promise<string> {
  try {
    // Query the latest order to get the highest numeric ID
    const snapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(10) // Get more results to handle mixed formats during transition
      .get();
    
    let nextNumber = 1; // Start at 1 for the first order
    
    if (!snapshot.empty) {
      let highestNumber = 0;
      
      // Look through recent orders to find the highest numeric ID
      snapshot.docs.forEach(doc => {
        const orderId = doc.data().orderId;
        
        // Check if it's a pure number (new format)
        if (/^\d+$/.test(orderId)) {
          const num = parseInt(orderId, 10);
          if (num > highestNumber) {
            highestNumber = num;
          }
        }
        // Handle old format ORDddmmyy-xxxx during transition
        else if (/^ORD\d{6}-(\d+)$/.test(orderId)) {
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
    console.error('[CUSTOMER_ORDER_ID_GENERATION] Error querying existing orders:', error);
    // Fallback to timestamp-based number if query fails
    const timestamp = Date.now();
    return timestamp.toString();
  }
}

/**
 * Calculate expected delivery date
 */
function getExpectedDeliveryDate(): string {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3); // 3 days from now
  return deliveryDate.toISOString();
}