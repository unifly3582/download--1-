# Razorpay Webhook Events - Complete Guide

## Overview

The webhook handler now supports multiple Razorpay events to provide complete visibility into payment lifecycle and enable automated order management.

## Supported Events

### 1. ✅ order.paid
**When:** Payment is successfully completed for an order

**Actions:**
- Updates order payment status to "Completed"
- Sets order status to "created_pending" or "needs_manual_verification"
- Records coupon usage
- Sends WhatsApp order confirmation notification
- Stores transaction ID

**Order Updates:**
```javascript
{
  paymentInfo: {
    status: 'Completed',
    transactionId: 'pay_xxxxx'
  },
  internalStatus: 'created_pending',
  customerFacingStatus: 'confirmed'
}
```

---

### 2. ❌ payment.failed
**When:** Payment attempt fails (card declined, insufficient funds, etc.)

**Actions:**
- Updates order payment status to "Failed"
- Stores failure reason and error code
- Keeps order in "payment_pending" state
- Customer can retry payment

**Order Updates:**
```javascript
{
  paymentInfo: {
    status: 'Failed',
    failureReason: 'Card declined by issuing bank',
    errorCode: 'BAD_REQUEST_ERROR',
    lastFailedPaymentId: 'pay_xxxxx'
  }
}
```

**Common Error Codes:**
- `BAD_REQUEST_ERROR` - Invalid payment details
- `GATEWAY_ERROR` - Payment gateway issue
- `SERVER_ERROR` - Razorpay server error
- `AUTHENTICATION_ERROR` - 3D Secure failed

---

### 3. 🔐 payment.authorized
**When:** Payment is authorized but not yet captured (for manual capture flow)

**Actions:**
- Records authorization details
- Marks payment as authorized
- Order remains in pending state until capture

**Order Updates:**
```javascript
{
  paymentInfo: {
    authorizedPaymentId: 'pay_xxxxx',
    authorizationStatus: 'authorized'
  }
}
```

**Use Case:** When you want to verify order details before capturing payment

---

### 4. 💰 payment.captured
**When:** Authorized payment is captured (money is actually transferred)

**Actions:**
- Records capture details
- Stores captured amount
- Updates capture status

**Order Updates:**
```javascript
{
  paymentInfo: {
    capturedPaymentId: 'pay_xxxxx',
    capturedAmount: 550,
    captureStatus: 'captured'
  }
}
```

---

### 5. 🔄 refund.created
**When:** Refund is initiated for a payment

**Actions:**
- Updates order payment status to "Refunded"
- Sets order status to "cancelled"
- Records refund ID and amount
- Marks refund as "initiated"

**Order Updates:**
```javascript
{
  paymentInfo: {
    status: 'Refunded',
    refundId: 'rfnd_xxxxx',
    refundAmount: 550,
    refundStatus: 'initiated'
  },
  internalStatus: 'cancelled',
  customerFacingStatus: 'cancelled'
}
```

---

### 6. ✅ refund.processed
**When:** Refund is successfully processed and money is returned to customer

**Actions:**
- Updates refund status to "completed"
- Records refund completion timestamp

**Order Updates:**
```javascript
{
  paymentInfo: {
    refundStatus: 'completed',
    refundCompletedAt: '2024-11-17T10:30:00Z'
  }
}
```

---

## Webhook Configuration in Razorpay Dashboard

### Step 1: Navigate to Webhooks
1. Login to Razorpay Dashboard
2. Go to **Settings** → **Webhooks**
3. Click **"Create New Webhook"**

### Step 2: Configure Webhook
**Webhook URL:**
```
https://admin.jarakitchen.com/api/webhooks/razorpay
```

**Active Events:** Select all of these:
- ✅ `order.paid`
- ✅ `payment.failed`
- ✅ `payment.authorized`
- ✅ `payment.captured`
- ✅ `refund.created`
- ✅ `refund.processed`

**Alert Email:** Your email for webhook failures

### Step 3: Save and Copy Secret
- Click **"Create Webhook"**
- Copy the **Webhook Secret** shown
- Update `.env.local`:
  ```bash
  RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
  ```

---

## Payment Flow Scenarios

### Scenario 1: Successful Payment (Auto-Capture)
```
1. Customer initiates payment
2. payment.authorized → (optional, if enabled)
3. payment.captured → (optional, if enabled)
4. order.paid → Order confirmed ✅
```

