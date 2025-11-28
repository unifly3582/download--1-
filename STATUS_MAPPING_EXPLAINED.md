# Status Mapping - Detailed Explanation

## Why Do We Need Status Mapping?

### The Problem:
Delhivery has **many different status values** (10+), but we only need a **few simplified statuses** in our system.

**Example:**
- Delhivery might say: `"Manifested"`, `"Not Picked"`, `"Pickup Scheduled"`
- But for us, all these mean the same thing: **"shipped"**

### The Solution:
We **map** (convert) Delhivery's detailed statuses to our simplified internal statuses.

---

## The Three Status Levels

Your system uses **three different status levels**:

```
┌─────────────────────┐
│ Delhivery Status    │  ← What Delhivery API returns (detailed)
│ (Raw from API)      │
└──────────┬──────────┘
           │ Maps to ↓
┌──────────▼──────────┐
│ Internal Status     │  ← What we use internally (simplified)
│ (internalStatus)    │
└──────────┬──────────┘
           │ Maps to ↓
┌──────────▼──────────┐
│ Customer Status     │  ← What customer sees (very simple)
│ (customerFacingStatus)│
└─────────────────────┘
```

---

## Level 1: Delhivery Status → Internal Status

### The Mapping Function:

```typescript
function mapDelhiveryStatusToInternal(delhiveryStatus: string): string {
  const statusMap: Record<string, string> = {
    'Manifested': 'shipped',
    'Not Picked': 'shipped',
    'In Transit': 'in_transit',
    'Pending': 'pending',
    'Dispatched': 'in_transit',
    'Out for Delivery': 'in_transit',
    'Out-for-Delivery': 'in_transit',
    'Delivered': 'delivered',
    'RTO Initiated': 'return_initiated',
    'RTO Delivered': 'returned'
  };
  
  return statusMap[delhiveryStatus] || 'in_transit';
}
```

### Visual Mapping:

```
Delhivery Status          →    Internal Status
─────────────────────────────────────────────────
"Manifested"              →    "shipped"
"Not Picked"              →    "shipped"
"Pickup Scheduled"        →    "shipped"
                          
"In Transit"              →    "in_transit"
"Dispatched"              →    "in_transit"
"Out for Delivery"        →    "in_transit"
"Out-for-Delivery"        →    "in_transit"
                          
"Pending"                 →    "pending"
                          
"Delivered"               →    "delivered"
                          
"RTO Initiated"           →    "return_initiated"
"RTO Delivered"           →    "returned"
                          
(Unknown status)          →    "in_transit" (default)
```

### Why This Mapping?

#### 1. **Multiple Delhivery statuses → One internal status**

**Example: "shipped"**
```
Delhivery says "Manifested"     } All mean the same thing:
Delhivery says "Not Picked"     } Package has been handed
Delhivery says "Pickup Scheduled"} to courier but not moving yet
                                  
→ We simplify to: "shipped"
```

**Example: "in_transit"**
```
Delhivery says "In Transit"     } All mean the same thing:
Delhivery says "Dispatched"     } Package is moving through
Delhivery says "Out for Delivery"} the delivery network
                                  
→ We simplify to: "in_transit"
```

#### 2. **Easier to Handle in Code**

Instead of checking:
```typescript
// ❌ BAD: Too many conditions
if (status === 'Manifested' || status === 'Not Picked' || status === 'Pickup Scheduled') {
  // Do something for shipped orders
}
```

We can just check:
```typescript
// ✅ GOOD: Simple condition
if (internalStatus === 'shipped') {
  // Do something for shipped orders
}
```

#### 3. **Consistent Across Couriers**

If you add more couriers later (BlueDart, DTDC, etc.), they'll have different status names:
- Delhivery: `"Manifested"`
- BlueDart: `"Booked"`
- DTDC: `"Consignment Created"`

But all map to: `"shipped"` ✅

---

## Level 2: Internal Status → Customer Status

### The Mapping Function:

```typescript
function mapToCustomerStatus(internalStatus: string): string {
  const statusMap: Record<string, string> = {
    'created_pending': 'confirmed',
    'approved': 'processing',
    'ready_for_shipping': 'processing',
    'shipped': 'shipped',
    'in_transit': 'shipped',
    'pending': 'shipped',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'returned': 'returned'
  };
  
  return statusMap[internalStatus] || 'processing';
}
```

### Visual Mapping:

```
Internal Status           →    Customer Status
─────────────────────────────────────────────────
"created_pending"         →    "confirmed"
"approved"                →    "processing"
"ready_for_shipping"      →    "processing"
                          
"shipped"                 →    "shipped"
"in_transit"              →    "shipped"
"pending"                 →    "shipped"
                          
"delivered"               →    "delivered"
"cancelled"               →    "cancelled"
"returned"                →    "returned"
                          
(Unknown status)          →    "processing" (default)
```

### Why This Mapping?

#### 1. **Simplify for Customers**

Customers don't need to know internal details:

```
Internal: "created_pending"     } Customer doesn't care
Internal: "approved"            } about these details
Internal: "ready_for_shipping"  }
                                  
→ Customer sees: "processing" (simple!)
```

