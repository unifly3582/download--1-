# Delhivery Tracking Sync - Issues & Fixes

## 🔍 Problems Identified

### 1. **Notifications Not Sending**
**Issue**: The tracking sync was updating order statuses but NOT sending WhatsApp notifications.

**Root Cause**: The notification logic was inside an `if (newStatus !== currentOrder.internalStatus)` block. This meant:
- Notifications only fired when the internal status CHANGED
- Orders that were already in `shipped`, `in_transit`, or `pending` status wouldn't get notifications
- First-time tracking updates wouldn't trigger notifications if the status was already set

**Example**:
- Order 5024: Status = `pending`, Delhivery says `Pending` → No change → No notification ❌
- Order 5025: Status = `in_transit`, Delhivery says `In Transit` → No change → No notification ❌

### 2. **Incorrect WhatsApp Template Structure**
**Issue**: The `buggly_out_for_delivery` template had incorrect component structure.

**Root Cause**: 
- Code defined a `header` component with parameters
- Actual Meta template has a static header "Order Update" with NO parameters
- This would cause API errors when sending the template

**Actual Template Structure** (from Meta):
```
HEADER: "Order Update" (static, no variables)
BODY: "Hi {{1}}! 🚚 Your order {{2}} is out for delivery today! 📦 AWB: {{3}} 📍 Current Location: {{4}}"
FOOTER: "Buggly Farms - Healthy Chickens" (static)
```

### 3. **No Cron Job Configured**
**Issue**: Tracking sync only runs manually via dashboard button.

**Current State**: No automated scheduling exists. The sync must be triggered:
- Manually via `/tracking` page "Sync Now" button
- Via API call to `POST /api/tracking/sync`

## ✅ Fixes Applied

### Fix 1: Notification Logic Moved Outside Status Change Block
**File**: `src/app/api/tracking/sync/route.ts`

**Changes**:
```typescript
// BEFORE: Notifications only when status changes
if (newStatus !== currentOrder.internalStatus) {
  // ... status update code ...
  // ... notification code was HERE ...
}

// AFTER: Notifications checked independently
if (newStatus !== currentOrder.internalStatus) {
  // ... status update code only ...
}

// Notification logic moved outside - checks all orders
const shouldNotify = isEnabled && notificationStatus !== lastNotifiedStatus;
```

**Benefits**:
- Notifications now fire for orders that haven't been notified yet, regardless of status change
- Catches "missed" notifications from previous syncs
- Still prevents duplicate notifications using `lastNotifiedStatus` tracking

### Fix 2: Improved Notification Status Detection
**File**: `src/app/api/tracking/sync/route.ts`

**Changes**:
```typescript
// For shipped orders that haven't been notified yet
else if (['shipped', 'in_transit', 'pending'].includes(newStatus) && !lastNotifiedStatus) {
  notificationStatus = 'shipped';
}
```

**Benefits**:
- Orders in `in_transit` or `pending` status that never got a "shipped" notification will now get one
- Ensures customers are informed even if initial notification was missed

### Fix 3: Corrected WhatsApp Template Structure
**File**: `src/lib/whatsapp/templates.ts`

**Changes**:
```typescript
// BEFORE: Had header component with parameters
export const ORDER_OUT_FOR_DELIVERY_TEMPLATE: WhatsAppTemplate = {
  components: [
    { type: "header", parameters: [...] },  // ❌ Wrong
    { type: "body", parameters: [...] }
  ]
};

// AFTER: Only body component with parameters
export const ORDER_OUT_FOR_DELIVERY_TEMPLATE: WhatsAppTemplate = {
  components: [
    { type: "body", parameters: [...] }  // ✅ Correct
  ]
};
```

**Benefits**:
- Matches actual Meta template structure
- Prevents API errors when sending notifications
- Correct parameter mapping

## 🧪 Testing

### Test 1: Diagnostic Script
**File**: `test-tracking-sync.js`

**Run**: `node test-tracking-sync.js`

**What it checks**:
- ✅ Delhivery API credentials
- ✅ Orders needing tracking
- ✅ WhatsApp configuration
- ✅ Notification history
- ✅ Customer opt-in status

