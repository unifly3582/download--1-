import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/lib/razorpay/client';
import { db } from '@/lib/firebase/server';
import admin from 'firebase-admin';

/**
 * POST /api/razorpay/verify-payment
 * Verify Razorpay payment signature and confirm order
 * This is the PRIMARY method for order confirmation (webhook is backup)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required payment details'
      }, { status: 400 });
    }

    // Verify signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      console.error(`[RAZORPAY_VERIFY] Invalid signature for order ${orderId}`);
      return NextResponse.json({
        success: false,
        error: 'Invalid payment signature'
      }, { status: 400 });
    }

    // Check if order exists
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    const orderData = orderSnap.data();

    if (!orderData) {
      return NextResponse.json({
        success: false,
        error: 'Order data not found'
      }, { status: 404 });
    }

    // Verify Razorpay order ID matches
    if (orderData.paymentInfo?.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json({
        success: false,
        error: 'Order ID mismatch'
      }, { status: 400 });
    }

    // Check if already processed (prevent duplicate processing)
    if (orderData.paymentInfo?.status === 'Completed') {
      console.log(`[RAZORPAY_VERIFY] Order ${orderId} already processed`);
      return NextResponse.json({
        success: true,
        message: 'Payment already confirmed',
        orderId,
        alreadyProcessed: true
      });
    }

    console.log(`[RAZORPAY_VERIFY] Payment verified for order ${orderId}, confirming order...`);

    // Determine final order status
    const needsManualVerification = orderData.needsManualWeightAndDimensions || false;
    const newInternalStatus = needsManualVerification ? 'needs_manual_verification' : 'created_pending';
    const newCustomerStatus = 'confirmed';

    // Update order with payment confirmation
    await orderRef.update({
      'paymentInfo.status': 'Completed',
      'paymentInfo.transactionId': razorpay_payment_id,
      internalStatus: newInternalStatus,
      customerFacingStatus: newCustomerStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[RAZORPAY_VERIFY] Order ${orderId} confirmed with status: ${newInternalStatus}`);

    // Record coupon usage if applicable
    if (orderData.couponCode && orderData.couponDetails) {
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
        console.log(`[RAZORPAY_VERIFY] Coupon usage recorded for order ${orderId}`);
      } catch (couponError: any) {
        console.error(`[RAZORPAY_VERIFY] Failed to record coupon usage:`, couponError);
        // Don't fail the order confirmation if coupon recording fails
      }
    }

    // Send WhatsApp notification
    try {
      const { createNotificationService } = await import('@/lib/oms/notifications');
      const notificationService = createNotificationService();
      const updatedOrder = { 
        ...orderData, 
        paymentInfo: { ...orderData.paymentInfo, status: 'Completed', transactionId: razorpay_payment_id },
        internalStatus: newInternalStatus,
        customerFacingStatus: newCustomerStatus,
        updatedAt: new Date().toISOString() 
      } as any;
      await notificationService.sendOrderPlacedNotification(updatedOrder);
      console.log(`[RAZORPAY_VERIFY] WhatsApp notification sent for order ${orderId}`);
    } catch (whatsappError: any) {
      console.error(`[RAZORPAY_VERIFY] Failed to send WhatsApp notification:`, whatsappError);
      // Don't fail the order confirmation if WhatsApp fails
    }

    // Return success with order details
    return NextResponse.json({
      success: true,
      message: 'Payment confirmed! Your order has been placed successfully.',
      orderId,
      orderStatus: newCustomerStatus,
      paymentId: razorpay_payment_id,
      orderDetails: {
        orderId: orderData.orderId,
        customerName: orderData.customerInfo.name,
        totalAmount: orderData.pricingInfo.grandTotal,
        items: orderData.items.map((item: any) => ({
          name: item.productName,
          quantity: item.quantity
        }))
      }
    });

  } catch (error: any) {
    console.error('[RAZORPAY_VERIFY] Error verifying payment:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to verify payment',
      details: error.message
    }, { status: 500 });
  }
}
