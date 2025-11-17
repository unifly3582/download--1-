# Customer-Facing Website API Guide

Complete documentation for integrating your customer-facing website with the order management system.

---

## 🛒 ORDER CREATION API

### Endpoint
```
POST /api/customer/orders/create
```

### Authentication
**No authentication required** - This is a public endpoint for customers to place orders.

### Request Body Schema

```typescript
{
  orderSource: "customer_app",  // Required: Must be exactly "customer_app"
  
  // Optional: Traffic source tracking for analytics
  trafficSource?: {
    source: "direct" | "google_search" | "google_ads" | "meta_ads" | 
            "instagram" | "facebook" | "youtube" | "email" | "sms" | 
            "referral" | "organic_social" | "other",
    medium?: string,              // e.g., "cpc", "organic", "social"
    campaign?: string,            // Campaign name
    referrer?: string,            // Full referrer URL
    utmSource?: string,           // UTM parameters
    utmMedium?: string,
    utmCampaign?: string,
    utmContent?: string,
    utmTerm?: string,
    landingPage?: string,         // First page visited
    sessionId?: string            // Track user session
  },
  
  // Optional: Coupon code for discounts
  couponCode?: string,            // e.g., "SAVE20", "WELCOME10"
  
  // Required: Customer information
  customerInfo: {
    name: string,                 // Min 2 characters
    phone: string,                // 10-15 digits (e.g., "+919876543210")
    email?: string                // Optional, must be valid email
  },
  
  // Required: Shipping address
  shippingAddress: {
    street: string,               // Min 5 characters
    city: string,                 // Min 2 characters
    state: string,                // Min 2 characters
    zip: string,                  // Exactly 6 digits
    country: string               // Default: "India"
  },
  
  // Required: Order items (at least 1 item)
  items: [
    {
      productId: string,          // Product ID from your catalog
      variationId?: string,       // Optional: Variation ID if applicable
      quantity: number,           // Min 1
      sku: string                 // Product SKU
    }
  ],
  
  // Required: Payment method
  paymentInfo: {
    method: "COD" | "Prepaid"
  }
}
```

### Example Request

```javascript
const orderData = {
  orderSource: "customer_app",
  
  trafficSource: {
    source: "google_ads",
    medium: "cpc",
    campaign: "summer_sale_2025",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "summer_sale",
    landingPage: "https://yoursite.com/products",
    sessionId: "sess_abc123xyz"
  },
  
  couponCode: "SAVE20",
  
  customerInfo: {
    name: "Rahul Sharma",
    phone: "+919876543210",
    email: "rahul@example.com"
  },
  
  shippingAddress: {
    street: "123, MG Road, Koramangala",
    city: "Bangalore",
    state: "Karnataka",
    zip: "560034",
    country: "India"
  },
  
  items: [
    {
      productId: "PROD_123",
      variationId: "VAR_456",
      quantity: 2,
      sku: "SKU_ABC_001"
    },
    {
      productId: "PROD_789",
      quantity: 1,
      sku: "SKU_XYZ_002"
    }
  ],
  
  paymentInfo: {
    method: "COD"
  }
};

// Make the API call
const response = await fetch('/api/customer/orders/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(orderData)
});

const result = await response.json();
```

### Success Response (201 Created)

```json
{
  "success": true,
  "orderId": "12345",
  "message": "Order placed successfully",
  "orderDetails": {
    "orderId": "12345",
    "totalAmount": 1075,
    "discount": 200,
    "expectedDelivery": "2025-11-16T10:30:00.000Z"
  }
}
```

### Error Responses

**400 Bad Request - Invalid Data**
```json
{
  "success": false,
  "error": "Invalid order data",
  "details": {
    "fieldErrors": {
      "customerInfo.phone": ["String must contain at least 10 character(s)"],
      "items": ["Array must contain at least 1 element(s)"]
    }
  }
}
```

**400 Bad Request - Product Issues**
```json
{
  "success": false,
  "error": "Product not found: PROD_123"
}
```

```json
{
  "success": false,
  "error": "Insufficient stock for Product Name. Available: 5, Requested: 10"
}
```

**400 Bad Request - Invalid Coupon**
```json
{
  "success": false,
  "error": "Coupon code is invalid or expired"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Failed to create order",
  "details": "Error message"
}
```

---

## 💰 PRICING CALCULATION

The API automatically calculates:

1. **Subtotal**: Sum of (unitPrice × quantity) for all items
2. **Discount**: Applied if valid coupon code provided
3. **Taxes**: Currently ₹0 (configurable)
4. **Shipping Charges**: 
   - ₹0 if order value > ₹500
   - ₹0 if free shipping coupon applied
   - ₹50 otherwise