### Test 2: Manual Sync Trigger
**File**: `trigger-tracking-sync.js`

**Run**: `node trigger-tracking-sync.js`

**What it does**:
- Calls the tracking sync API endpoint
- Shows sync results and statistics
- Displays any errors encountered

### Test 3: Dashboard Manual Sync
**Location**: `/tracking` page in dashboard

**Steps**:
1. Navigate to `/tracking` page
2. Click "Sync Now" button
3. Check notification logs in Firestore
4. Verify WhatsApp messages sent to customers

## 📊 Current Status

### Working ✅
- Delhivery API integration
- Order tracking updates
- Status mapping (Delhivery → Internal)
- WhatsApp credentials configured
- Template structure corrected

### Fixed ✅
- Notification logic (now fires correctly)
- Template parameter mapping
- Duplicate notification prevention

### Still Needed ⚠️
- **Automated Cron Job** - Currently manual only

## 🔄 Setting Up Automated Tracking (Optional)

### Option 1: Vercel Cron Jobs
Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/tracking/sync",
    "schedule": "0 */6 * * *"
  }]
}
```

### Option 2: Firebase Cloud Scheduler
Create a Cloud Scheduler job:
```bash
gcloud scheduler jobs create http tracking-sync \
  --schedule="0 */6 * * *" \
  --uri="https://your-domain.com/api/tracking/sync" \
  --http-method=POST \
  --headers="Authorization=Bearer YOUR_MACHINE_TOKEN"
```

### Option 3: External Cron Service
Use services like:
- cron-job.org
- EasyCron
- GitHub Actions (scheduled workflows)

## 📝 How Tracking Sync Works Now

1. **Query**: Fetches orders where `needsTracking = true` and `courierPartner = 'delhivery'`
2. **Batch**: Groups AWBs in batches of 50
3. **API Call**: Calls Delhivery tracking API for each batch
4. **Process Response**: For each shipment:
   - Updates tracking info (status, location, timestamp)
   - Maps Delhivery status to internal status
   - **Checks if notification should be sent** (NEW!)
   - Sends WhatsApp notification if:
     - Template is approved (shipped, out_for_delivery)
     - Customer hasn't been notified for this status yet
     - Customer has WhatsApp opt-in enabled
5. **Update Firestore**: Saves all changes to order document
6. **Log**: Records notification attempt in `notification_logs` collection

## 🎯 Expected Behavior After Fix

### Scenario 1: Order Already Shipped (No Previous Notification)
- **Before**: No notification sent ❌
- **After**: "Shipped" notification sent ✅

### Scenario 2: Order Out for Delivery
- **Before**: Template error, notification fails ❌
- **After**: "Out for Delivery" notification sent ✅

### Scenario 3: Order Status Unchanged
- **Before**: No notification check ❌
- **After**: Checks if notification needed, sends if missing ✅

### Scenario 4: Duplicate Prevention
- **Before**: ✅ Working
- **After**: ✅ Still working (uses `lastNotifiedStatus`)

## 🔧 Troubleshooting

### If notifications still don't send:

1. **Check server logs** during sync:
   ```
   [TRACKING_SYNC] Notification sent: shipped for 5024
   [TRACKING_SYNC] Notification skipped for 5025: enabled=true, status=shipped, lastNotified=shipped
   ```

2. **Check notification_logs collection** in Firestore:
   - Should have entries with `status: 'sent'` or `status: 'failed'`
   - If `failed`, check the `error` field

3. **Verify WhatsApp API response**:
   - Check for `messageId` in logs
   - Look for API errors in server console

4. **Test WhatsApp service directly**:
   ```javascript
   const { createWhatsAppService } = require('./src/lib/whatsapp/service');
   const service = createWhatsAppService();
   // Test sending a message
   ```

## 📞 Support

If issues persist:
1. Run `node test-tracking-sync.js` and share output
2. Check server logs during manual sync
3. Verify Firestore `notification_logs` collection
4. Check WhatsApp Business Manager for delivery status
