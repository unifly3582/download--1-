# 🎟️ Coupon System - Flow Diagrams

## Visual Guide to Coupon System Architecture

---

## 1. 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     COUPON SYSTEM ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Admin Dashboard │         │  Customer App    │         │    Database      │
│   (/coupons)     │         │   (Checkout)     │         │   (Firestore)    │
└────────┬─────────┘         └────────┬─────────┘         └────────┬─────────┘
         │                            │                            │
         │ Create/Edit/View           │ Validate/Apply             │
         │                            │                            │
         ▼                            ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  Admin APIs      │              │  Customer APIs   │         │
│  │  (Auth Required) │              │  (Public)        │         │
│  │                  │              │                  │         │
│  │ • List Coupons   │              │ • Validate       │         │
│  │ • Create         │              │ • Apply          │         │
│  │ • Update         │              │                  │         │
│  │ • Delete         │              │                  │         │
│  │ • Get Stats      │              │                  │         │
│  └──────────────────┘              └──────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                          │
│                  (src/lib/oms/couponSystem.ts)                   │
│                                                                   │
│  • validateCoupon()      - Check eligibility                     │
│  • calculateDiscount()   - Compute discount amount               │
│  • recordCouponUsage()   - Track redemptions                     │
│  • createCoupon()        - Create new coupon                     │
│  • getCouponStats()      - Get analytics                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   coupons    │    │ couponUsage  │    │    orders    │      │
│  │              │    │              │    │              │      │
│  │ • Definition │    │ • Tracking   │    │ • Applied    │      │
│  │ • Rules      │    │ • History    │    │   Coupons    │      │
│  │ • Status     │    │ • Analytics  │    │ • Discounts  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 🛒 Customer Checkout Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER CHECKOUT FLOW                        │
└─────────────────────────────────────────────────────────────────┘

START: Customer on Checkout Page
│
├─► Step 1: View Cart
│   ├─ Items: Product A (₹600 × 2)
│   ├─ Items: Product B (₹400 × 1)
│   └─ Subtotal: ₹1,600
│
├─► Step 2: Enter Coupon Code
│   ├─ Customer types: "SAVE20"
│   └─ Clicks "Apply"
│
├─► Step 3: Validate Coupon
│   │
│   ├─ API Call: POST /api/customer/coupons/validate
│   │   {
│   │     couponCode: "SAVE20",
│   │     orderValue: 1600,
│   │     customerPhone: "+919876543210",
│   │     items: [...]
│   │   }
│   │
│   ├─ Validation Checks:
│   │   ✓ Coupon exists and active
│   │   ✓ Within validity period
│   │   ✓ Usage limit not exceeded
│   │   ✓ User is eligible
│   │   ✓ Min order value met (₹1000)
│   │   ✓ No excluded products
│   │
│   └─ Response:
│       {
│         success: true,
│         discountAmount: 200,  // 20% capped at ₹200
│         finalAmount: 1400
│       }
│
├─► Step 4: Show Discount
│   ├─ Display: "✓ SAVE20 Applied"
│   ├─ Display: "You saved ₹200"
│   └─ Update total: ₹1,400
│
├─► Step 5: Calculate Final Total
│   ├─ Subtotal:        ₹1,600
│   ├─ Discount:        -₹200
│   ├─ Shipping:        ₹0     (order > ₹500)
│   ├─ COD Charges:     ₹25
│   └─ Grand Total:     ₹1,425
│
├─► Step 6: Place Order
│   │
│   ├─ API Call: POST /api/customer/orders/create
│   │   {
│   │     couponCode: "SAVE20",
│   │     items: [...],
│   │     customerInfo: {...},
│   │     pricingInfo: {
│   │       subtotal: 1600,
│   │       discount: 200,
│   │       grandTotal: 1425
│   │     }
│   │   }
│   │
│   ├─ Backend Process:
│   │   1. Validate coupon again
│   │   2. Create order
│   │   3. Record coupon usage
│   │   4. Increment usage count
│   │   5. Send confirmation
│   │
│   └─ Response:
│       {
│         success: true,
│         orderId: "12345",
│         totalAmount: 1425,
│         discount: 200
│       }
│
└─► END: Order Confirmed
    └─ Customer receives confirmation