5. **COD Charges**: Calculated from checkout settings if payment method is COD, ₹0 for Prepaid
6. **Prepaid Discount**: Calculated from checkout settings if payment method is Prepaid, ₹0 for COD
7. **Grand Total**: Subtotal - Discount - Prepaid Discount + Taxes + Shipping + COD Charges

### Example Calculation

```
Subtotal:         ₹1,200
Discount (SAVE20): -₹240  (20% off)
Taxes:            ₹0
Shipping:         ₹0      (order > ₹500)
COD Charges:      ₹25     (COD payment, from settings)
Prepaid Discount: ₹0      (not applicable for COD)
─────────────────────────
Grand Total:      ₹985
```

---

## 🎟️ COUPON VALIDATION API

Before creating an order, validate coupon codes to show discount preview.

### Endpoint
```
POST /api/customer/coupons/validate
```

### Request Body

```typescript
{
  couponCode: string,           // Required
  customerId?: string,          // Optional
  customerPhone?: string,       // Optional
  orderValue: number,           // Required: Current cart value
  items?: [                     // Optional: For product-specific coupons
    {
      productId: string,
      quantity: number,
      unitPrice: number,
      sku: string
    }
  ]
}
```

### Example Request

```javascript
const validateCoupon = async (couponCode, cartValue, items) => {
  const response = await fetch('/api/customer/coupons/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      couponCode: couponCode,
      customerPhone: "+919876543210",
      orderValue: cartValue,
      items: items
    })
  });
  
  return await response.json();
};

// Usage
const result = await validateCoupon("SAVE20", 1200, cartItems);
```

### Success Response

```json
{
  "success": true,
  "data": {
    "isValid": true,
    "discountAmount": 240,
    "couponType": "percentage",
    "description": "Get 20% off on all orders",
    "finalAmount": 960
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Coupon code is invalid or expired"
}
```

---

## 📦 FETCH CUSTOMER ORDERS

### Endpoint
```
GET /api/customer/orders
```

### Query Parameters

- `customerId` (optional): Customer's unique ID
- `phone` (optional): Customer's phone number
- `limit` (optional): Number of orders (1-50, default: 20)

**Note**: Either `customerId` OR `phone` is required.

### Example Requests

```javascript
// By phone number
fetch('/api/customer/orders?phone=9876543210&limit=20')

// By phone with country code
fetch('/api/customer/orders?phone=%2B919876543210&limit=20')

// By customer ID
fetch('/api/customer/orders?customerId=CUS_123&limit=10')
```

### Success Response

