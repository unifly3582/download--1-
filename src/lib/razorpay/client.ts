import Razorpay from 'razorpay';

/**
 * Razorpay client instance for server-side operations
 */
export function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Create a Razorpay order for payment
 */
export async function createRazorpayOrder(
  amount: number,
  orderId: string,
  customerInfo: { name: string; email?: string; phone: string }
) {
  const razorpay = getRazorpayInstance();

  const options = {
    amount: Math.round(amount * 100), // Amount in paise
    currency: 'INR',
    receipt: orderId, // Our internal order ID
    notes: {
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone,
      ...(customerInfo.email && { customer_email: customerInfo.email }),
    },
  };

  try {
    const razorpayOrder = await razorpay.orders.create(options);
    return {
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    };
  } catch (error: any) {
    console.error('[RAZORPAY] Error creating order:', error);
    return {
      success: false,
      error: error.message || 'Failed to create Razorpay order',
    };
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const crypto = require('crypto');
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new Error('Razorpay key secret not configured');
  }

  const text = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(text)
    .digest('hex');

  return expectedSignature === razorpaySignature;
}
