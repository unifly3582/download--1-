# Delhivery Tracking Sync - Quick Guide

## 🚀 How to Use

### Manual Sync via Dashboard
1. Go to `http://localhost:9006/tracking` (or your production URL)
2. Click the **"Sync Now"** button
3. Wait for sync to complete
4. Check the results on the page

### Manual Sync via Script
```bash
node trigger-tracking-sync.js
```

### Test Diagnostics
```bash
node test-tracking-sync.js
```

### Test Single Order Notification
```bash
node test-single-notification.js 5024
```
(Replace `5024` with your order ID)

## 📋 What Was Fixed

### Problem 1: Notifications Not Sending ❌
**Why**: Notifications only fired when order status changed. Orders already in `shipped`, `in_transit`, or `pending` status never got notifications.

**Fixed**: ✅ Notifications now check all orders and send if customer hasn't been notified yet, regardless of status change.

### Problem 2: Wrong Template Structure ❌
**Why**: `buggly_out_for_delivery` template had incorrect header component with parameters.

**Fixed**: ✅ Template structure now matches Meta's approved template (body only, no header parameters).

### Problem 3: No Automated Sync ⚠️
**Status**: Still manual only. You need to either:
- Click "Sync Now" button in dashboard
- Set up a cron job (see options below)

## 🔄 How Tracking Works Now

1. **Finds orders** that need tracking (Delhivery shipments)
2. **Calls Delhivery API** to get latest status
3. **Updates order** with tracking info
4. **Checks notifications**:
   - ✅ Sends "shipped" notification if customer hasn't received it
   - ✅ Sends "out for delivery" notification when status changes
   - ❌ Skips "delivered" (template not approved yet)
5. **Prevents duplicates** using `lastNotifiedStatus` field

## 📊 Enabled Notifications

| Status | Template Name | Enabled | Notes |
|--------|--------------|---------|-------|
| Shipped | `buggly_order_shipped` | ✅ Yes | Sent when order is shipped or in transit |
| Out for Delivery | `buggly_out_for_delivery` | ✅ Yes | Sent when Delhivery status includes "out for delivery" |
| Delivered | `order_delivered_notification` | ❌ No | Template not created/approved yet |

## 🔧 Setting Up Automated Sync (Choose One)

### Option 1: Vercel Cron (Easiest)
Create `vercel.json` in project root:
```json
{
  "crons": [{
    "path": "/api/tracking/sync",
    "schedule": "0 */6 * * *"
  }]
}
```
This runs every 6 hours.

### Option 2: External Cron Service
Use https://cron-job.org:
1. Create account
2. Add new cron job
3. URL: `https://your-domain.com/api/tracking/sync`
4. Method: POST
5. Schedule: Every 6 hours
6. Add header: `Authorization: Bearer YOUR_MACHINE_TOKEN`

### Option 3: GitHub Actions
Create `.github/workflows/tracking-sync.yml`:
```yaml
name: Tracking Sync
on:
  schedule:
    - cron: '0 */6 * * *'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Sync
        run: |
          curl -X POST https://your-domain.com/api/tracking/sync \
            -H "Authorization: Bearer ${{ secrets.MACHINE_TOKEN }}"
```

## 🧪 Testing Checklist

After deploying fixes:

- [ ] Run `node test-tracking-sync.js` - Should show orders needing tracking
- [ ] Click "Sync Now" in dashboard - Should complete without errors
- [ ] Check Firestore `notification_logs` collection - Should have new entries
- [ ] Check customer WhatsApp - Should receive messages
- [ ] Verify no duplicate messages sent
- [ ] Check server logs for any errors

## 📱 WhatsApp Message Examples

### Shipped Notification
```
Hello Basavaraj! 📦

Your order 5024 has been shipped via Delhivery.
📋 AWB: 31232410021696
💰 Amount: ₹500
💳 Payment: COD

Track your shipment: https://www.delhivery.com/track-v2/package/31232410021696
Thank you for shopping with us !!

- Buggly Farms
```

### Out for Delivery Notification
```
Order Update

Hi Basavaraj! 🚚

Your order 5024 is out for delivery today!

📦 AWB: 31232410021696
📍 Current Location: Delhi Hub

Your package will be delivered soon. Please be available to receive it.

Thank you for shopping with Buggly Farms! 🌱

Buggly Farms - Healthy Chickens
```

## ⚠️ Important Notes

1. **First Sync After Fix**: Will send notifications to all orders that haven't been notified yet
2. **Duplicate Prevention**: Uses `notificationHistory.lastNotifiedStatus` to prevent duplicates
3. **Customer Opt-out**: Respects `customerNotifications.notificationPreferences.whatsapp` setting
4. **Rate Limiting**: 1 second delay between API batches (50 orders per batch)
5. **Error Handling**: Notification failures don't stop tracking updates

## 🐛 Troubleshooting

### No notifications sent?
1. Check WhatsApp credentials in `.env.local`
2. Run `node test-tracking-sync.js` to see order status
3. Check `notification_logs` collection in Firestore
4. Look for errors in server console

### Duplicate notifications?
- Check `notificationHistory.lastNotifiedStatus` field in order document
- Should be set after first notification

### Template errors?
- Verify template names match Meta approval
- Check parameter count matches template structure
- Review `template-details.json` for correct structure

## 📞 Need Help?

1. Run diagnostics: `node test-tracking-sync.js`
2. Check logs in Firestore: `notification_logs` collection
3. Test single order: `node test-single-notification.js ORDER_ID`
4. Review `TRACKING_SYNC_FIX_SUMMARY.md` for detailed explanation
