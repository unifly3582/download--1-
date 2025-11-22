# Order Creation Fix for Existing Users

## Problem Identified

When existing users (users who already have data in the system) log in and try to create an order, the order creation fails. Specifically:
- **New users**: Can place orders successfully
- **New users who re-login**: Can place orders successfully  
- **Existing users with customer data and addresses**: Order creation fails

## Root Causes

Multiple issues were identified in the customer update flow in `src/lib/oms/customerUtils.ts`:

### 1. Phone Number Normalization
Phone numbers weren't being normalized consistently between database storage and incoming requests.

### 2. Address Structure Mismatch
Existing customers may have addresses with a `label` field (e.g., "Home", "Office"), but order creation doesn't include this field, causing validation conflicts.

### 3. Overly Broad Data Spreading
The update logic was spreading all incoming data (`...data`) which could include undefined fields or cause conflicts with existing customer data structure.

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

#### 2. Existing Customer Update (Line ~185) - **MAJOR FIX**:
```typescript
// Normalize phone number format to ensure consistency
const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

// Build update data carefully - only include fields that are explicitly provided
let updateData: any = { 
    phone: normalizedPhone // Always ensure phone is in normalized format
};

// Only update fields that are explicitly provided in data parameter
if (data.name !== undefined) updateData.name = data.name;
if (data.email !== undefined) updateData.email = data.email;
if (data.preferredLanguage !== undefined) updateData.preferredLanguage = data.preferredLanguage;
if (data.whatsappOptIn !== undefined) updateData.whatsappOptIn = data.whatsappOptIn;

// Handle address updates for existing customer
if (shippingAddress) {
    // Normalize the address - remove any label field if it exists
    const normalizedAddress = {
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.zip,
        country: shippingAddress.country
    };
    
    updateData.defaultAddress = normalizedAddress;
}

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

✅ **Address Structure Normalization**: Addresses are normalized to remove optional fields like `label` that might exist in saved addresses but not in order addresses

✅ **Selective Field Updates**: Only explicitly provided fields are updated, preventing undefined values or unwanted field overwrites

✅ **Existing User Updates**: When existing users place orders, their customer data is updated without validation errors or field conflicts

✅ **New User Creation**: New users also get consistent phone number and address format from the start

✅ **Timestamp Handling**: Improved filtering to prevent timestamp field conflicts during updates

✅ **Better Logging**: Added logging to show which fields are being updated for easier debugging

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

## Why Existing Users Were Affected

The issue specifically affected existing users because:

1. **Existing customers** have complete profiles with addresses that may include optional fields like `label`
2. **Order creation** sends minimal customer data (name, phone, email) and a shipping address without optional fields
3. **The old update logic** used `...data` spread operator, which could:
   - Include undefined fields
   - Overwrite existing customer data unintentionally
   - Cause validation failures when merging different address structures
4. **New users** worked fine because they had no existing data to conflict with

### The Specific Flow That Failed:

```
Existing User Login
  ↓
User has: { name, phone: "+918700925487", defaultAddress: { label: "Home", street: "...", ... } }
  ↓
User creates order with: { name, phone: "8700925487", shippingAddress: { street: "...", ... } }
  ↓
createOrUpdateCustomer called with spread operator: { ...data, phone, defaultAddress }
  ↓
Validation fails or field conflicts occur
  ↓
Order creation fails ❌
```

### The Fixed Flow:

```
Existing User Login
  ↓
User has: { name, phone: "+918700925487", defaultAddress: { label: "Home", street: "...", ... } }
  ↓
User creates order with: { name, phone: "8700925487", shippingAddress: { street: "...", ... } }
  ↓
createOrUpdateCustomer with selective updates:
  - Normalize phone: "+918700925487"
  - Only update provided fields: name, email (if provided)
  - Normalize address: remove label, keep core fields
  ↓
Update succeeds with clean data
  ↓
Order creation succeeds ✅
```

## Additional Notes

- The fix maintains backward compatibility with existing customer data
- No database migration needed - normalization happens at runtime
- Cache updates are handled gracefully (won't fail if cache update fails)
- All existing functionality preserved
- Addresses with `label` fields in saved addresses are preserved, only `defaultAddress` is normalized during order creation

## Files Modified

1. `src/lib/oms/customerUtils.ts`
   - Line ~130: New customer creation phone normalization
   - Line ~185: **MAJOR FIX** - Existing customer update with selective field updates
   - Address normalization to remove optional `label` field
   - Enhanced filtering logic for update data
   - Added detailed logging for debugging

## Files Created

1. `test-existing-customer-order.js` - Diagnostic script to test existing customer order flow

## Related Files (No Changes Needed)

- `src/app/api/customer/orders/create/route.ts` - COD orders
- `src/app/api/razorpay/create-order/route.ts` - Prepaid orders
- `src/types/customers.ts` - Customer schema (working as designed)
