# Delhivery Status Mapping - Quick Reference

## Important Discovery

**"Dispatched" = "Out for Delivery"** in Delhivery's system.

When Delhivery returns status `"Dispatched"`, it means the package is out for delivery to the customer, NOT just dispatched from a hub.

## Delhivery Status Values

### Status → Internal Mapping

| Delhivery Status | Internal Status | Customer Status | Notification Sent |
|------------------|-----------------|-----------------|-------------------|
| `Manifested` | `shipped` | `shipped` | ✅ Shipped |
| `Not Picked` | `shipped` | `shipped` | ✅ Shipped |
| `In Transit` | `in_transit` | `shipped` | ❌ None |
| `Pending` | `pending` | `shipped` | ❌ None |
| **`Dispatched`** | `in_transit` | `shipped` | ✅ **Out for Delivery** |
| `Out for Delivery` | `in_transit` | `shipped` | ✅ Out for Delivery |
| `Out-for-Delivery` | `in_transit` | `shipped` | ✅ Out for Delivery |
| `Delivered` | `delivered` | `delivered` | ⚠️ Not enabled yet |
| `RTO Initiated` | `return_initiated` | `returned` | ❌ None |
| `RTO Delivered` | `returned` | `returned` | ❌ None |

## Notification Logic

### "Out for Delivery" Notification Triggers

The notification is sent when Delhivery status is:
- `"Dispatched"` ✅ **MOST COMMON**
- `"Out for Delivery"` ✅
- `"Out-for-Delivery"` ✅
- Any variation with spaces/hyphens/underscores ✅

### Code Implementation

```typescript
// Check for "out for delivery" status
// Delhivery uses "Dispatched" or "Out for Delivery" to indicate out for delivery
const statusLower = (delhiveryStatus || '').toLowerCase().replace(/[_\s-]/g, '');
const isOutForDelivery = statusLower.includes('outfordelivery') || 
                         statusLower.includes('dispatched');

if (isOutForDelivery) {
  notificationStatus = 'out_for_delivery';
}
```

## Why This Matters

### Before Fix:
- Delhivery returns `"Dispatched"`
- Code only checked for "out for delivery" string
- Notification NOT sent ❌
- Customer doesn't know package is coming today

### After Fix:
- Delhivery returns `"Dispatched"`
- Code checks for "dispatched" OR "out for delivery"
- Notification sent ✅
- Customer gets WhatsApp: "Your order is out for delivery today!"

## Testing

### Test Case 1: Dispatched Status
```
Given: Order with lastNotifiedStatus = 'shipped'
When: Delhivery returns status = "Dispatched"
Then: Should send "out for delivery" notification ✅
```

### Test Case 2: Out for Delivery Status
```
Given: Order with lastNotifiedStatus = 'shipped'
When: Delhivery returns status = "Out for Delivery"
Then: Should send "out for delivery" notification ✅
```

### Test Case 3: Already Notified
```
Given: Order with lastNotifiedStatus = 'out_for_delivery'
When: Delhivery returns status = "Dispatched"
Then: Should NOT send notification ✅ (prevents duplicate)
```

## Verification Steps

1. **Check an order in Firestore**:
   ```javascript
   {
     shipmentInfo: {
       currentTrackingStatus: "Dispatched",  // ← This means out for delivery
       trackingLocation: "Delhi Hub"
     },
     notificationHistory: {
       lastNotifiedStatus: "shipped"  // ← Should trigger notification
     }
   }
   ```

2. **Run tracking sync**:
   - Go to `/tracking` page
   - Click "Sync Now"
   - Check server logs

3. **Expected log**:
   ```
   [TRACKING_SYNC] Notification sent: out_for_delivery for 5024
   ```

4. **Check Firestore after sync**:
   ```javascript
   {
     notificationHistory: {
       lastNotifiedStatus: "out_for_delivery",  // ← Updated
       lastNotifiedAt: "2024-01-15T10:00:00Z"
     }
   }
   ```

5. **Check customer WhatsApp**:
   ```
   Order Update
   
   Hi [Name]! 🚚
   
   Your order [OrderID] is out for delivery today!
   
   📦 AWB: [AWB]
   📍 Current Location: [Location]
   
   Your package will be delivered soon. Please be available to receive it.
   
   Thank you for shopping with Buggly Farms! 🌱
   ```

## Common Delhivery Status Flow

Typical order journey:
```
1. Manifested → "Shipped" notification sent
2. In Transit → No notification
3. In Transit → No notification
4. Dispatched → "Out for Delivery" notification sent ✅
5. Delivered → No notification (template not approved yet)
```

## Summary

✅ **Fixed**: Now recognizes "Dispatched" as "out for delivery"  
✅ **Handles**: All variations of "out for delivery" status  
✅ **Prevents**: Duplicate notifications  
✅ **Sends**: WhatsApp notification when package is out for delivery  

## Related Files

- `src/app/api/tracking/sync/route.ts` - Main tracking sync logic
- `OUT_FOR_DELIVERY_NOTIFICATION_GUIDE.md` - Detailed troubleshooting guide
- `DUPLICATE_NOTIFICATION_FIX.md` - Fix for duplicate shipped notifications
