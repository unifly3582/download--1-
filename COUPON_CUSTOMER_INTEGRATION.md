# 🎟️ Customer-Facing Coupon Integration - Quick Start

## For Frontend Developers

This guide shows how to integrate the coupon system into your customer-facing website/app.

---

## 🚀 Quick Integration (3 Steps)

### Step 1: Add the Coupon Input Component

```tsx
import { CouponInput } from '@/components/coupon-input';

function CheckoutPage() {
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const cartSubtotal = 1200; // Your cart calculation
  
  return (
    <CouponInput
      orderValue={cartSubtotal}
      items={cartItems}
      customerPhone={customerPhone}
      onCouponApplied={(couponData) => {
        setAppliedCoupon(couponData);
        // Update your checkout UI
      }}
      onCouponRemoved={() => {
        setAppliedCoupon(null);
        // Reset your checkout UI
      }}
      appliedCoupon={appliedCoupon}
    />
  );
}
```

### Step 2: Calculate Final Total

```typescript
const subtotal = cartItems.reduce((sum, item) => 
  sum + (item.price * item.quantity), 0
);

const discount = appliedCoupon?.discountAmount || 0;

const freeShipping = appliedCoupon?.couponType === 'free_shipping';
const shipping = (subtotal > 500 || freeShipping) ? 0 : 50;

const codCharges = paymentMethod === 'COD' ? 25 : 0;

const total = subtotal - discount + shipping + codCharges;
```

### Step 3: Submit Order with Coupon

```typescript
const response = await fetch('/api/customer/orders/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: cartItems,
    couponCode: appliedCoupon?.couponCode, // Include coupon code
    customerInfo: { name, phone, email },
    shippingAddress: address,
    paymentInfo: { method: 'COD' },
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
```

**That's it!** The backend handles validation, discount calculation, and usage tracking automatically.

---

## 📡 API Reference

### Validate Coupon

**Endpoint:** `POST /api/customer/coupons/validate`

**No authentication required** ✅

```typescript
const validateCoupon = async (code: string) => {
  const response = await fetch('/api/customer/coupons/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      couponCode: code,
      orderValue: cartSubtotal,
      customerPhone: "+919876543210",
      items: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price,
        sku: item.sku
      }))
    })
  });
  
  return await response.json();
};
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

---

## 🎨 UI/UX Best Practices

### 1. Show Discount Preview

```tsx
{appliedCoupon && (
  <div className="bg-green-50 p-4 rounded-lg">
    <div className="flex items-center justify-between">
      <div>
        <span className="font-mono font-bold">{appliedCoupon.couponCode}</span>
        <span className="text-green-600 ml-2">Applied!</span>
      </div>
      <span className="text-green-600 font-bold">
        -₹{appliedCoupon.discountAmount}
      </span>
    </div>
  </div>
)}
```

### 2. Display Order Summary

```tsx
<div className="space-y-2">
  <div className="flex justify-between">
    <span>Subtotal:</span>
    <span>₹{subtotal}</span>
  </div>
  
  {appliedCoupon && (
    <div className="flex justify-between text-green-600">
      <span>Discount ({appliedCoupon.couponCode}):</span>
      <span>-₹{appliedCoupon.discountAmount}</span>
    </div>
  )}
  
  <div className="flex justify-between">
    <span>Shipping:</span>
    <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
  </div>
  
  {paymentMethod === 'COD' && (
    <div className="flex justify-between">
      <span>COD Charges:</span>
      <span>₹{codCharges}</span>
    </div>
  )}
  
  <div className="flex justify-between font-bold text-lg border-t pt-2">
    <span>Total:</span>
    <span>₹{total}</span>
  </div>
