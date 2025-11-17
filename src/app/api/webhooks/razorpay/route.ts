
import { NextResponse } from 'next/server';
import { db } from "@/lib/firebase/server";
import admin from "firebase-admin";
import crypto from 'crypto';

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(req: Request) {
  console.log("[RAZORPAY_WEBHOOK] Received a request.");

  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.error("[RAZORPAY_WEBHOOK] CRITICAL: Webhook secret is not configured.");
    return NextResponse.json({ success: false, error: "Server configuration error." }, { status: 500 });
  }

  try {
    const text = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.warn("[RAZORPAY_WEBHOOK] Missing signature.");
      return NextResponse.json({ success: false, error: "Missing signature." }, { status: 400 });
    }

    // 1. VERIFY THE SIGNATURE
    const hmac = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET);
    hmac.update(text);
    const digest = hmac.digest('hex');

    if (digest !== signature) {
      console.warn("[RAZORPAY_WEBHOOK] Invalid signature.");
      return NextResponse.json({ success: false, error: "Invalid signature." }, { status: 403 });
    }

    // 2. PROCESS THE EVENT
    const event = JSON.parse(text);
    console.log(`[RAZORPAY_WEBHOOK] Processing event: ${event.event}`);

    // Route to appropriate handler based on event type
    switch (event.event) {
      case 'order.paid':
        await handleOrderPaid(event);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event);
        break;
      
      case 'payment.authorized':
        await handlePaymentAuthorized(event);
        break;
      
      case 'payment.captured':
        await handlePaymentCaptured(event);
        break;
      
      case 'refund.created':
        await handleRefundCreated(event);
        break;
      
      case 'refund.processed':
        await handleRefundProcessed(event);
        break;
      
      default:
        console.log(`[RAZORPAY_WEBHOOK] Ignoring event: ${event.event}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[RAZORPAY_WEBHOOK] Error processing webhook:", error.message);
    return NextResponse.json({ success: false, error: "Webhook processing failed." }, { status: 500 });
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle order.paid event - Payment completed successfully
 */
async function handleOrderPaid(event: any) {
  try {
    const orderId = event.payload.order.entity.receipt;
    const paymentId = event.payload.payment.entity.id;
    const razorpayOrderId = event.payload.order.entity.id;

    if (!orderId) {
      console.warn("[RAZORPAY_WEBHOOK] 'order.paid' event is missing the receipt (orderId).");
      return;
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    
    if (!orderSnap.exists) {
      console.error(`[RAZORPAY_WEBHOOK] Order ${orderId} not found in database.`);
      return;
    }

    const orderData = orderSnap.data();
    
    // Verify this is the correct Razorpay order
    if (orderData?.paymentInfo?.razorpayOrderId !== razorpayOrderId) {
      console.error(`[RAZORPAY_WEBHOOK] Razorpay order ID mismatch for ${orderId}`);
      return;
    }

    // Check if already processed
    if (orderData?.paymentInfo?.status === 'Completed') {
      console.log(`[RAZORPAY_WEBHOOK] Order ${orderId} already marked as paid. Skipping.`);
      return;
    }
    
    // Update order status
    const needsManualVerification = orderData?.needsManualWeightAndDimensions || false;
    
    await orderRef.update({
      'paymentInfo.status': 'Completed',
      'paymentInfo.transactionId': paymentId,
      'internalStatus': needsManualVerification ? 'needs_manual_verification' : 'created_pending',
      'customerFacingStatus': 'confirmed',
      'updatedAt': admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[RAZORPAY_WEBHOOK] Successfully updated order ${orderId} to paid status.`);
    
    // Record coupon usage if applicable
    if (orderData?.couponCode && orderData?.couponDetails) {
      try {
        const { recordCouponUsage } = await import('@/lib/oms/couponSystem');
        await recordCouponUsage(
          orderData.couponDetails.couponId,
          orderData.couponCode,
          orderId,
          orderData.customerInfo.customerId,
          orderData.customerInfo.phone,
          orderData.couponDetails.discountAmount,
          orderData.pricingInfo.subtotal
        );
        console.log(`[RAZORPAY_WEBHOOK] Coupon usage recorded for ${orderId}`);
      } catch (couponError) {
        console.error(`[RAZORPAY_WEBHOOK] Coupon usage recording failed for ${orderId}:`, couponError);
      }
    }
    
    // Send WhatsApp notification
    try {
      const { createNotificationService } = await import('@/lib/oms/notifications');
      const notificationService = createNotificationService();
      const updatedOrder = { 
        ...orderData, 
        paymentInfo: { ...orderData?.paymentInfo, status: 'Completed', transactionId: paymentId },
        internalStatus: needsManualVerification ? 'needs_manual_verification' : 'created_pending',
        customerFacingStatus: 'confirmed',
        updatedAt: new Date().toISOString() 
      } as any;
      await notificationService.sendOrderPlacedNotification(updatedOrder);
      console.log(`[RAZORPAY_WEBHOOK] WhatsApp notification sent for ${orderId}`);
    } catch (notificationError) {
      console.error(`[RAZORPAY_WEBHOOK] Notification failed for ${orderId}:`, notificationError);
    }
  } catch (error: any) {
    console.error("[RAZORPAY_WEBHOOK] Error in handleOrderPaid:", error.message);
  }
}

