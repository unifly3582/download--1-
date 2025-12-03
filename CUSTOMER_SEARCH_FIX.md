# Customer Search Fix - Create Order Dialog

## Problem
When trying to search for an existing customer by phone number in the "Create Order" dialog, the system was not returning customer data (name, address, etc.), even though the customer existed in the database.

## Root Cause
The `getCustomerByPhone()` function in `customerUtils.ts` was failing validation due to:

1. **Undefined timestamp fields**: When fetching customer data from Firestore, timestamp fields (`createdAt`, `updatedAt`, etc.) were being set to `undefined` if they didn't exist in the database
2. **Schema validation failure**: The Zod schema doesn't handle `undefined` values well for optional fields - it expects them to either exist or not be present at all
3. **Silent failure**: When validation failed, the function would log an error but continue execution, eventually returning `null` and causing a "Customer not found" error

## Solution
Modified `src/lib/oms/customerUtils.ts` in the `getCustomerByPhone()` function:

### Changes Made:
1. **Conditional timestamp handling**: Only add timestamp fields to the validation object if they actually exist in the database
2. **Proper null handling**: Return `null` explicitly when validation fails so the function can try the legacy lookup method
3. **Better logging**: Added more detailed logging to help debug customer lookup issues

### Code Changes:
```typescript
// Before (problematic):
const dataForValidation = {
    ...data,
    customerId: data.customerId || doc.id,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : undefined, // ❌ undefined causes issues
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined,
};

// After (fixed):
const dataForValidation: any = {
    ...data,
    customerId: data.customerId || doc.id,
};

// Only add timestamp fields if they exist (avoid undefined)
if (data.createdAt) {
    dataForValidation.createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
}
if (data.updatedAt) {
    dataForValidation.updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt;
}
// ... same for other timestamp fields
```

## How It Works Now

1. User enters phone number in Create Order dialog
2. System calls `/api/customers/+919876543210`
3. API calls `getCustomerByPhone(phone)`
4. Function queries Firestore: `where('phone', '==', '+919876543210').orderBy('createdAt', 'desc')`
5. If found, converts Firestore data to plain object
6. **NEW**: Only includes timestamp fields that actually exist
7. Validates against CustomerSchema
8. Returns customer data with name, address, etc.
9. Dialog auto-fills customer information

## Testing
To test the fix:
1. Go to Orders page
2. Click "Create Order"
3. Enter a phone number of an existing customer (e.g., 9876543210)
4. Click search icon
5. Customer name and address should now populate automatically

## Files Modified
- `src/lib/oms/customerUtils.ts` - Fixed `getCustomerByPhone()` function
- `src/app/api/customers/[phone]/route.ts` - Added better logging

## Related Issues
- Customer search in admin panel
- Customer profile lookup
- Order creation for existing customers
- Address auto-fill functionality
