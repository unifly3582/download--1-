# Razorpay Online Payment Integration Guide
## For Customer-Facing Website Developer

---

## Overview

This guide explains how to integrate Razorpay online payments into the customer-facing website. The backend APIs are already built and ready to use.

**Backend API Base URL:** `http://localhost:9006` (Development) / `https://admin.jarakitchen.com` (Production)

---

## Integration Flow

```
Customer Checkout → Create Razorpay Order → Open Razorpay Checkout → Payment Success → Verify Payment → Show Success Page
```

---

## Step 1: Load Razorpay Script

Add Razorpay checkout script to your HTML or load it dynamically:

```html
<!-- Option 1: Add to HTML head -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

```javascript
// Option 2: Load dynamically
function loadRazorpayScript() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
```

---

## Step 2: Create Order API Call

When customer clicks "Pay Now" button, call the backend API to create a Razorpay order.

### API Endpoint
```
POST http://localhost:9006/api/razorpay/create-order
```

### Request Body
```json
{
  "orderSource": "customer_app",
  "customerInfo": {
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com"
  },
  "shippingAddress": {
    "street": "123 Main Street, Apartment 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zip": "400001",
    "country": "India"
  },
  "items": [
    {
      "productId": "prod_123",
      "sku": "SKU-001",
      "quantity": 2
    }
  ],
  "paymentInfo": {
    "method": "Prepaid"
  },
  "pricingInfo": {
    "taxes": 0,
    "shippingCharges": 50,
    "prepaidDiscount": 25
  },
  "couponCode": "SAVE10",
  "trafficSource": "instagram"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orderSource` | string | Yes | Always use `"customer_app"` |
| `customerInfo.name` | string | Yes | Customer's full name (min 2 chars) |
| `customerInfo.phone` | string | Yes | Phone with country code (e.g., +919876543210) |
| `customerInfo.email` | string | No | Customer's email |
| `shippingAddress.street` | string | Yes | Full street address (min 5 chars) |
| `shippingAddress.city` | string | Yes | City name |
| `shippingAddress.state` | string | Yes | State name |
| `shippingAddress.zip` | string | Yes | 6-digit PIN code |
| `shippingAddress.country` | string | Yes | Default: "India" |
| `items` | array | Yes | Array of products (min 1 item) |
| `items[].productId` | string | Yes | Product ID from your database |
| `items[].sku` | string | Yes | Product SKU |
| `items[].quantity` | number | Yes | Quantity (min 1) |
| `paymentInfo.method` | string | Yes | Use `"Prepaid"` for online payment |
| `pricingInfo.shippingCharges` | number | No | Shipping charges (auto-calculated if not provided) |
| `pricingInfo.prepaidDiscount` | number | No | Prepaid discount amount |
| `pricingInfo.taxes` | number | No | Tax amount |
| `couponCode` | string | No | Coupon code if customer applied one |
| `trafficSource` | string | No | Traffic source (e.g., "instagram", "facebook", "google") |

### Success Response
```json
{
  "success": true,
  "orderId": "12346",
  "razorpayOrderId": "order_MNOPqrstuvwxyz",
  "amount": 550,
  "currency": "INR",
  "keyId": "rzp_live_RgiwaPT4Dy96E6",
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Invalid order data",
  "details": { /* validation errors */ }
}
```

---

## Step 3: Open Razorpay Checkout

After receiving the success response, open Razorpay checkout modal:

```javascript
async function handlePayment(orderData) {
  try {
    // Step 1: Create order
    const response = await fetch('http://localhost:9006/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (!result.success) {
      alert('Error: ' + result.error);
      return;
    }

    // Step 2: Load Razorpay script (if not already loaded)
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Failed to load payment gateway. Please try again.');
      return;
    }

    // Step 3: Configure Razorpay options
    const options = {
      key: result.keyId,
      amount: result.amount * 100, // Amount in paise
      currency: result.currency,
      name: 'Jara Kitchen',
      description: `Order #${result.orderId}`,
      order_id: result.razorpayOrderId,
      
      // Pre-fill customer details
      prefill: {
        name: result.customerInfo.name,
        email: result.customerInfo.email,
        contact: result.customerInfo.phone
      },
      
      // Theme customization
      theme: {
        color: '#F37254' // Your brand color
      },
      
      // Payment success handler
      handler: async function (response) {
        await handlePaymentSuccess(response, result.orderId);
      },
      
      // Payment modal closed handler
      modal: {
        ondismiss: function() {
          console.log('Payment cancelled by user');
          // Optionally show a message or redirect
        }
      }
    };

    // Step 4: Open Razorpay checkout
    const razorpay = new Razorpay(options);
    razorpay.open();

  } catch (error) {
    console.error('Payment error:', error);
    alert('Something went wrong. Please try again.');
  }
}
```

---

## Step 4: Handle Payment Success

When payment is successful, verify it with the backend:

```javascript
async function handlePaymentSuccess(razorpayResponse, orderId) {
  try {
    // Verify payment with backend
    const response = await fetch('http://localhost:9006/api/razorpay/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
        orderId: orderId
      })
    });

    const result = await response.json();

    if (result.success) {
      // Payment verified successfully
      // Redirect to success page
      window.location.href = `/order-success?orderId=${orderId}`;
    } else {
      alert('Payment verification failed. Please contact support.');
    }

  } catch (error) {
    console.error('Verification error:', error);
    alert('Payment verification failed. Please contact support with Order ID: ' + orderId);
  }
}
```

---

## Complete Example Code

Here's a complete working example:

```javascript
// Complete Razorpay Integration Example

