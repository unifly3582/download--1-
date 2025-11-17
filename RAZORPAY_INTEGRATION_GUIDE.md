# Razorpay Integration Guide

## Overview

This document describes the complete Razorpay payment integration for prepaid orders. The integration ensures that prepaid orders are only created after successful payment confirmation.

## Architecture

### Payment Flow

#### COD Orders
1. Customer submits order with `paymentInfo.method: "COD"`
2. Order is created immediately via `/api/customer/orders/create`
3. Order status: `created_pending`
4. WhatsApp notification sent immediately

#### Prepaid Orders
1. Customer submits order with `paymentInfo.method: "Prepaid"`
2. Backend creates pending order and Razorpay order via `/api/razorpay/create-order`
3. Order status: `payment_pending`
4. Frontend receives Razorpay order details
5. Customer completes payment via Razorpay checkout
6. Razorpay webhook confirms payment via `/api/webhooks/razorpay`
7. Order status updated to `created_pending` or `needs_manual_verification`
8. Coupon usage recorded
9. WhatsApp notification sent

## API Endpoints

### 1. Create COD Order
**Endpoint:** `POST /api/customer/orders/create`

**Purpose:** Create Cash on Delivery orders

**Request Body:**
```json
{
  "customerInfo": {
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com"
  },
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zip": "400001",
    "country": "India"
  },
  "items": [
    {
      "productId": "prod_123",
      "sku": "SKU123",
      "quantity": 2
    }
  ],
  "paymentInfo": {
    "method": "COD"
  },
  "pricingInfo": {
    "taxes": 0,
    "shippingCharges": 50,
    "codCharges": 25
  }
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "12345",
  "message": "Order placed successfully",
  "orderDetails": {
    "orderId": "12345",
    "totalAmount": 575,
    "discount": 0,
    "expectedDelivery": "2024-11-20T00:00:00.000Z"
  }
}
```

### 2. Create Prepaid Order (Razorpay)
**Endpoint:** `POST /api/razorpay/create-order`

**Purpose:** Create a pending order and Razorpay payment order for prepaid orders

**Request Body:** Same as COD but with `"method": "Prepaid"`

**Response:**
```json
{
  "success": true,
  "orderId": "12346",
  "razorpayOrderId": "order_MNOPqrstuvwxyz",
  "amount": 550,
  "currency": "INR",
  "keyId": "rzp_test_xxxxx",
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210"
  }
}
```

### 3. Verify Payment (Optional)
**Endpoint:** `POST /api/razorpay/verify-payment`

**Purpose:** Frontend verification of payment signature (webhook handles actual confirmation)

**Request Body:**
```json
{
  "razorpay_order_id": "order_MNOPqrstuvwxyz",
  "razorpay_payment_id": "pay_ABCDefghijklmn",
  "razorpay_signature": "signature_hash",
  "orderId": "12346"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully. Your order is being processed.",
  "orderId": "12346"
}
```

### 4. Razorpay Webhook
**Endpoint:** `POST /api/webhooks/razorpay`

**Purpose:** Receive payment confirmation from Razorpay

**Webhook Event:** `order.paid`

**Actions:**
- Verifies webhook signature
- Updates order payment status to "Completed"
- Updates order status to `created_pending` or `needs_manual_verification`
- Records coupon usage
- Sends WhatsApp notification

## Environment Variables

Add these to your `.env.local` and production environment:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxx              # Your Razorpay Key ID
RAZORPAY_KEY_SECRET=your_secret_key         # Your Razorpay Key Secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret # Webhook signing secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx  # Public key for frontend
```

## Frontend Integration

### Example: Razorpay Checkout

```typescript
// 1. Create order
const response = await fetch('/api/razorpay/create-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerInfo: { /* ... */ },
    shippingAddress: { /* ... */ },
    items: [ /* ... */ ],
    paymentInfo: { method: 'Prepaid' }
  })
});

