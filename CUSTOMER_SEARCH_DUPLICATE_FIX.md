# Customer Search Fix - Duplicate Customer Issue

## Problem
When searching for customer phone `9999968191` in the Create Order dialog, the system was not returning the customer's name and address, even though a complete customer profile existed in the database.

## Root Cause Analysis

### Investigation Results:
Running `check-customer-9999968191.js` revealed:

1. **3 duplicate customers** existed with the same phone number `+919999968191`
2. The query `where('phone', '==', '+919999968191').orderBy('createdAt', 'desc')` returns the **most recent** customer first
3. The two most recent customers had **no name and no address** (empty profiles)
4. The oldest customer had complete data (Rohit Verma with full address)

### Duplicate Customers Found:
```
1. CUS_1764731381979 (Created: 08:39:42) ✓ COMPLETE
   - Name: Rohit Verma
   - Email: uniflyinsect@gmail.com
   - Has Address: YES
   - Saved Addresses: 1

2. CUS_1764731878648 (Created: 08:47:58) ❌ EMPTY
   - Name: N/A
   - Email: N/A
   - Has Address: NO
   - Saved Addresses: 0

3. CUS_1764733145297 (Created: 09:09:05) ❌ EMPTY
   - Name: N/A
   - Email: N/A
   - Has Address: NO
   - Saved Addresses: 0
```

### Why This Happened:
The `getCustomerByPhone()` function uses `orderBy('createdAt', 'desc').limit(1)`, which returns the **newest** customer first. Since the two newest customers were empty, the search was returning incomplete data.

## Solution

### Immediate Fix:
Deleted the duplicate empty customer records using `fix-duplicate-9999968191.js`:
- ✓ Kept: `CUS_1764731381979` (Rohit Verma - complete profile)
- ❌ Deleted: `CUS_1764731878648` (empty profile)
- ❌ Deleted: `CUS_1764733145297` (empty profile)

### Verification:
After cleanup, only 1 customer remains with phone `+919999968191`:
- Customer ID: `CUS_1764731381979`
- Name: Rohit Verma
- Email: uniflyinsect@gmail.com
- Address: I-264 sector 3 Bawana industrial area New Delhi, North West Delhi, Delhi 110039

## Prevention Strategy

### Why Duplicates Were Created:
Looking at the timestamps, all 3 customers were created within 30 minutes on the same day. This suggests:
1. Multiple order creation attempts
2. No duplicate prevention logic in `createOrUpdateCustomer()`
3. Race conditions or multiple simultaneous requests

### Recommended Improvements:

1. **Add Unique Constraint** (Firestore doesn't support this natively, but we can enforce it in code):
```typescript
// In createOrUpdateCustomer(), always check for existing customer first
const existingCustomer = await getCustomerByPhone(phone);
if (existingCustomer) {
  // Update existing customer instead of creating new one
  return updateExistingCustomer(existingCustomer.customerId, data);
}
```

2. **Improve Query Logic** to prefer complete profiles:
```typescript
// Option A: Filter out customers without names
const customers = await db.collection('customers')
  .where('phone', '==', normalizedPhone)
  .get();

// Return the one with most complete data
const bestCustomer = customers.docs
  .map(doc => ({ id: doc.id, data: doc.data() }))
  .filter(c => c.data.name) // Must have name
  .sort((a, b) => {
    // Prefer customers with addresses
    if (a.data.defaultAddress && !b.data.defaultAddress) return -1;
    if (!a.data.defaultAddress && b.data.defaultAddress) return 1;
    // Then by order count
    return (b.data.totalOrders || 0) - (a.data.totalOrders || 0);
  })[0];
```

3. **Add Duplicate Detection Script** to run periodically:
```bash
# Find all duplicate phone numbers
node scripts/find-all-duplicate-customers.js

# Clean up duplicates automatically
node scripts/cleanup-duplicate-customers.js --confirm
```

## Testing

### Manual Test:
1. Go to Orders page → Create Order
2. Enter phone: `9999968191`
3. Click search
4. ✅ Should now show: "Rohit Verma" with full address

### Automated Test:
```bash
node check-customer-9999968191.js
# Should show exactly 1 customer with complete data
```

## Files Created/Modified

### New Scripts:
- `fix-duplicate-9999968191.js` - Cleanup script for this specific phone
- `check-customer-9999968191.js` - Diagnostic script (already existed)

### Code Changes:
- `src/lib/oms/customerUtils.ts` - Fixed timestamp handling (previous fix)
- `src/app/api/customers/[phone]/route.ts` - Added logging (previous fix)

## Related Issues
- Customer search returning empty profiles
- Duplicate customer creation
- Order creation for existing customers
- Address auto-fill not working

## Status
✅ **FIXED** - Customer `9999968191` now returns complete profile with address
