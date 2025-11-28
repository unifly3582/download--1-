# Tracking Sync Logic - Complete Explanation

## Overview

The tracking sync system automatically fetches shipment status updates from Delhivery and sends WhatsApp notifications to customers when their order status changes.

## How It Works - Step by Step

### 1. **Find Orders That Need Tracking**

```typescript
const ordersQuery = db.collection('orders')
  .where('needsTracking', '==', true)
  .where('shipmentInfo.courierPartner', '==', 'delhivery')
  .limit(500);
```

**What it does:**
- Queries Firestore for orders that need tracking
- Only gets Delhivery orders (other couriers not supported yet)
- Limits to 500 orders per sync (prevents overload)

**When is `needsTracking` set to `true`?**
- When order is shipped via Delhivery API
- Automatically set in `shipping.ts`

**When is `needsTracking` set to `false`?**
- When order reaches final status: `delivered`, `returned`, or `cancelled`
- Stops wasting API calls on completed orders

---

### 2. **Batch Orders for Efficient API Calls**

```typescript
const BATCH_SIZE = 50;
for (let i = 0; i < orders.length; i += BATCH_SIZE) {
  const batch = orders.slice(i, i + BATCH_SIZE);
  const awbs = batch.map(doc => doc.data().shipmentInfo?.awb).filter(awb => awb);
  awbBatches.push({ awbs, orders: batch });
}
```

**What it does:**
- Groups orders into batches of 50
- Extracts AWB numbers from each order
- Creates batches for efficient API calls

**Why batching?**
- Delhivery API accepts multiple AWBs in one call
- Instead of 100 API calls for 100 orders, we make only 2 calls (50 + 50)
- Saves time and API quota

**Example:**
```
Orders: [5001, 5002, 5003, ..., 5100]
Batch 1: AWBs [31232410021744, 31232410021745, ..., 31232410021793] (50 orders)
Batch 2: AWBs [31232410021794, 31232410021795, ..., 31232410021843] (50 orders)
```

---

### 3. **Fetch Tracking Data from Delhivery**

```typescript
async function fetchDelhiveryTracking(awbs: string[]) {
  const awbString = awbs.join(',');
  const response = await fetch(
    `https://track.delhivery.com/api/v1/packages/json/?waybill=${awbString}`,
    { headers: { 'Authorization': `Token ${apiKey}` } }
  );
  return await response.json();
}
```

**What it does:**
- Joins AWB numbers with commas: `"31232410021744,31232410021745,31232410021746"`
- Calls Delhivery tracking API
- Gets API key from Firestore: `courierIntegrations/delhivery`
- Returns tracking data for all AWBs

**API Response Example:**
```json
{
  "ShipmentData": [
    {
      "Shipment": {
        "AWB": "31232410021744",
        "Status": {
          "Status": "Dispatched",
          "StatusLocation": "Delhi Hub",
          "Instructions": "Out for delivery"
        },
        "ExpectedDeliveryDate": "2024-01-16"
      }
    }
  ]
}
```

---

### 4. **Process Each Shipment's Tracking Data**

For each shipment in the response:

#### 4a. **Update Tracking Information**

```typescript
const updateData: any = {
  'shipmentInfo.currentTrackingStatus': shipment.Status.Status,
  'shipmentInfo.lastTrackedAt': new Date().toISOString(),
  'shipmentInfo.trackingLocation': shipment.Status.StatusLocation,
  'shipmentInfo.trackingInstructions': shipment.Status.Instructions,
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
};
```

**What it updates:**
- `currentTrackingStatus`: Raw status from Delhivery (e.g., "Dispatched")
- `lastTrackedAt`: Timestamp of this sync
- `trackingLocation`: Current location (e.g., "Delhi Hub")
- `trackingInstructions`: Additional info (e.g., "Out for delivery")

#### 4b. **Map Delhivery Status to Internal Status**

```typescript
function mapDelhiveryStatusToInternal(delhiveryStatus: string): string {
  const statusMap = {
    'Manifested': 'shipped',
    'In Transit': 'in_transit',
    'Dispatched': 'in_transit',  // Out for delivery
    'Delivered': 'delivered',
    'RTO Initiated': 'return_initiated'
  };
  return statusMap[delhiveryStatus] || 'in_transit';
}
```

**Why mapping?**
- Delhivery has many status values
- We simplify to internal statuses: `shipped`, `in_transit`, `delivered`, etc.
- Makes it easier to handle in our system

**Example:**
```
Delhivery: "Manifested" → Internal: "shipped"
Delhivery: "Dispatched" → Internal: "in_transit"
Delhivery: "Delivered" → Internal: "delivered"
```

#### 4c. **Update Internal Status (If Changed)**

```typescript
if (newStatus !== currentOrder.internalStatus) {
  updateData.internalStatus = newStatus;
  updateData.customerFacingStatus = mapToCustomerStatus(newStatus);
  
  // Disable tracking for final statuses
  const finalStatuses = ['delivered', 'returned', 'cancelled'];
  if (finalStatuses.includes(newStatus)) {
    updateData.needsTracking = false;
    updateData['shipmentInfo.trackingDisabledReason'] = `Order ${newStatus}`;
  }
}
```

**What it does:**
- Updates `internalStatus` if it changed
- Updates `customerFacingStatus` (simplified for customers)
- Disables tracking if order is delivered/returned/cancelled

**Example:**
```
Before: internalStatus = "shipped"
Delhivery: "Delivered"
After: internalStatus = "delivered", needsTracking = false
```

---

### 5. **Determine If Notification Should Be Sent**

This is the **most important part** for notifications:

#### 5a. **Check What Status to Notify**

```typescript
// Check for "out for delivery" status
const statusLower = (delhiveryStatus || '').toLowerCase().replace(/[_\s-]/g, '');
const isOutForDelivery = statusLower.includes('outfordelivery') || 
                         statusLower.includes('dispatched');

