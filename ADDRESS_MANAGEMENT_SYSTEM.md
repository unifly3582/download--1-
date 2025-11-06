# Address Management System

## Overview

The new address management system prevents automatic address duplication during order creation and provides explicit control over customer address books.

## Key Changes

### 1. Order Creation Behavior
- **Before**: Every order automatically added shipping address to `savedAddresses`
- **After**: Orders only update `defaultAddress`, do NOT auto-add to `savedAddresses`

### 2. Address Book Management
- Customers start with empty `savedAddresses` array
- Addresses must be explicitly added to address book
- Full CRUD operations for address management

## APIs

### Admin APIs (Authentication Required)

#### Get Customer Addresses
```
GET /api/customers/[phone]/addresses
```

Response:
```json
{
  "success": true,
  "data": {
    "defaultAddress": { ... },
    "savedAddresses": [...],
    "totalAddresses": 2
  }
}
```

#### Manage Customer Addresses
```
POST /api/customers/[phone]/addresses
```

**Add Address:**
```json
{
  "action": "add",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zip": "400001",
    "country": "India"
  },
  "setAsDefault": false
}
```

**Update Address:**
```json
{
  "action": "update",
  "oldAddress": { ... },
  "newAddress": { ... },
  "setAsDefault": false
}
```

**Remove Address:**
```json
{
  "action": "remove",
  "address": { ... }
}
```

**Set Default Address:**
```json
{
  "action": "setDefault",
  "address": { ... }
}
```

### Customer APIs (No Authentication)

#### Customer Address Management
```
POST /api/customer/addresses
```

**Get Addresses:**
```json
{
  "phone": "+919999999999",
  "action": "get"
}
```

**Add/Update/Remove/SetDefault:**
Same as admin API but includes `phone` field.

## Functions

### Core Functions in `customerUtils.ts`

1. **`addCustomerAddress(phone, address, setAsDefault)`**
   - Adds new address to savedAddresses
   - Prevents duplicates
   - Optionally sets as default

2. **`updateCustomerAddress(phone, oldAddress, newAddress, setAsDefault)`**
   - Updates existing address in savedAddresses
   - Prevents duplicates
   - Updates default if needed

3. **`removeCustomerAddress(phone, address)`**
   - Removes address from savedAddresses
   - Clears default if removed address was default

4. **`setDefaultAddress(phone, address)`**
   - Sets default address from existing savedAddresses

### Address Comparison

The `addressesEqual()` function now includes normalization:
- Case insensitive comparison
- Whitespace trimming
- Common abbreviation handling (Apartment → Apt, Street → St, etc.)

## Migration Impact

### Existing Customers
- Existing customers keep their current addresses
- Future orders will only update defaultAddress
- No automatic additions to savedAddresses

### New Customers
- Start with empty savedAddresses array
- defaultAddress set from first order
- Must explicitly add addresses to address book

## Usage Examples

### Frontend Integration

```javascript
// Get customer addresses
const addresses = await fetch(`/api/customer/addresses`, {
  method: 'POST',
  body: JSON.stringify({
    phone: customerPhone,
    action: 'get'
  })
});

// Add new address
const result = await fetch(`/api/customer/addresses`, {
  method: 'POST',
  body: JSON.stringify({
    phone: customerPhone,
    action: 'add',
    address: newAddress,
    setAsDefault: true
  })
});
```

### Order Creation
```javascript
// Order creation now only sets defaultAddress
// Does NOT automatically add to savedAddresses
const order = await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    customerInfo: { ... },
    shippingAddress: { ... }, // Only updates defaultAddress
    // ...
  })
});
```

## Benefits

1. **No Duplicate Addresses**: Prevents automatic address duplication
2. **User Control**: Users explicitly manage their address book
3. **Clean Data**: Addresses are normalized and deduplicated
4. **Flexible**: Supports multiple addresses when user wants them
5. **Backward Compatible**: Existing data remains intact

## Testing

Run the test script to verify the new behavior:
```bash
node test-address-fix.js
```

The test verifies:
- Orders don't auto-add addresses to savedAddresses
- Explicit address addition works
- Duplicate prevention works
- Address normalization works