</div>
```

### 3. Handle Errors Gracefully

```tsx
const handleApplyCoupon = async (code: string) => {
  try {
    const result = await validateCoupon(code);
    
    if (result.success) {
      setAppliedCoupon(result.data);
      toast.success(`Saved ₹${result.data.discountAmount}!`);
    } else {
      toast.error(result.error);
    }
  } catch (error) {
    toast.error('Failed to validate coupon. Please try again.');
  }
};
```

---

## 💡 Common Use Cases

### Use Case 1: Simple Checkout

```tsx
function SimpleCheckout() {
  const [coupon, setCoupon] = useState(null);
  
  return (
    <div>
      <CartItems items={cart} />
      
      <CouponInput
        orderValue={cartTotal}
        onCouponApplied={setCoupon}
        onCouponRemoved={() => setCoupon(null)}
        appliedCoupon={coupon}
      />
      
      <OrderSummary 
        subtotal={cartTotal}
        discount={coupon?.discountAmount || 0}
      />
      
      <CheckoutButton 
        couponCode={coupon?.couponCode}
      />
    </div>
  );
}
```

### Use Case 2: Multi-Step Checkout

```tsx
function MultiStepCheckout() {
  const [step, setStep] = useState(1);
  const [coupon, setCoupon] = useState(null);
  
  return (
    <>
      {step === 1 && <CartReview />}
      {step === 2 && <ShippingAddress />}
      {step === 3 && (
        <PaymentMethod 
          couponInput={
            <CouponInput
              orderValue={cartTotal}
              onCouponApplied={setCoupon}
              onCouponRemoved={() => setCoupon(null)}
              appliedCoupon={coupon}
            />
          }
        />
      )}
      {step === 4 && (
        <OrderConfirmation 
          couponCode={coupon?.couponCode}
          discount={coupon?.discountAmount}
        />
      )}
    </>
  );
}
```

### Use Case 3: Auto-Apply from URL

```tsx
function CheckoutWithAutoApply() {
  const searchParams = useSearchParams();
  const couponFromUrl = searchParams.get('coupon');
  
  useEffect(() => {
    if (couponFromUrl) {
      validateAndApplyCoupon(couponFromUrl);
    }
  }, [couponFromUrl]);
  
  // URL: /checkout?coupon=SAVE20
  // Automatically validates and applies SAVE20
}
```

---

## 🔍 Validation Rules

The system automatically validates:

| Rule | Description |
|------|-------------|
| **Existence** | Coupon code exists and is active |
| **Validity Period** | Current date is between validFrom and validUntil |
| **Usage Limit** | Global usage count not exceeded |
| **Per-User Limit** | User hasn't exceeded their usage limit |
| **User Eligibility** | User meets restrictions (new/specific users) |
| **Minimum Order** | Cart value meets minimum requirement |
| **Product Rules** | Applicable products in cart, no excluded products |

---

## 📊 Discount Calculation Examples

### Example 1: Percentage Discount

```
Coupon: SAVE20 (20% off, max ₹200)
Cart: ₹1,200

Calculation:
- 20% of ₹1,200 = ₹240
- Capped at ₹200
- Discount: ₹200
- Final: ₹1,000
```

### Example 2: Fixed Amount

```
Coupon: FLAT100 (₹100 off)
Cart: ₹400

Calculation:
- Fixed discount: ₹100
- Final: ₹300
```

### Example 3: Free Shipping

```
Coupon: FREESHIP (Free shipping)
Cart: ₹300

Calculation:
- Subtotal: ₹300
- Shipping: ₹50 → ₹0 (waived)
- Final: ₹300 (saved ₹50)
```

---

## 🎯 Testing Checklist

Before going live, test:

- ✅ Valid coupon applies correctly
- ✅ Invalid coupon shows error
- ✅ Expired coupon rejected
- ✅ Usage limit enforced
- ✅ Per-user limit enforced
- ✅ Minimum order value checked
- ✅ New user restriction works
- ✅ Discount calculated correctly
- ✅ Free shipping applied
- ✅ Coupon can be removed
- ✅ Order creates with coupon
- ✅ Usage recorded in database

---

## 🐛 Common Issues & Solutions

### Issue: "Coupon not found"
**Solution:** Check if coupon code is uppercase and active in admin dashboard

### Issue: "Minimum order value required"
**Solution:** Display minimum requirement to user, suggest adding more items

### Issue: "Already used this coupon"
**Solution:** Show per-user limit in error message, suggest other coupons

### Issue: Discount not applying
**Solution:** Ensure you're passing `couponCode` in order creation request

### Issue: Free shipping not working
**Solution:** Check if `couponType === 'free_shipping'` in shipping calculation

---

## 📱 Mobile Optimization

```tsx
// Mobile-friendly coupon input
<div className="sticky bottom-0 bg-white p-4 shadow-lg">
  <CouponInput
    orderValue={total}
    onCouponApplied={handleApply}
    onCouponRemoved={handleRemove}
    appliedCoupon={coupon}
  />
  
  <button className="w-full mt-4 py-3 bg-primary text-white rounded-lg">
    Place Order - ₹{finalTotal}
  </button>
</div>
```

---

## 🎁 Marketing Integration

### Share Coupon Links

```tsx
// Generate shareable links
const shareUrl = `https://yoursite.com/checkout?coupon=SAVE20`;

// WhatsApp share
const whatsappUrl = `https://wa.me/?text=Get 20% off! Use code SAVE20: ${shareUrl}`;

// Email share
const emailSubject = 'Get 20% off your order!';
const emailBody = `Use coupon code SAVE20 at checkout: ${shareUrl}`;
```

### Display Active Coupons

```tsx
function CouponBanner() {
  return (
    <div className="bg-yellow-100 p-4 text-center">
      <span className="font-bold">🎉 Limited Time Offer!</span>
      <span className="ml-2">Use code <code>SAVE20</code> for 20% off</span>
    </div>
  );
}
```

---

## 🔗 Related Documentation

- [Complete Coupon System Guide](./COUPON_SYSTEM_GUIDE.md)
- [Customer Facing API Guide](./CUSTOMER_FACING_API_GUIDE.md)
- [Order Creation Flow](./CUSTOMER_FACING_API_GUIDE.md#order-creation-api)

---

**Need Help?** Check the admin dashboard at `/coupons` to view and manage all coupons.
