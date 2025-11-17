import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/lib/razorpay/client';
import { db } from '@/lib/firebase/server';

/**
 * POST /api/razorpay/verify-payment
 * Verify Razorpay payment signature (optional frontend verification)
 * The webhook will handle the actual order confirmation
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

    // Verify Razorpay order ID matches
    if (orderData?.paymentInfo?.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json({
        success: false,
        error: 'Order ID mismatch'
      }, { status: 400 });
    }

    console.log(`[RAZORPAY_VERIFY] Payment verified for order ${orderId}`);

    // Return success - webhook will handle the actual order update
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully. Your order is being processed.',
      orderId
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