if (isOutForDelivery) {
  notificationStatus = 'out_for_delivery';
}
// For shipped orders that haven't been notified yet
else if (['shipped', 'in_transit', 'pending'].includes(newStatus) && !lastNotifiedStatus) {
  notificationStatus = 'shipped';
}
```

**Logic:**
1. **If Delhivery status is "Dispatched" or "Out for Delivery"**:
   - Set `notificationStatus = 'out_for_delivery'`
   
2. **Else if order is shipped/in_transit/pending AND never notified**:
   - Set `notificationStatus = 'shipped'`
   - This catches orders that were shipped but never got notification

3. **Otherwise**:
   - Use the internal status (e.g., `delivered`)

#### 5b. **Check If Should Send**

```typescript
const enabledNotifications = {
  shipped: true,              // ✅ Approved template
  out_for_delivery: true,     // ✅ Approved template
  delivered: false            // ❌ Template not approved yet
};

const lastNotifiedStatus = currentOrder.notificationHistory?.lastNotifiedStatus;
const isEnabled = enabledNotifications[notificationStatus];
const shouldNotify = isEnabled && notificationStatus !== lastNotifiedStatus;
```

**Conditions (ALL must be true):**
1. ✅ Template is enabled (approved by Meta)
2. ✅ Haven't already sent this notification (`lastNotifiedStatus !== notificationStatus`)

**Example Scenarios:**

| Delhivery Status | Last Notified | Should Send? | Notification Type |
|------------------|---------------|--------------|-------------------|
| `Dispatched` | `shipped` | ✅ YES | `out_for_delivery` |
| `Dispatched` | `out_for_delivery` | ❌ NO | (already sent) |
| `In Transit` | `null` | ✅ YES | `shipped` |
| `In Transit` | `shipped` | ❌ NO | (already sent) |
| `Delivered` | `out_for_delivery` | ❌ NO | (template disabled) |

---

### 6. **Send WhatsApp Notification**

```typescript
if (shouldNotify) {
  await sendStatusNotification(orderDoc.ref, notificationStatus, currentOrder, shipment);
  updateData['notificationHistory.lastNotifiedStatus'] = notificationStatus;
  updateData['notificationHistory.lastNotifiedAt'] = new Date().toISOString();
}
```

**What it does:**
1. Calls notification service to send WhatsApp message
2. Updates `notificationHistory.lastNotifiedStatus` to prevent duplicates
3. Records timestamp of notification

**Notification Types:**
- `shipped`: "Your order has been shipped via Delhivery"
- `out_for_delivery`: "Your order is out for delivery today!"
- `delivered`: "Your order has been delivered" (not enabled yet)

---

### 7. **Update Order in Firestore**

```typescript
await orderDoc.ref.update(updateData);
```

**What gets updated:**
- Tracking information (status, location, timestamp)
- Internal status (if changed)
- Notification history (if notification sent)
- Delivery estimate (if available)
- `needsTracking` flag (if final status)

---

### 8. **Delay Between Batches**

```typescript
await new Promise(resolve => setTimeout(resolve, 1000));
```

**Why?**
- Prevents overwhelming Delhivery API
- 1 second delay between batches
- Respectful rate limiting

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. FIND ORDERS                                              │
│    Query: needsTracking = true, courier = delhivery         │
│    Result: 100 orders found                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. BATCH ORDERS                                             │
│    Batch 1: 50 AWBs                                         │
│    Batch 2: 50 AWBs                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. FETCH FROM DELHIVERY (Batch 1)                          │
│    API Call: GET /packages/json/?waybill=AWB1,AWB2,...      │
│    Response: ShipmentData with 50 shipments                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PROCESS EACH SHIPMENT                                    │
│    For Order 5024:                                          │
│    ├─ Delhivery Status: "Dispatched"                       │
│    ├─ Map to Internal: "in_transit"                        │
│    ├─ Detect: "out for delivery"                           │
│    ├─ Check: lastNotified = "shipped"                      │
│    └─ Decision: SEND NOTIFICATION ✅                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. SEND WHATSAPP NOTIFICATION                               │
│    Template: buggly_out_for_delivery                        │
│    To: Customer phone number                                │
│    Message: "Your order is out for delivery today!"         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. UPDATE FIRESTORE                                         │
│    Update Order 5024:                                       │
│    ├─ currentTrackingStatus: "Dispatched"                  │
│    ├─ trackingLocation: "Delhi Hub"                        │
│    ├─ lastTrackedAt: "2024-01-15T10:00:00Z"               │
│    └─ lastNotifiedStatus: "out_for_delivery"               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. WAIT 1 SECOND                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. REPEAT FOR BATCH 2                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

### ✅ Efficient
- Batches 50 orders per API call
- Only tracks active orders (`needsTracking = true`)
- Stops tracking completed orders

### ✅ Smart Notifications
- Detects "Dispatched" as "out for delivery"
- Prevents duplicate notifications
- Catches missed notifications from previous syncs

### ✅ Robust Error Handling
- Continues if one batch fails
- Doesn't fail tracking update if notification fails
- Logs all errors for debugging

### ✅ Rate Limiting
- 1 second delay between batches
- Respects API limits

---

## When Does It Run?

### Currently: **Manual Only**
- Admin clicks "Sync Now" button in `/tracking` page
- Or calls API: `POST /api/tracking/sync`

### Recommended: **Automated**
Set up a cron job to run every 4-6 hours:
- Vercel Cron
- Firebase Cloud Scheduler
- External cron service

---

## What Gets Updated?

### In Firestore `orders` Collection:

```javascript
{
  orderId: "5024",
  internalStatus: "in_transit",  // ← Updated if changed
  customerFacingStatus: "shipped",  // ← Updated if changed
  needsTracking: true,  // ← Set to false if delivered
  
  shipmentInfo: {
    currentTrackingStatus: "Dispatched",  // ← Always updated
    trackingLocation: "Delhi Hub",  // ← Always updated
    trackingInstructions: "Out for delivery",  // ← Always updated
    lastTrackedAt: "2024-01-15T10:00:00Z",  // ← Always updated
    trackingDisabledReason: null  // ← Set if tracking disabled
  },
  
  notificationHistory: {
    lastNotifiedStatus: "out_for_delivery",  // ← Updated if notification sent
    lastNotifiedAt: "2024-01-15T10:00:00Z"  // ← Updated if notification sent
  },
  
  deliveryEstimate: {
    expectedDate: "2024-01-16",  // ← Updated if available
    confidence: "high"
  },
  
  updatedAt: "2024-01-15T10:00:00Z"  // ← Always updated
}
```

### In Firestore `notification_logs` Collection:

```javascript
{
  orderId: "5024",
  customerId: "CUST123",
  customerPhone: "+919999999999",
  notificationType: "out_for_delivery",
  channel: "whatsapp",
  status: "sent",
  messageId: "wamid.xxx",
  sentAt: "2024-01-15T10:00:00Z",
  retryCount: 0
}
```

---

## Summary

The tracking sync is a **smart, efficient system** that:

1. ✅ Finds orders that need tracking
2. ✅ Batches them for efficient API calls
3. ✅ Fetches latest status from Delhivery
4. ✅ Updates order tracking information
5. ✅ Detects status changes (especially "out for delivery")
6. ✅ Sends WhatsApp notifications (with duplicate prevention)
7. ✅ Stops tracking completed orders
8. ✅ Handles errors gracefully

**Result**: Customers get timely updates about their orders without manual intervention!
