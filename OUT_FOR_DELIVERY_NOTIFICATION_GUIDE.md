# Out For Delivery Notification - Troubleshooting Guide

## When Should It Send?

The "Out for Delivery" notification should be sent when:

### ✅ All Conditions Met:
1. **Delhivery status** contains "out for delivery" (any format)
2. **Template is enabled** (`out_for_delivery: true` in tracking sync)
3. **Not already sent** (`lastNotifiedStatus !== 'out_for_delivery'`)
4. **Customer opted in** (WhatsApp notifications enabled)

## How It Works

### Step-by-Step Flow:

```
1. Tracking Sync Runs
   ↓
2. Fetches tracking data from Delhivery API
   ↓
3. Delhivery returns status: "Out for Delivery"
   ↓
4. Code checks if status contains "out for delivery"
   ↓
5. Sets notificationStatus = 'out_for_delivery'
   ↓
6. Checks lastNotifiedStatus (e.g., 'shipped')
   ↓
7. 'out_for_delivery' !== 'shipped' → TRUE
   ↓
8. Sends WhatsApp notification
   ↓
9. Updates lastNotifiedStatus = 'out_for_delivery'
```

## Delhivery Status Values for "Out For Delivery"

**IMPORTANT**: Delhivery uses **"Dispatched"** to indicate "out for delivery", NOT the literal string "Out for Delivery".

Delhivery might return any of these:
- `"Dispatched"` ✅ **MOST COMMON** - This means out for delivery
- `"Out for Delivery"` ✅ (with spaces)
- `"Out-for-Delivery"` ✅ (with hyphens)
- `"Out_for_Delivery"` ✅ (with underscores)
- `"OutForDelivery"` ✅ (no separators)

### Fix Applied:
Updated the check to handle ALL formats including "Dispatched":
1. Converting to lowercase
2. Removing all spaces, hyphens, and underscores
3. Checking if it contains "outfordelivery" OR "dispatched"

```typescript
// OLD (missed "Dispatched")
const isOutForDelivery = delhiveryStatus?.toLowerCase().includes('out for delivery') || 
                         delhiveryStatus?.toLowerCase().includes('out-for-delivery');

// NEW (handles all formats including "Dispatched")
const statusLower = (delhiveryStatus || '').toLowerCase().replace(/[_\s-]/g, '');
const isOutForDelivery = statusLower.includes('outfordelivery') || 
                         statusLower.includes('dispatched');
```

## Why It Might Not Send

### 1. Already Sent
**Check**: Look at `notificationHistory.lastNotifiedStatus` in Firestore
```javascript
// If this is already 'out_for_delivery', notification won't send again
order.notificationHistory.lastNotifiedStatus === 'out_for_delivery'
```

**Solution**: This is correct behavior (prevents duplicates)

### 2. Status String Doesn't Match
**Check**: Look at `shipmentInfo.currentTrackingStatus` in Firestore
```javascript
// If Delhivery returns something unexpected
order.shipmentInfo.currentTrackingStatus === "Dispatched for Delivery"  // ❌ Won't match
```

**Solution**: ✅ Fixed with improved regex check

### 3. Customer Opted Out
**Check**: Look at customer notification preferences
```javascript
order.customerNotifications.notificationPreferences.whatsapp === false
```

**Solution**: Customer must opt-in for WhatsApp notifications

### 4. Template Not Enabled
**Check**: Look at enabled notifications in tracking sync
```javascript
const enabledNotifications = {
  out_for_delivery: false  // ❌ Disabled
};
```

**Solution**: ✅ Already enabled (`out_for_delivery: true`)

### 5. Notification Service Error
**Check**: Look at server logs for errors
```
[TRACKING_SYNC] Failed to send notification: <error message>
```

**Solution**: Check WhatsApp API credentials and template approval

## Debugging Steps

### Step 1: Run Debug Script
```bash
node debug-out-for-delivery.js
```

This will show:
- Orders with "Out for Delivery" status
- Exact status string from Delhivery
- Current `lastNotifiedStatus` value
- Whether notification should send

### Step 2: Check Firestore
Look at an order document:
```javascript
{
  orderId: "5024",
  shipmentInfo: {
    currentTrackingStatus: "Out for Delivery",  // ← Check this
    trackingLocation: "Delhi Hub",
    lastTrackedAt: "2024-01-15T10:00:00Z"
  },
  notificationHistory: {
    lastNotifiedStatus: "shipped",  // ← Check this
    lastNotifiedAt: "2024-01-14T08:00:00Z"
  }
}
```

**Expected**: If `currentTrackingStatus` contains "out for delivery" and `lastNotifiedStatus` is NOT "out_for_delivery", notification should send.

### Step 3: Check Notification Logs
Look at `notification_logs` collection:
```javascript
{
  orderId: "5024",
  notificationType: "out_for_delivery",
  status: "sent" | "failed",
  error: "...",  // If failed
  sentAt: "2024-01-15T10:05:00Z"
}
```

### Step 4: Check Server Logs
Look for these log messages:
```
✅ [TRACKING_SYNC] Notification sent: out_for_delivery for 5024
❌ [TRACKING_SYNC] Notification skipped for 5024: enabled=true, status=out_for_delivery, lastNotified=out_for_delivery
❌ [TRACKING_SYNC] Failed to send notification: <error>
```

## Testing

### Test Scenario 1: First Time Out For Delivery
```
Given: Order with lastNotifiedStatus = 'shipped'
When: Delhivery status = "Out for Delivery"
Then: Should send notification ✅
```

### Test Scenario 2: Already Notified
```
Given: Order with lastNotifiedStatus = 'out_for_delivery'
When: Delhivery status = "Out for Delivery"
Then: Should NOT send notification ✅ (prevents duplicate)
```

### Test Scenario 3: Different Status Format
```
Given: Order with lastNotifiedStatus = 'shipped'
When: Delhivery status = "Out-for-Delivery" or "OutForDelivery"
Then: Should send notification ✅ (now handles all formats)
```

## Manual Test

1. **Find an order** that's out for delivery:
   ```bash
   node debug-out-for-delivery.js
   ```

2. **Check its status** in Firestore:
   - `shipmentInfo.currentTrackingStatus` should contain "out for delivery"
   - `notificationHistory.lastNotifiedStatus` should NOT be "out_for_delivery"

3. **Run tracking sync**:
   - Go to `/tracking` page
   - Click "Sync Now"
   - Check server logs

4. **Verify notification sent**:
   - Check `notification_logs` collection
   - Check customer's WhatsApp
   - Check `notificationHistory.lastNotifiedStatus` updated to "out_for_delivery"

## Summary

### ✅ What Was Fixed:
- Improved status string matching to handle all Delhivery formats
- Now removes spaces, hyphens, and underscores before checking

### ✅ What Should Happen:
- When Delhivery status changes to "Out for Delivery"
- And customer hasn't been notified yet
- Notification is sent automatically
- `lastNotifiedStatus` is updated to prevent duplicates

### ⚠️ What Won't Happen:
- Duplicate notifications (prevented by `lastNotifiedStatus` check)
- Notifications to customers who opted out
- Notifications if template is disabled

## Next Steps

1. Run `node debug-out-for-delivery.js` to check current state
2. Test with a real order that's out for delivery
3. Monitor server logs during tracking sync
4. Verify notification appears in `notification_logs` collection
