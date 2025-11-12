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
    const taxes = 0;
    const freeShippingCoupon = couponDetails?.couponType === 'free_shipping';
    const shippingCharges = (subtotal > 500 || freeShippingCoupon) ? 0 : 50;
    const codCharges = orderData.paymentInfo.method === 'COD' ? 25 : 0;
    const grandTotal = subtotal - discount + taxes + shippingCharges + codCharges;
    
    // Get weight and dimensions
    const { weight, dimensions, needsManualVerification } = await getOrderWeightAndDimensions(itemsWithDetails);
    
    // Generate order ID
    const orderId = await generateOrderId();
    
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
        codCharges
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
    const orderRef = db.collection('orders').doc(orderId);
    await orderRef.set({
      ...newOrder,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
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
    
    // Sync to customer orders collection
    try {
      const { syncCustomerOrder } = await import('@/lib/oms/customerOrderSync');
      await syncCustomerOrder(orderId, { 
        ...newOrder, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      } as any);
    } catch (syncError) {
      console.error(`[CUSTOMER_ORDER] Customer sync failed for ${orderId}:`, syncError);
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
    console.error('[CUSTOMER_ORDER] Error creating order:', error);
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
    // Get product details
    const productDoc = await db.collection('products').doc(item.productId).get();
    
    if (!productDoc.exists) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    
    const product = productDoc.data()!;
    
    // Find variation or use default
    let variation = product.variations?.find((v: any) => v.sku === item.sku);
    
    if (!variation) {
      throw new Error(`Product variation not found: ${item.sku}`);
    }
    
    // Check stock
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
 * Generate order ID with new format ORDddmmyy-5xxx
 */
async function generateOrderId(): Promise<string> {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const datePrefix = `ORD${dd}${mm}${yy}`;
  
  // Query existing orders for today to find the next number
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  
  try {
    const snapshot = await db.collection('orders')
      .where('createdAt', '>=', todayStart)
      .where('createdAt', '<', todayEnd)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    let nextNumber = 5000; // Start at 5000 for new days
    
    if (!snapshot.empty) {
      const lastOrder = snapshot.docs[0];
      const lastOrderId = lastOrder.data().orderId;
      
      // Extract number from format ORDddmmyy-xxxx
      const match = lastOrderId.match(/^ORD\d{6}-(\d+)$/);
      if (match && lastOrderId.startsWith(datePrefix)) {
        const lastNumber = parseInt(match[1], 10);
        nextNumber = lastNumber + 1;
      }
    }
    
    return `${datePrefix}-${nextNumber}`;
  } catch (error) {
    console.error('[CUSTOMER_ORDER_ID_GENERATION] Error querying existing orders:', error);
    // Fallback to random number if query fails
    const randomNum = 5000 + Math.floor(Math.random() * 1000);
    return `${datePrefix}-${randomNum}`;
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