// 1. Load Razorpay Script
function loadRazorpayScript() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// 2. Handle Payment Success
async function handlePaymentSuccess(razorpayResponse, orderId) {
  try {
    const response = await fetch('http://localhost:9006/api/razorpay/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
        orderId: orderId
      })
    });

    const result = await response.json();

    if (result.success) {
      window.location.href = `/order-success?orderId=${orderId}`;
    } else {
      alert('Payment verification failed. Please contact support.');
    }
  } catch (error) {
    console.error('Verification error:', error);
    alert('Payment verification failed. Please contact support with Order ID: ' + orderId);
  }
}

// 3. Main Payment Handler
async function initiatePayment(orderData) {
  try {
    // Create order
    const response = await fetch('http://localhost:9006/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (!result.success) {
      alert('Error: ' + result.error);
      return;
    }

    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Failed to load payment gateway. Please try again.');
      return;
    }

    // Configure Razorpay
    const options = {
      key: result.keyId,
      amount: result.amount * 100,
      currency: result.currency,
      name: 'Jara Kitchen',
      description: `Order #${result.orderId}`,
      order_id: result.razorpayOrderId,
      prefill: {
        name: result.customerInfo.name,
        email: result.customerInfo.email,
        contact: result.customerInfo.phone
      },
      theme: {
        color: '#F37254'
      },
      handler: async function (response) {
        await handlePaymentSuccess(response, result.orderId);
      },
      modal: {
        ondismiss: function() {
          console.log('Payment cancelled');
        }
      }
    };

    // Open Razorpay
    const razorpay = new Razorpay(options);
    razorpay.open();

  } catch (error) {
    console.error('Payment error:', error);
    alert('Something went wrong. Please try again.');
  }
}

// 4. Usage Example - Call this when user clicks "Pay Now"
document.getElementById('payNowButton').addEventListener('click', () => {
  const orderData = {
    orderSource: "customer_app",
    customerInfo: {
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value,
      email: document.getElementById('email').value
    },
    shippingAddress: {
      street: document.getElementById('address').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      zip: document.getElementById('zip').value,
      country: "India"
    },
    items: getCartItems(), // Your function to get cart items
    paymentInfo: {
      method: "Prepaid"
    },
    pricingInfo: {
      shippingCharges: 50,
      prepaidDiscount: 25,
      taxes: 0
    }
  };

  initiatePayment(orderData);
});
```

---

## Important Notes

### 1. **Automatic Features**
- ✅ Stock validation (backend checks product availability)
- ✅ Coupon validation and discount calculation
- ✅ Free shipping on orders above ₹500
- ✅ Prepaid discount application
- ✅ Order confirmation via WhatsApp (automatic after payment)
- ✅ Customer record creation/update

### 2. **Payment Flow**
- Order is created with status `payment_pending`
- After successful payment, webhook updates status to `created_pending`
- Customer receives WhatsApp notification automatically
- Admin can see the order in dashboard

### 3. **Error Handling**
Always handle these scenarios:
- Network errors
- Invalid order data
- Insufficient stock
- Invalid coupon
- Payment gateway errors
- Payment cancellation

### 4. **Testing**
Use these test cards in development:
- **Success:** 4111 1111 1111 1111
- **Failure:** 4111 1111 1111 1112
- CVV: Any 3 digits
- Expiry: Any future date

### 5. **CORS**
The backend already allows requests from:
- `http://localhost:3000`
- `http://localhost:9006`
- `http://ecom.jarakitchen.com`

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/razorpay/create-order` | POST | Create order and Razorpay payment order |
| `/api/razorpay/verify-payment` | POST | Verify payment signature (optional) |

---

## Support

For any issues or questions:
1. Check browser console for errors
2. Verify API endpoint URLs
3. Ensure all required fields are provided
4. Check CORS is enabled for your domain

---

## Production Checklist

Before going live:
- [ ] Update API base URL to production
- [ ] Test complete payment flow
- [ ] Test payment failure scenarios
- [ ] Test payment cancellation
- [ ] Verify WhatsApp notifications work
- [ ] Test with real payment (small amount)
- [ ] Add proper error messages for users
- [ ] Add loading states during payment
- [ ] Test on mobile devices

---

**Last Updated:** November 18, 2024
