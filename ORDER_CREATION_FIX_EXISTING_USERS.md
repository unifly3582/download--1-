# Order Creation Fix for Existing Users

## Problem Identified

When existing users (users who already have data in the system) log in and try to create an order, the order creation fails.

## Root Cause

The issue is in the **phone number normalization** during customer data updates in `src/lib/oms/customerUtils.ts`.

### Technical Details:

1. **Customer Schema Validation** (`src/types/customers.ts`):
   - The `CustomerSchema` has a phone field that transforms and validates phone numbers
   - It expects format: `+91XXXXXXXXXX` (with +91 prefix and exactly 10 digits)
   - The transform adds `+91` if not present

2. **The Problem Flow**:
   ```
   User logs in → Order creation starts → createOrUpdateCustomer() called
   → Phone passed as parameter (may or may not have +91 prefix)
   → Existing customer data retrieved from database
   → Update data merged with existing data
   → Phone format mismatch causes validation issues
   → Order creation fails
   ```

3. **Specific Issue**:
   - When updating existing customers, the phone number wasn't being normalized consistently
   - If the incoming phone was `8700925487` but database had `+918700925487`, or vice versa
   - The validation would fail or create inconsistencies
   - This prevented the customer update, which blocked order creation

## Solution Applied

### Changes Made to `src/lib/oms/customerUtils.ts`:

#### 1. New Customer Creation (Line ~70):
```typescript
// Normalize phone number format to ensure consistency
const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

const newCustomerObject = {
    ...defaults,
    ...data,
    ...addressData,
    customerId: newCustomerId,
    phone: normalizedPhone, // Use normalized phone
};
```

#### 2. Existing Customer Update (Line ~100):
```typescript
// Normalize phone number format to ensure consistency
const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

let updateData: any = { 
    ...data,
    phone: normalizedPhone // Use normalized phone
};

// Enhanced filtering to skip timestamp fields
const cleanUpdateData = Object.fromEntries(
    Object.entries(updateData).filter(([key, value]) => {
        if (value === undefined) return false;
        if (['createdAt', 'updatedAt'].includes(key)) return false;
        return true;
    })
);
```

## What This Fixes

✅ **Phone Number Consistency**: All phone numbers are now normalized to `+91XXXXXXXXXX` format before any database operations

✅ **Existing User Updates**: When existing users place orders, their customer data is updated without validation errors

✅ **New User Creation**: New users also get consistent phone number format from the start

✅ **Timestamp Handling**: Improved filtering to prevent timestamp field conflicts during updates

## Testing Recommendations

### Test Case 1: Existing User with Orders
```
Phone: 8700925487 (or +918700925487)
Action: Login and create new order
Expected: Order created successfully
```

### Test Case 2: New User
```
Phone: 9876543210
Action: First time order
Expected: Customer created and order placed successfully
```

### Test Case 3: Existing User Different Phone Format
```
Scenario: User stored as +918700925487, logs in with 8700925487
Expected: System recognizes as same user, order succeeds
```

## Verification Steps

1. **Check Customer Data**:
   ```javascript
   // Run diagnose-order-issue.js
   node diagnose-order-issue.js
   ```

2. **Monitor Logs**:
   - Look for `[OMS][CUSTOMER_UTILS]` entries
   - Check for "Creating new customer" vs "Updating existing customer"
   - Verify phone format in logs

3. **Test Order Creation**:
   - Use both phone formats (with and without +91)
   - Verify order is created successfully
   - Check customer data is updated correctly

## Additional Notes

- The fix maintains backward compatibility with existing customer data
- No database migration needed - normalization happens at runtime
- Cache updates are handled gracefully (won't fail if cache update fails)
- All existing functionality preserved

## Files Modified

1. `src/lib/oms/customerUtils.ts`
   - Line ~70: New customer creation phone normalization
   - Line ~100: Existing customer update phone normalization
   - Enhanced filtering logic for update data

## Related Files (No Changes Needed)

- `src/app/api/customer/orders/create/route.ts` - COD orders
- `src/app/api/razorpay/create-order/route.ts` - Prepaid orders
- `src/types/customers.ts` - Customer schema (working as designed)