const { razorpayOrderId, amount, keyId, customerInfo, orderId } = await response.json();

// 2. Load Razorpay script
const script = document.createElement('script');
script.src = 'https://checkout.razorpay.com/v1/checkout.js';
document.body.appendChild(script);

// 3. Initialize Razorpay checkout
const options = {
  key: keyId,
  amount: amount * 100, // Amount in paise
  currency: 'INR',
  name: 'Your Store Name',
  description: `Order #${orderId}`,
  order_id: razorpayOrderId,
  prefill: {
    name: customerInfo.name,
    email: customerInfo.email,
    contact: customerInfo.phone
  },
  handler: async function (response) {
    // Payment successful
    const verifyResponse = await fetch('/api/razorpay/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        orderId: orderId
      })
    });
    
    if (verifyResponse.ok) {
      // Redirect to success page
      window.location.href = `/order-success?orderId=${orderId}`;
    }
  },
  modal: {
    ondismiss: function() {
      // Payment cancelled
      alert('Payment cancelled');
    }
  }
};

const razorpay = new Razorpay(options);
razorpay.open();
```

## Order Status Flow

### Prepaid Order Statuses

1. **payment_pending** (Initial)
   - Order created but payment not completed
   - Customer sees: "Payment Pending"

2. **created_pending** (After Payment)
   - Payment completed, awaiting approval
   - Customer sees: "Confirmed"

3. **needs_manual_verification** (After Payment - if weight/dimensions need verification)
   - Payment completed but needs manual review
   - Customer sees: "Confirmed"

## Security Features

1. **Webhook Signature Verification**
   - All webhook requests are verified using HMAC SHA256
   - Invalid signatures are rejected

2. **Payment Signature Verification**
   - Frontend payment responses are verified
   - Prevents tampering with payment data

3. **Order ID Matching**
   - Webhook verifies Razorpay order ID matches database
   - Prevents payment replay attacks

4. **Duplicate Payment Prevention**
   - Checks if order is already marked as paid
   - Prevents double processing

5. **COD/Prepaid Separation**
   - COD orders cannot be created via Razorpay endpoint
   - Prepaid orders cannot be created via COD endpoint

## Testing

### Test Mode Setup

1. Get test credentials from Razorpay Dashboard
2. Use test key ID starting with `rzp_test_`
3. Use test cards from Razorpay documentation

### Test Cards

- **Success:** 4111 1111 1111 1111
- **Failure:** 4111 1111 1111 1112
- CVV: Any 3 digits
- Expiry: Any future date

### Webhook Testing

Use Razorpay Dashboard to send test webhooks or use ngrok for local testing:

```bash
ngrok http 9006
# Update webhook URL in Razorpay Dashboard to: https://your-ngrok-url.ngrok.io/api/webhooks/razorpay
```

## Troubleshooting

### Order stuck in payment_pending

**Cause:** Webhook not received or failed
**Solution:** 
- Check Razorpay Dashboard webhook logs
- Verify webhook URL is accessible
- Check webhook secret is correct

### Payment successful but order not confirmed

**Cause:** Webhook processing error
**Solution:**
- Check server logs for webhook errors
- Verify order exists in database
- Check Razorpay order ID matches

### Invalid signature error

**Cause:** Incorrect webhook secret or key secret
**Solution:**
- Verify `RAZORPAY_WEBHOOK_SECRET` matches Razorpay Dashboard
- Verify `RAZORPAY_KEY_SECRET` is correct

## Production Checklist

- [ ] Replace test credentials with live credentials
- [ ] Update webhook URL to production domain
- [ ] Test webhook delivery in production
- [ ] Enable webhook signature verification
- [ ] Set up monitoring for failed webhooks
- [ ] Test complete payment flow end-to-end
- [ ] Verify WhatsApp notifications are sent
- [ ] Test coupon usage recording
- [ ] Verify order status transitions

## Support

For Razorpay-specific issues, refer to:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)