```

---

## 3. 👨‍💼 Admin Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN MANAGEMENT FLOW                         │
└─────────────────────────────────────────────────────────────────┘

START: Admin opens /coupons dashboard
│
├─► View Coupons List
│   ├─ Tab: Active (currently valid coupons)
│   ├─ Tab: Inactive (deactivated coupons)
│   └─ Tab: All (complete list)
│
├─► Create New Coupon
│   │
│   ├─ Click "Create Coupon" button
│   │
│   ├─ Fill Form:
│   │   ├─ Code: "WELCOME10"
│   │   ├─ Type: Percentage
│   │   ├─ Value: 10%
│   │   ├─ Usage: Multi-use (100 max)
│   │   ├─ Users: New users only
│   │   ├─ Min Order: ₹500
│   │   ├─ Valid: 2024-01-01 to 2024-12-31
│   │   └─ Description: "10% off for new customers"
│   │
│   ├─ Submit
│   │   │
│   │   ├─ API: POST /api/admin/coupons
│   │   │
│   │   ├─ Validation:
│   │   │   ✓ Code is unique
│   │   │   ✓ Valid date range
│   │   │   ✓ Valid values
│   │   │
│   │   └─ Database:
│   │       └─ Create coupon document
│   │
│   └─ Success: "Coupon created successfully"
│
├─► View Coupon Statistics
│   │
│   ├─ Click "View Stats" on coupon
│   │
│   ├─ API: GET /api/admin/coupons/[id]/stats
│   │
│   └─ Display:
│       ├─ Total Usage: 45 orders
│       ├─ Total Discount: ₹9,000
│       ├─ Total Revenue: ₹54,000
│       ├─ Unique Users: 42
│       ├─ Avg Order Value: ₹1,200
│       ├─ Usage Progress: 45/100 (45%)
│       └─ Recent Orders: [list of 10]
│
├─► Edit Coupon
│   │
│   ├─ Click "Edit" on coupon
│   │
│   ├─ Modify:
│   │   ├─ Max usage count
│   │   ├─ Per-user limit
│   │   ├─ Min order value
│   │   ├─ Valid until date
│   │   ├─ Description
│   │   └─ Active status
│   │
│   ├─ Submit
│   │   │
│   │   └─ API: PUT /api/admin/coupons/[id]
│   │
│   └─ Success: "Coupon updated successfully"
│
└─► Deactivate Coupon
    │
    ├─ Click "Deactivate" on coupon
    │
    ├─ API: DELETE /api/admin/coupons/[id]
    │   └─ Sets isActive: false (soft delete)
    │
    └─ Success: "Coupon deactivated successfully"
```

---

## 4. 🔍 Validation Logic Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    COUPON VALIDATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

