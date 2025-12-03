# Address Saving Fix - WhatsApp OTP Customers

## Problem
After implementing WhatsApp OTP login, customer addresses were not being saved in their profile's address book (`savedAddresses`). The addresses were only saved as `defaultAddress` but not added to the `savedAddresses` array, making them invisible in the customer's address management interface.

## Root Cause
In `src/lib/oms/customerUtils.ts`, the `createOrUpdateCustomer` function had explicit logic to:
- For **new customers**: Set `defaultAddress` but leave `savedAddresses` empty
- For **existing customers**: Update `defaultAddress` but NOT add to `savedAddresses`

This was by design (see comment: "Do NOT automatically add to savedAddresses - that should be explicit user action"), but it created a poor user experience where customers couldn't see or manage their addresses.

## Affected Customers
All customers who placed orders after WhatsApp OTP implementation, including:
- +919999968191 (Rohit Verma)
- +919652132014 (Kdr naidu)
- +918847616279 (Satnam Singh)

## Solution

### 1. Code Fix
Updated `src/lib/oms/customerUtils.ts`:

**For New Customers:**
```typescript
// OLD: Start with empty address book
addressData = {
    defaultAddress: shippingAddress,
    savedAddresses: [] // Start with empty address book
};

// NEW: Add first address to address book
addressData = {
    defaultAddress: shippingAddress,
    savedAddresses: [shippingAddress] // Add first address to address book
};
```

**For Existing Customers:**
```typescript
// OLD: Only update defaultAddress
updateData.defaultAddress = normalizedAddress;

// NEW: Update defaultAddress AND add to savedAddresses if not exists
updateData.defaultAddress = normalizedAddress;

const savedAddresses = existingCustomer.savedAddresses || [];
const addressExists = savedAddresses.some(addr => addressesEqual(addr, normalizedAddress));

if (!addressExists) {
    updateData.savedAddresses = [...savedAddresses, normalizedAddress];
}
```

### 2. Data Migration Scripts

**Fix Specific Customers:**
```bash
node fix-missing-saved-addresses.js
```
This script fixes the three reported customers.

**Fix All Customers:**
```bash
node fix-all-customers-addresses.js
```
This script scans all customers and fixes any who have `defaultAddress` but it's missing from `savedAddresses`.

## Results

### Immediate Fix (3 customers)
✅ All three reported customers fixed:
- Rohit Verma: Address added to savedAddresses
- Kdr naidu: Address added to savedAddresses  
- Satnam Singh: Address added to savedAddresses

### Going Forward
- New customers will have their first address automatically added to their address book
- Existing customers will have new addresses automatically added when they place orders
- Addresses are still deduplicated (won't add duplicates)
- Customers can still manage their addresses via `/api/customer/addresses` endpoint

## Testing
To verify the fix works:
1. Place a new order with WhatsApp OTP login
2. Check customer profile via `/api/customer/addresses` with action: 'get'
3. Verify address appears in both `defaultAddress` and `savedAddresses`

## API Endpoints
- **Get addresses**: `POST /api/customer/addresses` with `{ phone, action: 'get' }`
- **Add address**: `POST /api/customer/addresses` with `{ phone, action: 'add', address }`
- **Update address**: `POST /api/customer/addresses` with `{ phone, action: 'update', oldAddress, newAddress }`
- **Remove address**: `POST /api/customer/addresses` with `{ phone, action: 'remove', address }`
- **Set default**: `POST /api/customer/addresses` with `{ phone, action: 'setDefault', address }`

## Files Modified
- `src/lib/oms/customerUtils.ts` - Updated address handling logic
- `fix-missing-saved-addresses.js` - Script to fix specific customers
- `fix-all-customers-addresses.js` - Script to fix all affected customers
