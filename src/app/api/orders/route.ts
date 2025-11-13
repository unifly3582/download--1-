// src/app/api/orders/route.ts
import { NextResponse, NextRequest } from 'next/server'; // CORRECT: Import NextRequest
import { z } from 'zod';
import { OrderSchema, CreateOrderSchema, Order, OrderItem, PricingInfoSchema } from "@/types/order"; 
import { db } from "@/lib/firebase/server";
import { createOrUpdateCustomer } from "@/lib/oms/customerUtils"; 
import { runAutoApproval } from "@/lib/oms/autoApproval";
import { getOrderWeightAndDimensions } from "@/lib/oms/orderLogic";
import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { withAuth, AuthContext } from '@/lib/auth/withAuth';

// --- SECURED GET FUNCTION ---
async function getOrdersHandler(request: NextRequest, context: any, authContext: AuthContext) {
  // CORRECT: Use request.nextUrl for NextRequest
  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status') || 'to-approve';

  try {
    let query: admin.firestore.Query = db.collection('orders');

    // ... (rest of the GET logic is unchanged)
    switch (status) {
      case 'to-approve':
        query = query.where('internalStatus', 'in', ['created_pending', 'needs_manual_verification']);
        break;
      case 'to-ship':
        query = query.where('internalStatus', 'in', ['approved', 'ready_for_shipping']);
        break;
      case 'in-transit':
        query = query.where('internalStatus', 'in', ['shipped', 'in_transit']);
        break;
      case 'completed':
        query = query.where('internalStatus', '==', 'delivered');
        break;
      case 'rejected':
        query = query.where('approval.status', '==', 'rejected');
        break;
      case 'issues':
        query = query.where('internalStatus', 'in', ['cancelled', 'returned']);
        break;
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    if (snapshot.empty) {
      return NextResponse.json({ success: true, data: [] });
    }

    const orders: Order[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const dataWithSerializableDates = {
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        approval: { ...data.approval, approvedAt: data.approval?.approvedAt?.toDate ? data.approval.approvedAt.toDate().toISOString() : data.approval?.approvedAt, }
      };
      
      const validation = OrderSchema.safeParse(dataWithSerializableDates);
      if (validation.success) {
        orders.push(validation.data);
      } else {
        console.warn(`[Orders API] Invalid order data for doc ${doc.id}:`, validation.error.flatten());
      }
    });

    return NextResponse.json({ success: true, data: orders });

  } catch (error: any) {
    console.error("[Orders API] Error fetching orders:", error);
    if (error.code === 'FAILED_PRECONDITION') {
        return NextResponse.json({ 
          success: false, 
          error: 'A database index is required for this query. Check server logs for a link to create it.',
          details: error.message || error.toString()
        }, { status: 500 });
    }
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch orders.",
      details: error.message || error.toString()
    }, { status: 500 });
  }
}

// CORRECT: Export the wrapped GET handler (admin only)
export const GET = withAuth(['admin'])(getOrdersHandler);


// --- POST FUNCTION HELPERS ---
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
    console.error('[ORDER_ID_GENERATION] Error querying existing orders:', error);
    // Fallback to timestamp-based number if query fails
    const timestamp = Date.now();
    return timestamp.toString();
  }
}

async function calculatePricingInfo(
  items: OrderItem[], 
  couponCode?: string,
  customerId?: string,
  customerPhone?: string
): Promise<{
  pricingInfo: z.infer<typeof PricingInfoSchema>;
  couponDetails?: any;
}> {
  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  let discount = 0;
  let couponDetails = null;
  
  // Apply coupon if provided
  if (couponCode) {
    const { validateCoupon, calculateDiscount } = await import('@/lib/oms/couponSystem');
    
    const couponValidation = await validateCoupon(
      couponCode,
      customerId,
      customerPhone,
      subtotal,
      items
    );
    
    if (couponValidation.isValid && couponValidation.couponDetails) {
      discount = calculateDiscount(couponValidation.couponDetails, subtotal, items);
      couponDetails = {
        couponId: couponValidation.couponDetails.couponId,
        discountAmount: discount,
        couponType: couponValidation.couponDetails.type
      };
      console.log(`[OMS] Coupon applied: ${couponCode}, discount: ₹${discount}`);
    } else {
      throw new Error(`Coupon error: ${couponValidation.error}`);
    }
  }
  
  const taxes = 0;
  // Free shipping for orders above ₹500 or if free shipping coupon
  const freeShippingCoupon = couponDetails?.couponType === 'free_shipping';
  const shippingCharges = (subtotal > 500 || freeShippingCoupon) ? 0 : 50;
  const grandTotal = subtotal - discount + taxes + shippingCharges;
  
  return {
    pricingInfo: { 
      subtotal, 
      discount,
      taxes, 
      shippingCharges, 
      grandTotal, 
      codCharges: 0 
    },
    couponDetails
  };
}


