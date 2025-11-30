# Customer Stats Not Updating - Root Cause & Fix

## Problem Discovered

When investigating order 5115, we found a **critical bug**: Customer statistics (totalOrders, totalSpent, lastOrderAt, loyaltyTier) were **NOT being updated** when orders were marked as delivered.

### Evidence
Multiple delivered orders had customers with incorrect stats:
- Order 5156 (Yusuf Farid): **delivered** but stats show **0 orders, ₹0 spent** ❌
- Order 5151 (Biseswar Mundary): **delivered** but stats show **0 orders, ₹0 spent** ❌
- Order 5127 (mohd hafeez): **delivered** but stats show **0 orders, ₹0 spent** ❌
- Order 5123 (Pardeep Mehroliya): **delivered** but stats show **0 orders, ₹0 spent** ❌
- Order 5113 (Akash deep): **delivered** but stats show **0 orders, ₹0 spent** ❌

## Root Cause

### The Missing Link
1. **Function exists but never called**: `updateCustomerAfterOrder()` in `src/lib/oms/customerIntelligence.ts` was created to update customer stats when order status changes
2. **Tracking sync doesn't call it**: `src/app/api/tracking/sync/route.ts` updates order status to "delivered" but **never calls** `updateCustomerAfterOrder()`
3. **Result**: Orders get delivered, but customer stats remain at 0

### Why This Happened
The customer intelligence module was built but never integrated into the tracking sync workflow. This is a classic integration gap.

## The Fix

### 1. Updated Tracking Sync (`src/app/api/tracking/sync/route.ts`)
Added customer stats update when order status changes to "delivered":

```typescript
// Update customer stats when order is delivered
if (newStatus === 'delivered') {
  try {
    const { updateCustomerAfterOrder } = await import('@/lib/oms/customerIntelligence');
    await updateCustomerAfterOrder(currentOrder.orderId, 'delivered');
    console.log(`[TRACKING_SYNC] Customer stats updated for order ${currentOrder.orderId}`);
  } catch (customerUpdateError: any) {
    console.error(`[TRACKING_SYNC] Failed to update customer stats for ${currentOrder.orderId}:`, customerUpdateError);
    // Don't fail the tracking update if customer stats update fails
  }
}
```

### 2. Fixed Customer Document Reference (`src/lib/oms/customerIntelligence.ts`)
The function was trying to update customers using phone as document ID, but customers are stored by customerId. Fixed to find the correct document reference:

```typescript
// Update timestamps - find correct customer document reference
const customerIdDoc = await db.collection("customers").doc(customer.customerId).get();
const phoneDoc = await db.collection("customers").doc(phone).get();

let customerRef;
if (customerIdDoc.exists) {
  customerRef = db.collection("customers").doc(customer.customerId);
} else if (phoneDoc.exists) {
  customerRef = db.collection("customers").doc(phone);
} else {
  console.error(`[customerIntelligence] Could not find customer document for ${phone}`);
  return;
}
```

## What Gets Updated

When an order is marked as "delivered", the system now updates:

1. **totalOrders**: Incremented by 1
2. **totalSpent**: Incremented by order total
3. **avgOrderValue**: Recalculated
4. **trustScore**: Increased by 2 points (max 100)
5. **loyaltyTier**: Recalculated based on total orders:
   - new: 0-2 orders
   - repeat: 3-10 orders
   - gold: 11-25 orders
   - platinum: 26+ orders
6. **lastOrderAt**: Set to current timestamp
7. **updatedAt**: Set to current timestamp

## Fixing Existing Data

### Run the Fix Script
A script has been created to fix all existing customers with incorrect stats:

```bash
node fix-customer-stats-for-delivered-orders.js
```

This script:
1. Loops through all customers
2. Counts their actual delivered orders
3. Calculates correct totalSpent
4. Updates customer stats if they're incorrect
5. Recalculates loyalty tier

### What the Script Does
- ✅ Counts delivered orders per customer
- ✅ Calculates total spent from delivered orders
- ✅ Finds latest delivery date
- ✅ Recalculates loyalty tier
- ✅ Updates customer document with correct stats
- ✅ Skips customers that are already correct

## Testing the Fix

### For New Orders
1. Create a test order
2. Mark it as delivered (via tracking sync or manual status update)
3. Check customer stats - should be updated immediately

### For Existing Orders
1. Run the fix script: `node fix-customer-stats-for-delivered-orders.js`
2. Check customers page - stats should now be correct
3. Use the "3+ Orders" filter to see repeat customers

## Impact

### Before Fix
- ❌ Customer stats stuck at 0 even after multiple deliveries
- ❌ Loyalty tiers not updating
- ❌ "3+ Orders" filter shows no results
- ❌ Customer segmentation broken
- ❌ Analytics inaccurate

### After Fix
- ✅ Customer stats update automatically on delivery
- ✅ Loyalty tiers calculated correctly
- ✅ "3+ Orders" filter works
- ✅ Customer segmentation accurate
- ✅ Analytics reliable

## Prevention

### Code Review Checklist
When adding new order status transitions:
1. ☑️ Check if customer stats need updating
2. ☑️ Call `updateCustomerAfterOrder()` if needed
3. ☑️ Test with real orders
4. ☑️ Verify customer stats update

### Monitoring
Watch for these signs of similar issues:
- Customers with many orders but stats show 0
- Loyalty tiers not matching order count
- lastOrderAt not updating

## Files Changed

1. `src/app/api/tracking/sync/route.ts` - Added customer stats update on delivery
2. `src/lib/oms/customerIntelligence.ts` - Fixed customer document reference lookup
3. `fix-customer-stats-for-delivered-orders.js` - Script to fix existing data

## Related Issues

This fix also resolves:
- Customers showing as "new" despite multiple orders
- Total spent not reflecting actual purchases
- Last order date not updating
- Customer segmentation (Active/Dormant/At Risk) being inaccurate

## Next Steps

1. ✅ Deploy the code changes
2. ⏳ Run the fix script to update existing customers
3. ⏳ Monitor logs for successful customer stats updates
4. ⏳ Verify customer stats are updating for new deliveries
5. ⏳ Check analytics dashboards for accurate data

## About Order 5115

**Note**: Order 5115 is actually in `payment_pending` status, NOT delivered. That's why the customer stats show 0 orders - which is correct! The order hasn't been paid for or delivered yet.

If you meant a different order number, please check the order ID again.