validateCoupon(code, customerId, phone, orderValue, items)
│
├─► Check 1: Coupon Exists
│   ├─ Query: coupons collection where code = "SAVE20"
│   ├─ Found? ✓ Continue
│   └─ Not found? ✗ Error: "Invalid coupon code"
│
├─► Check 2: Is Active
│   ├─ Check: isActive === true
│   ├─ Yes? ✓ Continue
│   └─ No? ✗ Error: "Coupon is inactive"
│
├─► Check 3: Validity Period
│   ├─ Check: now >= validFrom && now <= validUntil
│   ├─ Valid? ✓ Continue
│   └─ Invalid? ✗ Error: "Coupon has expired"
│
├─► Check 4: Global Usage Limit
│   ├─ Check: currentUsageCount < maxUsageCount
│   ├─ Available? ✓ Continue
│   └─ Exceeded? ✗ Error: "Usage limit exceeded"
│
├─► Check 5: User Eligibility
│   ├─ Type: All Users → ✓ Continue
│   ├─ Type: New Users Only
│   │   ├─ Query: orders where customerId = user
│   │   ├─ No orders? ✓ Continue
│   │   └─ Has orders? ✗ Error: "Only for new customers"
│   └─ Type: Specific Users
│       ├─ Check: phone in specificPhones[]
│       ├─ Found? ✓ Continue
│       └─ Not found? ✗ Error: "Not applicable to your account"
│
├─► Check 6: Per-User Usage Limit
│   ├─ Has limit? Check maxUsagePerUser
│   ├─ Query: couponUsage where couponId & customerId
│   ├─ Count < limit? ✓ Continue
│   └─ Count >= limit? ✗ Error: "Usage limit per user exceeded"
│
├─► Check 7: Minimum Order Value
│   ├─ Has minimum? Check minimumOrderValue
│   ├─ orderValue >= minimum? ✓ Continue
│   └─ orderValue < minimum? ✗ Error: "Minimum order value required"
│
├─► Check 8: Product Restrictions
│   ├─ Has applicableProducts?
│   │   ├─ Any item in list? ✓ Continue
│   │   └─ No items match? ✗ Error: "Not applicable to cart items"
│   └─ Has excludedProducts?
│       ├─ Any excluded item? ✗ Error: "Cannot apply to some items"
│       └─ No excluded items? ✓ Continue
│
└─► ALL CHECKS PASSED ✓
    │
    ├─ Calculate Discount:
    │   ├─ Percentage: (orderValue × value) / 100
    │   ├─ Fixed: min(value, orderValue)
    │   └─ Free Shipping: 0 (handled in shipping calc)
    │
    └─ Return:
        {
          isValid: true,
          discountAmount: 200,
          couponDetails: {...}
        }
```

---

## 5. 💰 Discount Calculation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  DISCOUNT CALCULATION FLOW                       │
└─────────────────────────────────────────────────────────────────┘

calculateDiscount(coupon, orderValue, items)
│
├─► Step 1: Determine Applicable Value
│   │
│   ├─ Has Product Restrictions?
│   │   ├─ Yes: Calculate sum of applicable items only
│   │   │   └─ applicableValue = Σ(item.price × qty) for matching items
│   │   └─ No: Use full order value
│   │       └─ applicableValue = orderValue
│   │
│   └─ Example:
│       Cart: Product A (₹600) + Product B (₹400) = ₹1,000
│       Restriction: Only Product A
│       Applicable Value: ₹600
│
├─► Step 2: Calculate Base Discount
│   │
│   ├─ Type: Percentage
│   │   ├─ Formula: (applicableValue × percentage) / 100
│   │   └─ Example: (₹1,600 × 20) / 100 = ₹320
│   │
│   ├─ Type: Fixed Amount
│   │   ├─ Formula: min(fixedAmount, applicableValue)
│   │   └─ Example: min(₹100, ₹1,600) = ₹100
│   │
│   └─ Type: Free Shipping
│       ├─ Discount: ₹0 (handled separately)
│       └─ Effect: shippingCharges = 0
│
├─► Step 3: Apply Maximum Cap (if exists)
│   │
│   ├─ Has maximumDiscountAmount?
│   │   ├─ Yes: discount = min(discount, maxDiscount)
│   │   │   └─ Example: min(₹320, ₹200) = ₹200
│   │   └─ No: Use calculated discount
│   │       └─ Example: ₹320
│   │
│   └─ Result: Final discount amount
│
└─► Step 4: Return Discount
    │
    └─ Round to 2 decimal places
        └─ Example: ₹200.00
```

---

## 6. 📊 Order Total Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│                  ORDER TOTAL CALCULATION                         │
└─────────────────────────────────────────────────────────────────┘