// --- SECURED POST FUNCTION ---
async function createOrderHandler(request: NextRequest, context: any, authContext: AuthContext) {
  try {
    const body = await request.json();
    const parseResult = CreateOrderSchema.safeParse(body);

    if (!parseResult.success) {
      console.error("[OMS][ORDER_CREATE] Zod validation failed:", parseResult.error.flatten());
      return NextResponse.json({ success: false, error: "Invalid order data provided.", details: parseResult.error.flatten() }, { status: 400 });
    }

    const orderInput = parseResult.data;
    
    // ... (rest of the POST logic is largely unchanged)
    const customer = await createOrUpdateCustomer(
      orderInput.customerInfo.phone, 
      orderInput.customerInfo,
      orderInput.shippingAddress
    );
    const orderId = await generateOrderId();
    const { weight, dimensions, needsManualVerification } = await getOrderWeightAndDimensions(orderInput.items);

    let pricingInfo;
    let couponDetails = null;
    
    if (orderInput.orderSource === 'admin_form' && orderInput.manualPricingInfo) {
        pricingInfo = orderInput.manualPricingInfo;
    } else {
        const pricingResult = await calculatePricingInfo(
          orderInput.items, 
          orderInput.couponCode,
          customer.customerId,
          orderInput.customerInfo.phone
        );
        pricingInfo = pricingResult.pricingInfo;
        couponDetails = pricingResult.couponDetails;
    }

    let internalStatus: Order['internalStatus'] = needsManualVerification ? "needs_manual_verification" : "created_pending";
    let paymentStatus: Order['paymentInfo']['status'] = "Pending";
    let approvalStatus: Order['approval']['status'] = "pending";

    // Simplified logic: If the order is prepaid and doesn't need manual verification,
    // the authenticated user (admin or machine) can fast-track its approval.
    if (orderInput.paymentInfo.method === 'Prepaid' && !needsManualVerification) {
        internalStatus = "approved";
        paymentStatus = "Completed";
        approvalStatus = "approved";
    }

    const newOrder: Omit<Order, 'createdAt' | 'updatedAt'> = {
      orderId: orderId,
      orderSource: orderInput.orderSource,
      
      // Traffic source tracking
      ...(orderInput.trafficSource && { trafficSource: orderInput.trafficSource }),
      
      // Coupon information
      ...(orderInput.couponCode && { couponCode: orderInput.couponCode }),
      ...(couponDetails && { couponDetails }),
      
      customerInfo: {
          ...orderInput.customerInfo,
          customerId: customer.customerId,
      },
      shippingAddress: orderInput.shippingAddress,
      items: orderInput.items,
      pricingInfo: pricingInfo,
      paymentInfo: { ...orderInput.paymentInfo, status: paymentStatus },
      approval: {
        status: approvalStatus,
        ...(approvalStatus === 'approved' && { approvedBy: authContext.user.uid, approvedAt: admin.firestore.Timestamp.now() })
      },
      shipmentInfo: {}, 
      internalStatus: internalStatus,
      weight: weight,
      dimensions: dimensions,
      needsManualWeightAndDimensions: needsManualVerification,
    };

    const orderRef = db.collection("orders").doc(orderId);
    
    await orderRef.set({
      ...newOrder,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Record coupon usage if coupon was applied
    if (couponDetails && orderInput.couponCode) {
      try {
        const { recordCouponUsage } = await import('@/lib/oms/couponSystem');
        await recordCouponUsage(
          couponDetails.couponId,
          orderInput.couponCode,
          orderId,
          customer.customerId,
          orderInput.customerInfo.phone,
          couponDetails.discountAmount,
          pricingInfo.subtotal
        );
      } catch (couponError) {
        console.error(`[OMS][ORDER_CREATE] Coupon usage recording failed for ${orderId}:`, couponError);
        // Don't fail order creation if coupon usage recording fails
      }
    }

    if (internalStatus === "created_pending") {
        runAutoApproval(newOrder as Order, orderId);
    }

    // Sync to customer orders collection
    try {
      const { syncCustomerOrder } = await import('@/lib/oms/customerOrderSync');
      await syncCustomerOrder(orderId, { ...newOrder, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any);
    } catch (syncError) {
      console.error(`[OMS][ORDER_CREATE] Customer sync failed for ${orderId}:`, syncError);
      // Don't fail the order creation if customer sync fails
    }

    // Trigger WhatsApp notification immediately on order creation
    try {
      const { createNotificationService } = await import('@/lib/oms/notifications');
      const notificationService = createNotificationService();
      const orderWithTimestamps = { 
        ...newOrder, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      } as Order;
      await notificationService.sendOrderPlacedNotification(orderWithTimestamps);
      console.log(`[OMS][ORDER_CREATE] WhatsApp notification sent for ${orderId}`);
    } catch (notificationError) {
      console.error(`[OMS][ORDER_CREATE] Notification failed for ${orderId}:`, notificationError);
      // Don't fail order creation if notification fails
    }

    console.log(`[OMS][ORDER_CREATE] Order created successfully: ${orderId} by user ${authContext.user.uid}`);
    return NextResponse.json({ success: true, message: "Order created successfully", orderId: orderId, internalStatus: newOrder.internalStatus }, { status: 201 });

  } catch (error: any) {
    console.error("[OMS][ORDER_CREATE] A critical error occurred:", error);
    return NextResponse.json({ 
      success: false, 
      error: "A server error occurred while creating the order.",
      details: error.message || error.toString()
    }, { status: 500 });
  }
}

// CORRECT: Export the wrapped POST handler (admin and machine)
export const POST = withAuth(['admin', 'machine'])(createOrderHandler);