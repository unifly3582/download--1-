# 🎟️ Coupon System - Complete Guide

## Overview

Your application has a **comprehensive coupon/discount management system** that allows admins to create flexible discount codes and customers to apply them during checkout. The system supports multiple coupon types, usage restrictions, and automatic validation.

---

## 📋 Table of Contents

1. [Coupon Types](#coupon-types)
2. [Features & Capabilities](#features--capabilities)
3. [Admin Management](#admin-management)
4. [Customer Usage](#customer-usage)
5. [API Integration](#api-integration)
6. [Database Structure](#database-structure)
7. [Implementation Details](#implementation-details)

---

## 🎯 Coupon Types

### 1. **Percentage Discount**
- Reduces order value by a percentage (e.g., 20% off)
- Can set maximum discount cap (e.g., max ₹200 off)
- Example: `SAVE20` gives 20% off with max ₹200 discount

### 2. **Fixed Amount Discount**
- Reduces order value by a fixed amount (e.g., ₹100 off)
- Applied directly to subtotal
- Example: `FLAT100` gives ₹100 off

### 3. **Free Shipping**
- Waives shipping charges (normally ₹50 for orders < ₹500)
- Automatically applied during checkout
- Example: `FREESHIP` removes shipping charges

---

## ✨ Features & Capabilities

### Usage Controls

1. **Single Use**: Coupon can only be used once globally
2. **Multi Use**: Can be used multiple times with optional limit
3. **Unlimited**: No usage restrictions

### User Restrictions

1. **All Users**: Anyone can use the coupon
2. **New Users Only**: Only customers with no previous orders
3. **Specific Users**: Restricted to specific phone numbers/customer IDs

### Order Restrictions

- **Minimum Order Value**: Require minimum cart value (e.g., ₹500)
- **Maximum Discount**: Cap the discount amount for percentage coupons
- **Product Restrictions**: Apply only to specific products
- **Product Exclusions**: Exclude certain products from discount
- **Per-User Limit**: Limit how many times each user can use the coupon

### Validity Period

- **Valid From**: Start date for coupon activation
- **Valid Until**: Expiration date
- **Active Status**: Can be enabled/disabled anytime

---

## 🛠️ Admin Management

### Dashboard Location
Navigate to: **`/coupons`** in the admin dashboard

### Creating a Coupon

1. Click **"Create Coupon"** button
2. Fill in the form:

```typescript
{
  code: "SAVE20",                    // Coupon code (3-20 chars)
  type: "percentage",                // percentage | fixed_amount | free_shipping
  value: 20,                         // 20% or ₹20
  usageType: "multi_use",            // single_use | multi_use | unlimited
  maxUsageCount: 100,                // Optional: Total usage limit
  maxUsagePerUser: 1,                // Optional: Per-user limit
  applicableUsers: "all",            // all | new_users_only | specific_users
  specificPhones: ["+919876543210"], // For specific_users only
  minimumOrderValue: 500,            // Optional: Min cart value
  maximumDiscountAmount: 200,        // Optional: Max discount cap
  validFrom: "2024-01-01",           // Start date
  validUntil: "2024-12-31",          // End date
  description: "Get 20% off on all orders above ₹500",
  isActive: true                     // Enable/disable
}
```

### Managing Coupons

**View Tabs:**
- **Active**: Currently active coupons
- **Inactive**: Deactivated coupons
- **All**: Complete list

**Actions Available:**
- **View Stats**: See usage statistics, total discount given, unique users
- **Edit**: Modify usage limits, validity, description, active status
- **Deactivate**: Soft delete (sets `isActive: false`)

**Coupon Display Shows:**
- Code (e.g., `SAVE20`)
- Type & Value (e.g., "20% off")
- Usage count (e.g., "45/100 used")
- Valid until date
- Status badge (Active/Inactive/Expired)
- Minimum order value

### Editing Restrictions

**Cannot Edit:**
- Coupon code
- Discount type
- Discount value
- Usage type (single/multi)
- Current usage count

**Can Edit:**
- Active status (enable/disable)
- Maximum usage count
- Per-user usage limit
- Minimum order value
- Maximum discount amount
- Valid until date
- Description

---

## 🛒 Customer Usage

### Frontend Integration

Use the **`CouponInput`** component for customer-facing checkout:

```tsx
import { CouponInput } from '@/components/coupon-input';

<CouponInput
  orderValue={1200}
  items={cartItems}
  customerPhone="+919876543210"
  onCouponApplied={(couponData) => {
    // Handle successful coupon application
    console.log('Discount:', couponData.discountAmount);
    console.log('Final Amount:', couponData.finalAmount);
  }}
  onCouponRemoved={() => {
    // Handle coupon removal
  }}
  appliedCoupon={appliedCouponState}
/>
```

### Component Features

- **Input Field**: Enter coupon code (auto-uppercase)
- **Apply Button**: Validates and applies coupon
- **Applied Badge**: Shows applied coupon with discount amount
- **Remove Button**: Remove applied coupon
- **Order Summary**: Shows subtotal, discount, and final total
- **Real-time Validation**: Instant feedback on invalid coupons

### User Experience

1. Customer enters coupon code
2. System validates in real-time
3. Shows discount amount if valid
4. Updates order total automatically
5. Displays error message if invalid
6. Can remove and try different coupon

---

## 🔌 API Integration

### 1. Validate Coupon (Customer-Facing)

**Endpoint:** `POST /api/customer/coupons/validate`

**No authentication required** - Public endpoint for customer apps

**Request:**
```json
{
  "couponCode": "SAVE20",
  "orderValue": 1200,
  "customerPhone": "+919876543210",
  "customerId": "cust_123",
  "items": [
    {
      "productId": "prod_1",
      "quantity": 2,
      "unitPrice": 600,
      "sku": "SKU001"
    }
  ]
}
```

**Success Response:**
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

**Error Response:**
```json
{
  "success": false,
  "error": "Coupon has expired"
}
```

### 2. Create Order with Coupon

**Endpoint:** `POST /api/customer/orders/create`

**Request:**
```json
{
  "couponCode": "SAVE20",
  "items": [...],
  "customerInfo": {...},
  "shippingAddress": {...},
  "paymentInfo": {
    "method": "COD"
  }
}
```

**Process:**
1. Validates coupon code
2. Calculates discount
3. Applies to order total
4. Records coupon usage
5. Creates order
6. Sends confirmation

### 3. Admin APIs

**List Coupons:** `GET /api/admin/coupons?isActive=true`
**Create Coupon:** `POST /api/admin/coupons`
**Get Coupon:** `GET /api/admin/coupons/[couponId]`
**Update Coupon:** `PUT /api/admin/coupons/[couponId]`
**Deactivate:** `DELETE /api/admin/coupons/[couponId]`

All admin APIs require authentication with `admin` role.

---

## 💾 Database Structure

### Collections

#### 1. `coupons` Collection

```typescript
{
  couponId: string;              // UUID
  code: string;                  // "SAVE20" (uppercase)
  type: "percentage" | "fixed_amount" | "free_shipping";
  value: number;                 // 20 or 100
  
  // Usage limits
  usageType: "single_use" | "multi_use" | "unlimited";
  maxUsageCount?: number;        // Total usage limit
  currentUsageCount: number;     // Current usage
  maxUsagePerUser?: number;      // Per-user limit
  
  // User restrictions
  applicableUsers: "all" | "specific_users" | "new_users_only";
  specificUserIds?: string[];
  specificPhones?: string[];
  
  // Order restrictions
  minimumOrderValue?: number;
  maximumDiscountAmount?: number;
  applicableProducts?: string[]; // Product IDs
  excludedProducts?: string[];   // Excluded product IDs
  
  // Validity
  validFrom: string;             // ISO datetime
  validUntil: string;            // ISO datetime
  isActive: boolean;
  
  // Metadata
  createdBy: string;             // Admin user ID
  description?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 2. `couponUsage` Collection

Tracks every coupon redemption:

```typescript
{
  usageId: string;               // UUID
  couponId: string;              // Reference to coupon
  couponCode: string;            // "SAVE20"
  orderId: string;               // Order ID
  customerId: string;            // Customer ID
  customerPhone: string;         // Phone number
  discountAmount: number;        // Actual discount given
  orderValue: number;            // Order subtotal
  usedAt: string;                // ISO datetime
}
```

#### 3. Order Document (Coupon Fields)

```typescript
{
  orderId: string;
  couponCode?: string;           // Applied coupon code
  couponDetails?: {
    couponId: string;
    discountAmount: number;
    couponType: string;
  },
  pricingInfo: {
    subtotal: number;
    discount: number,            // From coupon
    taxes: number;
    shippingCharges: number;     // 0 if free_shipping coupon
    codCharges: number;
    prepaidDiscount: number;
    grandTotal: number;
  }
  // ... other order fields
}
```

---

## 🔧 Implementation Details

### Core Files

**Types:**
- `src/types/coupon.ts` - TypeScript types and Zod schemas

**Business Logic:**
- `src/lib/oms/couponSystem.ts` - Core coupon functions
  - `validateCoupon()` - Validates coupon eligibility
  - `calculateDiscount()` - Calculates discount amount
  - `recordCouponUsage()` - Records usage in database
  - `createCoupon()` - Creates new coupon
  - `getCouponStats()` - Gets usage statistics

**Components:**
- `src/components/coupon-input.tsx` - Customer-facing input component

**Admin Pages:**
- `src/app/(dashboard)/coupons/page.tsx` - Coupon list page
- `src/app/(dashboard)/coupons/create-coupon-dialog.tsx` - Create dialog
- `src/app/(dashboard)/coupons/edit-coupon-dialog.tsx` - Edit dialog
- `src/app/(dashboard)/coupons/coupon-stats-dialog.tsx` - Statistics dialog

**API Routes:**
- `src/app/api/customer/coupons/validate/route.ts` - Public validation
- `src/app/api/admin/coupons/route.ts` - List & create
- `src/app/api/admin/coupons/[couponId]/route.ts` - Get, update, delete

### Validation Logic

The `validateCoupon()` function checks:

1. ✅ Coupon exists and is active
2. ✅ Current date is within validity period
3. ✅ Usage limit not exceeded (global)
4. ✅ User is eligible (all/new/specific)
5. ✅ Per-user usage limit not exceeded
6. ✅ Order value meets minimum requirement
7. ✅ Products are applicable (if restricted)
8. ✅ No excluded products in cart

### Discount Calculation

```typescript
// Percentage discount
discount = (orderValue * percentage) / 100;
if (maximumDiscountAmount) {
  discount = Math.min(discount, maximumDiscountAmount);
}

// Fixed amount discount
discount = Math.min(fixedAmount, orderValue);

// Free shipping
shippingCharges = 0; // Applied in order calculation
```

### Order Total Calculation

```typescript
grandTotal = subtotal 
           - discount           // From coupon
           - prepaidDiscount    // From checkout settings
           + taxes 
           + shippingCharges    // 0 if free_shipping coupon
           + codCharges;
```

### Usage Recording

When an order is created with a coupon:

1. **Atomic Transaction** using Firestore batch:
   - Creates `couponUsage` document
   - Increments `currentUsageCount` in coupon document
   - Updates coupon `updatedAt` timestamp

2. **Recorded Data**:
   - Usage ID, coupon ID, order ID
   - Customer ID and phone
   - Discount amount and order value
   - Timestamp

---

## 📊 Example Scenarios

### Scenario 1: Percentage Discount

**Coupon:** `SAVE20` - 20% off, max ₹200 discount, min order ₹500

**Cart:**
- Subtotal: ₹1,200
- Discount: ₹200 (20% = ₹240, capped at ₹200)
- Shipping: ₹0 (order > ₹500)
- COD Charges: ₹25
- **Total: ₹1,025**

### Scenario 2: Fixed Amount

**Coupon:** `FLAT100` - ₹100 off, no minimum

**Cart:**
- Subtotal: ₹400
- Discount: ₹100
- Shipping: ₹50 (order < ₹500)
- COD Charges: ₹25
- **Total: ₹375**

### Scenario 3: Free Shipping

**Coupon:** `FREESHIP` - Free shipping

**Cart:**
- Subtotal: ₹300
- Discount: ₹0
- Shipping: ₹0 (waived by coupon)
- COD Charges: ₹25
- **Total: ₹325**

### Scenario 4: New User Discount

**Coupon:** `WELCOME10` - 10% off for new users only

**Validation:**
- Checks if customer has any previous orders
- If yes: "This coupon is only for new customers"
- If no: Applies 10% discount

### Scenario 5: Per-User Limit

**Coupon:** `REPEAT20` - 20% off, max 3 uses per user

**Usage:**
- User applies coupon 1st time: ✅ Success
- User applies coupon 2nd time: ✅ Success
- User applies coupon 3rd time: ✅ Success
- User applies coupon 4th time: ❌ "Usage limit per user exceeded"

---

## 🎨 Customer App Integration Example

### Complete Checkout Flow

```typescript
// 1. Calculate cart subtotal
const subtotal = cartItems.reduce((sum, item) => 
  sum + (item.price * item.quantity), 0
);

// 2. Validate coupon (optional)
const [appliedCoupon, setAppliedCoupon] = useState(null);

const handleCouponApplied = (couponData) => {
  setAppliedCoupon(couponData);
  // Update UI with discount
};

// 3. Calculate final total
const discount = appliedCoupon?.discountAmount || 0;
const shipping = (subtotal > 500 || appliedCoupon?.couponType === 'free_shipping') ? 0 : 50;
const codCharges = paymentMethod === 'COD' ? 25 : 0;
const total = subtotal - discount + shipping + codCharges;

// 4. Create order
const createOrder = async () => {
  const response = await fetch('/api/customer/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: cartItems,
      couponCode: appliedCoupon?.couponCode,
      customerInfo: { name, phone, email },
      shippingAddress: address,
      paymentInfo: { method: paymentMethod },
      pricingInfo: {
        subtotal,
        discount,
        taxes: 0,
        shippingCharges: shipping,
        codCharges,
        prepaidDiscount: 0,
        grandTotal: total
      }
    })
  });
  
  const result = await response.json();
  if (result.success) {
    // Order created successfully
    // Coupon usage recorded automatically
  }
};
```

---

## 🔒 Security & Best Practices

### Security Measures

1. **Code Uniqueness**: Enforced at creation (no duplicate codes)
2. **Atomic Updates**: Usage count incremented atomically
3. **Validation Before Use**: Always validate before applying
4. **Usage Tracking**: Complete audit trail in `couponUsage` collection
5. **Soft Delete**: Deactivation instead of deletion preserves history

### Best Practices

1. **Always Validate**: Call `/api/customer/coupons/validate` before checkout
2. **Show Preview**: Display discount amount before order placement
3. **Handle Errors**: Show clear error messages for invalid coupons
4. **Track Usage**: Monitor coupon performance via stats dialog
5. **Set Limits**: Use per-user limits to prevent abuse
6. **Expiration**: Always set reasonable validity periods
7. **Testing**: Test coupons before making them public

### Common Validation Errors

- "Invalid coupon code" - Code doesn't exist or inactive
- "Coupon has expired" - Past validity period
- "Coupon usage limit exceeded" - Global limit reached
- "You have already used this coupon" - Per-user limit reached
- "This coupon is only for new customers" - Existing customer
- "Minimum order value of ₹X required" - Cart value too low
- "This coupon is not applicable to your account" - User restriction

---

## 📈 Analytics & Reporting

### Available Statistics

For each coupon, view:
- **Total Usage**: Number of times used
- **Total Discount**: Total amount discounted
- **Unique Users**: Number of different customers
- **Recent Usage**: Last 10 redemptions with details

### Monitoring

Track coupon performance:
- Usage rate (current/max)
- Average discount per order
- Customer acquisition (for new user coupons)
- Revenue impact

---

## 🚀 Future Enhancements

Potential improvements:
- Bulk coupon generation
- Coupon templates
- Auto-apply coupons based on cart value
- Stackable coupons
- Referral coupons
- Time-based coupons (flash sales)
- Category-specific coupons
- Buy X Get Y offers

---

## 📞 Support

For issues or questions:
- Check validation error messages
- Review coupon settings in admin dashboard
- Verify customer eligibility
- Check usage limits and expiration dates
- Review order creation logs

---

**Last Updated:** November 2024
**Version:** 1.0