Calculate Grand Total
│
├─► Component 1: Subtotal
│   └─ Σ(item.unitPrice × item.quantity) for all items
│       Example: (₹600 × 2) + (₹400 × 1) = ₹1,600
│
├─► Component 2: Coupon Discount (-)
│   ├─ If coupon applied: Use calculated discount
│   └─ If no coupon: ₹0
│       Example: -₹200
│
├─► Component 3: Prepaid Discount (-)
│   ├─ If payment = Prepaid: Apply prepaid discount
│   └─ If payment = COD: ₹0
│       Example: ₹0 (COD order)
│
├─► Component 4: Taxes (+)
│   └─ Currently: ₹0 (configurable)
│       Example: ₹0
│
├─► Component 5: Shipping Charges (+)
│   ├─ If free_shipping coupon: ₹0
│   ├─ If orderValue > ₹500: ₹0
│   └─ Otherwise: ₹50
│       Example: ₹0 (order > ₹500)
│
├─► Component 6: COD Charges (+)
│   ├─ If payment = COD: Apply COD charges
│   └─ If payment = Prepaid: ₹0
│       Example: ₹25 (from checkout settings)
│
└─► GRAND TOTAL
    │
    └─ Formula:
        grandTotal = subtotal 
                   - couponDiscount 
                   - prepaidDiscount 
                   + taxes 
                   + shippingCharges 
                   + codCharges
        
        Example:
        ₹1,600 - ₹200 - ₹0 + ₹0 + ₹0 + ₹25 = ₹1,425
```

---

## 7. 📝 Usage Recording Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   USAGE RECORDING FLOW                           │
└─────────────────────────────────────────────────────────────────┘

recordCouponUsage(couponId, code, orderId, customerId, phone, discount, orderValue)
│
├─► Step 1: Create Usage Record
│   │
│   └─ Generate usageId (UUID)
│       └─ usageId: "usage_abc123"
│
├─► Step 2: Prepare Data
│   │
│   └─ Usage Object:
│       {
│         usageId: "usage_abc123",
│         couponId: "coupon_xyz789",
│         couponCode: "SAVE20",
│         orderId: "12345",
│         customerId: "cust_456",
│         customerPhone: "+919876543210",
│         discountAmount: 200,
│         orderValue: 1600,
│         usedAt: "2024-11-17T10:30:00Z"
│       }
│
├─► Step 3: Atomic Database Transaction
│   │
│   ├─ Start Firestore Batch
│   │
│   ├─ Operation 1: Add Usage Record
│   │   └─ Collection: couponUsage
│   │       Document: usage_abc123
│   │       Data: [usage object]
│   │
│   ├─ Operation 2: Increment Usage Count
│   │   └─ Collection: coupons
│   │       Document: coupon_xyz789
│   │       Update: {
│   │         currentUsageCount: +1,
│   │         updatedAt: now
│   │       }
│   │
│   └─ Commit Batch (atomic)
│       ├─ Success: Both operations complete
│       └─ Failure: Both operations rollback
│
└─► Step 4: Confirmation
    │
    └─ Log: "Recorded usage: SAVE20 for order 12345"
```

---

## 8. 📈 Statistics Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│                  STATISTICS CALCULATION                          │
└─────────────────────────────────────────────────────────────────┘

getCouponStats(couponId)
│
├─► Query: Get All Usage Records
│   └─ Collection: couponUsage
│       Where: couponId = "coupon_xyz789"
│       OrderBy: usedAt DESC
│
├─► Calculate Metrics
│   │
│   ├─ Total Usage
│   │   └─ Count of usage records
│   │       Example: 45 orders
│   │
│   ├─ Total Discount Given
│   │   └─ Σ(usage.discountAmount)
│   │       Example: ₹9,000
│   │
│   ├─ Total Revenue
│   │   └─ Σ(usage.orderValue - usage.discountAmount)
│   │       Example: ₹54,000
│   │
│   ├─ Unique Users
│   │   └─ Count distinct customerId
│   │       Example: 42 users
│   │
│   ├─ Average Order Value
│   │   └─ Total Revenue / Total Usage
│   │       Example: ₹54,000 / 45 = ₹1,200
│   │
│   ├─ Discount Rate
│   │   └─ (Total Discount / Total Revenue) × 100
│   │       Example: (₹9,000 / ₹54,000) × 100 = 16.7%
│   │
│   └─ Avg Uses per User
│       └─ Total Usage / Unique Users
│           Example: 45 / 42 = 1.07
│
└─► Return Statistics
    {
      totalUsage: 45,
      totalDiscount: 9000,
      totalRevenue: 54000,
      uniqueUsers: 42,
      averageOrderValue: 1200,
      recentUsage: [last 10 records]
    }