```json
{
  "success": true,
  "data": [
    {
      "orderId": "12345",
      "customerId": "CUS_123",
      "customerPhone": "+919876543210",
      "orderDate": "2025-11-13T10:30:00.000Z",
      "orderStatus": "shipped",
      "items": [
        {
          "productName": "Product Name - Variation",
          "quantity": 2,
          "sku": "SKU_ABC_001"
        }
      ],
      "totalAmount": 1075,
      "paymentMethod": "COD",
      "shippingAddress": {
        "name": "Rahul Sharma",
        "street": "123, MG Road",
        "city": "Bangalore",
        "state": "Karnataka",
        "zip": "560034"
      },
      "tracking": {
        "courierPartner": "Delhivery",
        "awb": "AWB123456789",
        "trackingUrl": "https://track.delhivery.com/...",
        "currentStatus": "In Transit",
        "currentLocation": "Mumbai Hub",
        "lastUpdate": "2025-11-13T08:00:00.000Z",
        "expectedDeliveryDate": "2025-11-15T18:00:00.000Z",
        "trackingEvents": [
          {
            "timestamp": "2025-11-13T10:30:00.000Z",
            "status": "Order Confirmed",
            "description": "Your order has been confirmed",
            "location": "Warehouse"
          },
          {
            "timestamp": "2025-11-13T14:00:00.000Z",
            "status": "Shipped",
            "description": "Your order has been shipped",
            "location": "In Transit"
          }
        ]
      },
      "supportInfo": {
        "canCancel": false,
        "canReturn": false,
        "returnWindowDays": 7,
        "supportPhone": "+91-1234567890",
        "supportEmail": "support@bugglyfarms.com"
      },
      "createdAt": "2025-11-13T10:30:00.000Z",
      "updatedAt": "2025-11-13T14:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Order Status Values

- `confirmed`: Order placed, awaiting processing
- `processing`: Order is being prepared
- `shipped`: Order has been shipped
- `out_for_delivery`: Order is out for delivery
- `delivered`: Order delivered successfully
- `cancelled`: Order cancelled
- `returned`: Order returned

---

## 📋 FETCH SINGLE ORDER DETAILS

### Endpoint
```
GET /api/customer/orders/[orderId]
```

### Example Request

```javascript
fetch('/api/customer/orders/12345')
```

### Response

Same structure as individual order in the list above.

---

## 📍 TRACK ORDER BY AWB (Guest Tracking)

For customers who don't have account but have AWB number.

### Endpoint
```
GET /api/customer/tracking/[awb]
```

### Example Request

```javascript
fetch('/api/customer/tracking/AWB123456789')
```

### Success Response

```json
{
  "success": true,
  "data": {
    "orderId": "12345",
    "orderStatus": "shipped",
    "orderDate": "2025-11-13T10:30:00.000Z",
    "itemCount": 2,
    "tracking": {
      "courierPartner": "Delhivery",
      "awb": "AWB123456789",
      "trackingUrl": "https://track.delhivery.com/...",
      "currentStatus": "In Transit",
      "currentLocation": "Mumbai Hub",
      "lastUpdate": "2025-11-13T08:00:00.000Z",
      "trackingEvents": [...]
    },
    "deliveryLocation": {
      "city": "Bangalore",
      "state": "Karnataka",
      "zip": "560034"
    },
    "supportInfo": {
      "canCancel": false,
      "canReturn": false,
      "returnWindowDays": 7,
      "supportPhone": "+91-1234567890",
      "supportEmail": "support@bugglyfarms.com"
    }
  }
}
```

---

## 👤 CUSTOMER PROFILE API

### Get Profile

**Endpoint**: `POST /api/customer/profile`

```javascript
const response = await fetch('/api/customer/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get',
    phone: '+919876543210'
  })
});
```

**Response**:
```json
{
  "success": true,
  "data": {
    "customerId": "CUS_123",
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "phone": "+919876543210",
    "defaultAddress": {
      "street": "123, MG Road",
      "city": "Bangalore",
      "state": "Karnataka",
      "zip": "560034",
      "country": "India"
    },
    "savedAddresses": [...],
    "loyaltyTier": "silver",
    "totalOrders": 15,
    "memberSince": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Profile

```javascript
const response = await fetch('/api/customer/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'update',
    phone: '+919876543210',
    name: 'Rahul Sharma',
    email: 'rahul.new@example.com',
    defaultAddress: {
      street: "456 New Street",
      city: "Mumbai",
      state: "Maharashtra",
      zip: "400001",
      country: "India"
    }
  })
});
```

---

## 🏠 ADDRESS MANAGEMENT API

### Endpoint
```
POST /api/customer/addresses
```

### Get All Addresses

```javascript
const response = await fetch('/api/customer/addresses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+919876543210',
    action: 'get'
  })
});
```

**Response**:
```json
{
  "success": true,
  "data": {
    "defaultAddress": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zip": "400001",
      "country": "India"
    },
    "savedAddresses": [
      {
        "street": "456 Work St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "zip": "400002",
        "country": "India"
      }
    ],
    "totalAddresses": 2
  }
}
```

### Add New Address

```javascript
await fetch('/api/customer/addresses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+919876543210',
    action: 'add',
    address: {
      street: "789 New Street",
      city: "Delhi",
      state: "Delhi",
      zip: "110001",
      country: "India"
    },
    setAsDefault: true  // Optional
  })
});
```

### Update Address

```javascript
await fetch('/api/customer/addresses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+919876543210',
    action: 'update',
    oldAddress: {
      street: "123 Main St",
      city: "Mumbai",
      state: "Maharashtra",
      zip: "400001",
      country: "India"
    },
    newAddress: {
      street: "123 Main Street, Apt 5B",
      city: "Mumbai",
      state: "Maharashtra",
      zip: "400001",
      country: "India"
    },
    setAsDefault: false  // Optional
  })
});
```

### Remove Address

```javascript
await fetch('/api/customer/addresses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+919876543210',
    action: 'remove',
    address: {
      street: "456 Work St",
      city: "Mumbai",
      state: "Maharashtra",
      zip: "400002",
      country: "India"
    }
  })
});
```

### Set Default Address

```javascript
await fetch('/api/customer/addresses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+919876543210',
    action: 'setDefault',
    address: {
      street: "789 New Street",
      city: "Delhi",
      state: "Delhi",
      zip: "110001",
      country: "India"
    }
  })
});
```

---

## 🔄 COMPLETE ORDER FLOW

### 1. Customer Browses Products
- Display products from your catalog
- Show prices, images, descriptions

### 2. Add to Cart
- Store items in local state/storage
- Calculate subtotal

### 3. Apply Coupon (Optional)
```javascript
// Validate coupon before checkout
const couponResult = await fetch('/api/customer/coupons/validate', {
  method: 'POST',
  body: JSON.stringify({
    couponCode: 'SAVE20',
    orderValue: cartSubtotal,
    items: cartItems
  })
});

if (couponResult.success) {
  // Show discount amount
  // Update total
}
```

### 4. Checkout - Collect Information
- Customer name, phone, email
- Shipping address
- Payment method (COD/Prepaid)

### 5. Create Order
```javascript
const orderResult = await fetch('/api/customer/orders/create', {
  method: 'POST',
  body: JSON.stringify({
    orderSource: 'customer_app',
    trafficSource: capturedTrafficData,
    couponCode: appliedCoupon,
    customerInfo: { name, phone, email },
    shippingAddress: selectedAddress,
    items: cartItems,
    paymentInfo: { method: 'COD' }
  })
});

if (orderResult.success) {
  // Show order confirmation
  // Display orderId
  // Clear cart
  // Redirect to order details
}
```

### 6. Order Confirmation
- Show order ID
- Display order summary
- Show expected delivery date
- Provide tracking link

### 7. Track Order
```javascript
// Fetch order details
const order = await fetch(`/api/customer/orders/${orderId}`);

// Display:
// - Order status
// - Tracking information
// - Delivery updates
```

---

## 🎯 AUTOMATIC FEATURES

When an order is created, the system automatically:

1. ✅ **Creates/Updates Customer**: Customer profile created or updated
2. ✅ **Validates Products**: Checks product existence and stock availability
3. ✅ **Calculates Pricing**: Subtotal, discounts, shipping, COD charges, prepaid discounts (from checkout settings)
4. ✅ **Applies Coupons**: Validates and applies discount codes
5. ✅ **Records Coupon Usage**: Tracks coupon redemptions
6. ✅ **Calculates Weight/Dimensions**: For shipping calculations
7. ✅ **Generates Order ID**: Unique sequential order number
8. ✅ **Sends WhatsApp Notification**: Order confirmation to customer
9. ✅ **Updates Customer Stats**: Total orders, loyalty tier

---

## 🚨 ERROR HANDLING

Always handle errors gracefully:

```javascript
try {
  const response = await fetch('/api/customer/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  
  const result = await response.json();
  
  if (!result.success) {
    // Show error to user
    alert(result.error);
    
    // Log details for debugging
    console.error('Order creation failed:', result.details);
  } else {
    // Success - redirect to confirmation
    window.location.href = `/orders/${result.orderId}`;
  }
} catch (error) {
  // Network or parsing error
  console.error('Request failed:', error);
  alert('Unable to place order. Please try again.');
}
```

---

## 📱 CORS SUPPORT

All customer-facing APIs include CORS headers for cross-origin requests. You can call these APIs from:
- Different domains
- Mobile apps
- Third-party integrations

---

## 🔐 SECURITY NOTES

1. **No Authentication Required**: These are public endpoints
2. **Rate Limiting**: Consider implementing rate limiting on your frontend
3. **Input Validation**: All inputs are validated server-side
4. **Phone Verification**: Consider adding OTP verification for orders
5. **Sensitive Data**: Customer emails and addresses are protected

---

## 📊 ANALYTICS & TRACKING

### Traffic Source Tracking

Capture and send traffic source data with every order:

```javascript
// Capture UTM parameters from URL
const urlParams = new URLSearchParams(window.location.search);

const trafficSource = {
  source: urlParams.get('utm_source') || 'direct',
  medium: urlParams.get('utm_medium'),
  campaign: urlParams.get('utm_campaign'),
  utmSource: urlParams.get('utm_source'),
  utmMedium: urlParams.get('utm_medium'),
  utmCampaign: urlParams.get('utm_campaign'),
  utmContent: urlParams.get('utm_content'),
  utmTerm: urlParams.get('utm_term'),
  referrer: document.referrer,
  landingPage: window.location.href,
  sessionId: getOrCreateSessionId()
};

// Include in order creation
orderData.trafficSource = trafficSource;
```

This helps track:
- Which marketing campaigns drive sales
- Customer acquisition channels
- ROI on advertising spend

---

## 🎉 SUMMARY

Your customer-facing website needs these APIs:

| Feature | Endpoint | Method |
|---------|----------|--------|
| Create Order | `/api/customer/orders/create` | POST |
| List Orders | `/api/customer/orders` | GET |
| Order Details | `/api/customer/orders/[orderId]` | GET |
| Track by AWB | `/api/customer/tracking/[awb]` | GET |
| Validate Coupon | `/api/customer/coupons/validate` | POST |
| Get Profile | `/api/customer/profile` | POST |
| Update Profile | `/api/customer/profile` | POST |
| Manage Addresses | `/api/customer/addresses` | POST |

All endpoints are **public** (no auth required) and include **CORS support**.