### Scenario 2: Failed Payment
```
1. Customer initiates payment
2. payment.failed → Order stays in payment_pending ❌
3. Customer can retry payment
```

### Scenario 3: Refund Flow
```
1. Admin initiates refund
2. refund.created → Order marked as cancelled
3. refund.processed → Refund completed ✅
```

---

## Order Status Transitions

### Payment Pending → Confirmed
```
payment_pending → order.paid → created_pending/needs_manual_verification
```

### Payment Pending → Failed
```
payment_pending → payment.failed → payment_pending (can retry)
```

### Confirmed → Refunded
```
created_pending → refund.created → cancelled
```

---

## Database Schema Updates

### New PaymentInfo Fields

```typescript
paymentInfo: {
  method: "COD" | "Prepaid",
  status: "Pending" | "Completed" | "Failed" | "Refunded",
  transactionId?: string,
  razorpayOrderId?: string,
  
  // Failure tracking
  failureReason?: string,
  errorCode?: string,
  lastFailedPaymentId?: string,
  
  // Authorization tracking
  authorizedPaymentId?: string,
  authorizationStatus?: string,
  
  // Capture tracking
  capturedPaymentId?: string,
  capturedAmount?: number,
  captureStatus?: string,
  
  // Refund tracking
  refundId?: string,
  refundAmount?: number,
  refundStatus?: "initiated" | "completed",
  refundCompletedAt?: Timestamp
}
```

---

## Monitoring & Debugging

### Check Webhook Logs in Razorpay Dashboard
1. Go to **Settings** → **Webhooks**
2. Click on your webhook
3. View **"Recent Deliveries"** tab
4. Check status codes and response times

### Server Logs
All webhook events are logged with prefix `[RAZORPAY_WEBHOOK]`:
```
[RAZORPAY_WEBHOOK] Processing event: order.paid
[RAZORPAY_WEBHOOK] Successfully updated order 12345 to paid status
[RAZORPAY_WEBHOOK] WhatsApp notification sent for 12345
```

### Common Issues

**Webhook not received:**
- Check webhook URL is correct and accessible
- Verify SSL certificate is valid
- Check firewall/security settings

**Signature verification failed:**
- Verify `RAZORPAY_WEBHOOK_SECRET` is correct
- Check for extra spaces or quotes in .env file

**Order not found:**
- Verify order was created before payment
- Check order ID in Razorpay matches database

---

## Testing Webhooks

### Test Mode
1. Use test credentials (`rzp_test_xxxxx`)
2. Make test payment with test card
3. Check webhook delivery in dashboard

### Send Test Webhook
1. Go to Razorpay Dashboard → Webhooks
2. Click on your webhook
3. Click **"Send Test Webhook"**
4. Select event type
5. Check server logs

### Local Testing with ngrok
```bash
# Start ngrok
ngrok http 9006

# Update webhook URL in Razorpay Dashboard
https://your-ngrok-url.ngrok.io/api/webhooks/razorpay

# Make test payment
# Check ngrok web interface for webhook requests
```

---

## Security Best Practices

1. **Always verify webhook signature** ✅ (Already implemented)
2. **Use HTTPS in production** ✅
3. **Keep webhook secret secure** ✅
4. **Validate order IDs** ✅ (Already implemented)
5. **Handle duplicate events** ✅ (Already implemented)
6. **Log all webhook events** ✅ (Already implemented)

---

## Benefits of Multi-Event Handling

### Better Visibility
- Track payment failures and reasons
- Monitor refund status in real-time
- See authorization vs capture separately

### Automated Order Management
- Auto-cancel orders on refund
- Track failed payments for retry
- Handle partial captures

### Customer Experience
- Clear payment status updates
- Automatic refund notifications
- Better error messaging

### Business Intelligence
- Analyze payment failure patterns
- Track refund rates
- Monitor payment success rates

---

## Next Steps

1. ✅ Configure all events in Razorpay Dashboard
2. ✅ Update webhook secret in `.env.local`
3. ✅ Test each event type
4. ✅ Monitor webhook logs
5. ✅ Set up alerts for webhook failures

## Support

For Razorpay webhook issues:
- [Razorpay Webhooks Documentation](https://razorpay.com/docs/webhooks/)
- [Webhook Events Reference](https://razorpay.com/docs/webhooks/events/)
- [Webhook Testing Guide](https://razorpay.com/docs/webhooks/test/)