```

---

## 9. 🔄 Complete End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPLETE COUPON LIFECYCLE                           │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ ADMIN CREATES│
│    COUPON    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Coupon: SAVE20                       │
│ Type: 20% off, max ₹200              │
│ Min Order: ₹1,000                    │
│ Max Uses: 100                        │
│ Valid: 30 days                       │
│ Status: Active                       │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────┐
│  CUSTOMER    │
│  DISCOVERS   │
│    COUPON    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Customer adds items to cart          │
│ Cart Value: ₹1,600                   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────┐
│  CUSTOMER    │
│   APPLIES    │
│    COUPON    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Validation Process                   │
│ ✓ Code exists                        │
│ ✓ Active                             │
│ ✓ Not expired                        │
│ ✓ Usage available (45/100)           │
│ ✓ User eligible                      │
│ ✓ Min order met (₹1,600 > ₹1,000)   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Discount Calculation                 │
│ 20% of ₹1,600 = ₹320                 │
│ Capped at ₹200                       │
│ Final Discount: ₹200                 │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Order Total                          │
│ Subtotal:     ₹1,600                 │
│ Discount:     -₹200                  │
│ Shipping:     ₹0                     │
│ COD Charges:  ₹25                    │
│ Total:        ₹1,425                 │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────┐
│  CUSTOMER    │
│   PLACES     │
│    ORDER     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Order Creation                       │
│ • Validate coupon again              │
│ • Create order document              │
│ • Record usage                       │
│ • Increment count (46/100)           │
│ • Send confirmation                  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────┐
│    ADMIN     │
│   MONITORS   │
│    STATS     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Statistics Dashboard                 │
│ • Total Usage: 46 orders             │
│ • Total Discount: ₹9,200             │
│ • Total Revenue: ₹55,200             │
│ • Unique Users: 43                   │
│ • Avg Order: ₹1,200                  │
│ • Usage Rate: 46%                    │
└──────────────────────────────────────┘
```

---

## 10. 🎨 Component Integration

```
┌─────────────────────────────────────────────────────────────────┐
│              CUSTOMER APP COMPONENT STRUCTURE                    │
└─────────────────────────────────────────────────────────────────┘

<CheckoutPage>
  │
  ├─ <CartSummary>
  │   ├─ Items List
  │   └─ Subtotal: ₹1,600
  │
  ├─ <CouponInput>                    ← Ready-to-use component
  │   │
  │   ├─ State: appliedCoupon
  │   │
  │   ├─ Input Field
  │   │   └─ "Enter coupon code"
  │   │
  │   ├─ Apply Button
  │   │   └─ onClick → validateCoupon()
  │   │
  │   ├─ Applied Badge (if coupon applied)
  │   │   ├─ Code: "SAVE20"
  │   │   ├─ Discount: "₹200"
  │   │   └─ Remove Button
  │   │
  │   └─ Order Summary
  │       ├─ Subtotal: ₹1,600
  │       ├─ Discount: -₹200
  │       └─ Total: ₹1,400
  │
  ├─ <ShippingAddress>
  │   └─ Address form
  │
  ├─ <PaymentMethod>
  │   ├─ COD
  │   └─ Prepaid
  │
  └─ <PlaceOrderButton>
      │
      └─ onClick → createOrder({
            couponCode: appliedCoupon?.couponCode,
            ...orderData
          })
```

---

**Visual Guide Complete!** 🎉

These diagrams show the complete flow of the coupon system from creation to usage to analytics.