/**
 * Handle payment.failed event - Payment attempt failed
 */
async function handlePaymentFailed(event: any) {
  try {
    const orderId = event.payload.payment.entity.notes?.order_id || event.payload.order?.entity?.receipt;
    const paymentId = event.payload.payment.entity.id;
    const errorCode = event.payload.payment.entity.error_code;
    const errorDescription = event.payload.payment.entity.error_description;

    if (!orderId) {
      console.warn("[RAZORPAY_WEBHOOK] 'payment.failed' event is missing order ID.");
      return;
    }

    console.log(`[RAZORPAY_WEBHOOK] Payment failed for order ${orderId}: ${errorDescription}`);

    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    
    if (!orderSnap.exists) {
      console.error(`[RAZORPAY_WEBHOOK] Order ${orderId} not found.`);
      return;
    }

    // Update order with failure information
    await orderRef.update({
      'paymentInfo.status': 'Failed',
      'paymentInfo.failureReason': errorDescription,
      'paymentInfo.errorCode': errorCode,
      'paymentInfo.lastFailedPaymentId': paymentId,
      'updatedAt': admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[RAZORPAY_WEBHOOK] Order ${orderId} marked as payment failed.`);
  } catch (error: any) {
    console.error("[RAZORPAY_WEBHOOK] Error in handlePaymentFailed:", error.message);
  }
}

/**
 * Handle payment.authorized event - Payment authorized but not captured
 */
async function handlePaymentAuthorized(event: any) {
  try {
    const orderId = event.payload.payment.entity.notes?.order_id || event.payload.order?.entity?.receipt;
    const paymentId = event.payload.payment.entity.id;

    if (!orderId) {
      console.warn("[RAZORPAY_WEBHOOK] 'payment.authorized' event is missing order ID.");
      return;
    }

    console.log(`[RAZORPAY_WEBHOOK] Payment authorized for order ${orderId}`);

    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    
    if (!orderSnap.exists) {
      console.error(`[RAZORPAY_WEBHOOK] Order ${orderId} not found.`);
      return;
    }

    // Update order with authorization info
    await orderRef.update({
      'paymentInfo.authorizedPaymentId': paymentId,
      'paymentInfo.authorizationStatus': 'authorized',
      'updatedAt': admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[RAZORPAY_WEBHOOK] Order ${orderId} payment authorized.`);
  } catch (error: any) {
    console.error("[RAZORPAY_WEBHOOK] Error in handlePaymentAuthorized:", error.message);
  }
}

/**
 * Handle payment.captured event - Payment captured successfully
 */
async function handlePaymentCaptured(event: any) {
  try {
    const orderId = event.payload.payment.entity.notes?.order_id || event.payload.order?.entity?.receipt;
    const paymentId = event.payload.payment.entity.id;
    const amount = event.payload.payment.entity.amount / 100; // Convert from paise

    if (!orderId) {
      console.warn("[RAZORPAY_WEBHOOK] 'payment.captured' event is missing order ID.");
      return;
    }

    console.log(`[RAZORPAY_WEBHOOK] Payment captured for order ${orderId}: ₹${amount}`);

    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    
    if (!orderSnap.exists) {
      console.error(`[RAZORPAY_WEBHOOK] Order ${orderId} not found.`);
      return;
    }

    // Update order with capture info
    await orderRef.update({
      'paymentInfo.capturedPaymentId': paymentId,
      'paymentInfo.capturedAmount': amount,
      'paymentInfo.captureStatus': 'captured',
      'updatedAt': admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[RAZORPAY_WEBHOOK] Order ${orderId} payment captured.`);
  } catch (error: any) {
    console.error("[RAZORPAY_WEBHOOK] Error in handlePaymentCaptured:", error.message);
  }
}

/**
 * Handle refund.created event - Refund initiated
 */
async function handleRefundCreated(event: any) {
  try {
    const paymentId = event.payload.refund.entity.payment_id;
    const refundId = event.payload.refund.entity.id;
    const amount = event.payload.refund.entity.amount / 100; // Convert from paise

    console.log(`[RAZORPAY_WEBHOOK] Refund created: ${refundId} for payment ${paymentId}, amount: ₹${amount}`);

    // Find order by payment ID
    const ordersSnapshot = await db.collection('orders')
      .where('paymentInfo.transactionId', '==', paymentId)
      .limit(1)
      .get();

    if (ordersSnapshot.empty) {
      console.warn(`[RAZORPAY_WEBHOOK] No order found for payment ${paymentId}`);
      return;
    }

    const orderDoc = ordersSnapshot.docs[0];
    const orderId = orderDoc.id;

    await orderDoc.ref.update({
      'paymentInfo.status': 'Refunded',
      'paymentInfo.refundId': refundId,
      'paymentInfo.refundAmount': amount,
      'paymentInfo.refundStatus': 'initiated',
      'internalStatus': 'cancelled',
      'customerFacingStatus': 'cancelled',
      'updatedAt': admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[RAZORPAY_WEBHOOK] Order ${orderId} marked for refund.`);
  } catch (error: any) {
    console.error("[RAZORPAY_WEBHOOK] Error in handleRefundCreated:", error.message);
  }
}

/**
 * Handle refund.processed event - Refund completed
 */
async function handleRefundProcessed(event: any) {
  try {
    const paymentId = event.payload.refund.entity.payment_id;
    const refundId = event.payload.refund.entity.id;
    const amount = event.payload.refund.entity.amount / 100;

    console.log(`[RAZORPAY_WEBHOOK] Refund processed: ${refundId} for payment ${paymentId}, amount: ₹${amount}`);

    // Find order by payment ID
    const ordersSnapshot = await db.collection('orders')
      .where('paymentInfo.transactionId', '==', paymentId)
      .limit(1)
      .get();

    if (ordersSnapshot.empty) {
      console.warn(`[RAZORPAY_WEBHOOK] No order found for payment ${paymentId}`);
      return;
    }

    const orderDoc = ordersSnapshot.docs[0];
    const orderId = orderDoc.id;

    await orderDoc.ref.update({
      'paymentInfo.refundStatus': 'completed',
      'paymentInfo.refundCompletedAt': admin.firestore.FieldValue.serverTimestamp(),
      'updatedAt': admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[RAZORPAY_WEBHOOK] Order ${orderId} refund completed.`);
  } catch (error: any) {
    console.error("[RAZORPAY_WEBHOOK] Error in handleRefundProcessed:", error.message);
  }
}