```
Internal: "shipped"             } Customer doesn't care
Internal: "in_transit"          } if it's "shipped" or
Internal: "pending"             } "in transit"
                                  
→ Customer sees: "shipped" (simple!)
```

#### 2. **Less Confusion**

**Bad (too detailed):**
```
Your order status: "ready_for_shipping"
```
Customer thinks: "What does that mean? Is it shipped or not?"

**Good (simple):**
```
Your order status: "processing"
```
Customer thinks: "OK, they're working on it."

---

## Complete Flow Example

Let's trace an order through its lifecycle:

### Stage 1: Order Created
```
Delhivery Status:  (none yet)
Internal Status:   "created_pending"
Customer Status:   "confirmed"
Customer Sees:     "Order Confirmed ✅"
```

### Stage 2: Order Approved
```
Delhivery Status:  (none yet)
Internal Status:   "approved"
Customer Status:   "processing"
Customer Sees:     "Processing Your Order 📦"
```

### Stage 3: Shipped to Delhivery
```
Delhivery Status:  "Manifested"
                   ↓ (maps to)
Internal Status:   "shipped"
                   ↓ (maps to)
Customer Status:   "shipped"
Customer Sees:     "Shipped 🚚"
Notification:      ✅ "Your order has been shipped!"
```

### Stage 4: Moving Through Network
```
Delhivery Status:  "In Transit"
                   ↓ (maps to)
Internal Status:   "in_transit"
                   ↓ (maps to)
Customer Status:   "shipped"
Customer Sees:     "Shipped 🚚" (no change)
Notification:      ❌ (no notification)
```

### Stage 5: Out for Delivery
```
Delhivery Status:  "Dispatched"
                   ↓ (maps to)
Internal Status:   "in_transit" (no change)
                   ↓ (maps to)
Customer Status:   "shipped" (no change)
Customer Sees:     "Shipped 🚚" (no change)
Notification:      ✅ "Your order is out for delivery today!"
                   (Special detection for "Dispatched")
```

### Stage 6: Delivered
```
Delhivery Status:  "Delivered"
                   ↓ (maps to)
Internal Status:   "delivered"
                   ↓ (maps to)
Customer Status:   "delivered"
Customer Sees:     "Delivered ✅"
Notification:      ⚠️ (template not approved yet)
```

---

## Why Three Levels?

### 1. **Delhivery Status** (Raw Data)
- **Purpose**: Store exact status from API
- **Used for**: Debugging, detailed tracking
- **Example**: `"Manifested"`, `"In Transit"`, `"Dispatched"`

### 2. **Internal Status** (Simplified)
- **Purpose**: Easy to work with in code
- **Used for**: Business logic, filtering, sorting
- **Example**: `"shipped"`, `"in_transit"`, `"delivered"`

### 3. **Customer Status** (Very Simple)
- **Purpose**: Easy for customers to understand
- **Used for**: Customer-facing UI, emails, notifications
- **Example**: `"confirmed"`, `"processing"`, `"shipped"`, `"delivered"`

---

## Real-World Example

### Scenario: Customer checks order status

**In Firestore:**
```javascript
{
  orderId: "5024",
  internalStatus: "in_transit",
  customerFacingStatus: "shipped",
  shipmentInfo: {
    currentTrackingStatus: "Dispatched",
    trackingLocation: "Delhi Hub"
  }
}
```

**What Customer Sees:**
```
Order #5024
Status: Shipped 🚚
Location: Delhi Hub
```

**What Admin Sees:**
```
Order #5024
Internal Status: in_transit
Delhivery Status: Dispatched
Location: Delhi Hub
```

**What Tracking Sync Knows:**
```
Delhivery Status: "Dispatched"
→ Maps to Internal: "in_transit"
→ Maps to Customer: "shipped"
→ Special Detection: "out for delivery"
→ Action: Send WhatsApp notification
```

---

## Benefits of Status Mapping

### ✅ 1. Simplification
- 10+ Delhivery statuses → 6 internal statuses → 5 customer statuses

### ✅ 2. Consistency
- Same internal statuses work for all couriers
- Easy to add new couriers later

### ✅ 3. Flexibility
- Can change customer-facing labels without changing code
- Can handle new Delhivery statuses easily

### ✅ 4. Better UX
- Customers see simple, clear statuses
- No confusion about technical terms

### ✅ 5. Easier Code
- Simple conditions: `if (status === 'shipped')`
- No need to check multiple Delhivery statuses

---

## Summary

**Status mapping is like translation:**

```
Delhivery speaks:     "Manifested", "Not Picked", "In Transit"
                      ↓ (translate to)
Internal language:    "shipped", "in_transit", "delivered"
                      ↓ (translate to)
Customer language:    "Processing", "Shipped", "Delivered"
```

**Why?**
- Delhivery is too detailed
- Customers need simple terms
- Code needs consistent values

**Result:**
- ✅ Easy to understand
- ✅ Easy to maintain
- ✅ Works with any courier
- ✅ Great customer experience
