# Quick Ship Weight Unit Fix

## Issue
The Quick Ship form was asking for weight in **kilograms (kg)**, but the system stores and sends weight to Delhivery in **grams**.

## Root Cause
Your product system stores weight in grams:
```typescript
// From src/types/products.ts
export type ProductVariation = {
  weight: number; // in grams
  // ...
};
```

But the Quick Ship form label said "Weight (kg)" which was misleading.

## Fix Applied ✅

### 1. Updated Form Label
**Before:**
```tsx
<Label>Weight (kg) *</Label>
<Input 
  type="number" 
  step="0.1"
  placeholder="25"
  id="quickShipWeight"
/>
```

**After:**
```tsx
<Label>Weight (grams) *</Label>
<Input 
  type="number" 
  step="1"
  placeholder="25000"
  id="quickShipWeight"
/>
```

### 2. Updated Documentation
All documentation files updated to reflect grams:
- `QUICK_SHIP_GUIDE.md`
- `QUICK_SHIP_QUICK_REFERENCE.md`
- `QUICK_SHIP_READY.md`
- `QUICK_SHIP_FIXES.md`

## Weight Flow Confirmation

### User Input
```
Weight: 25000 grams (25 kg)
```

### Stored in Item
```typescript
{
  productId: 'CUSTOM_PRODUCT',
  weight: 25000,  // grams
  // ...
}
```

### Stored in Order
```typescript
{
  orderId: "5100",
  weight: 25000,  // grams
  // ...
}
```

### Sent to Delhivery
```json
{
  "shipments": [{
    "weight": "25000",  // grams - exactly as entered
    // ...
  }]
}
```

## Examples

### Small Product (2 kg)
- **Enter**: 2000 grams
- **Delhivery receives**: "2000"

### Medium Product (25 kg)
- **Enter**: 25000 grams
- **Delhivery receives**: "25000"

### Large Product (100 kg)
- **Enter**: 100000 grams
- **Delhivery receives**: "100000"

## Quick Reference

| Kilograms | Grams (Enter This) |
|-----------|-------------------|
| 0.5 kg    | 500 grams        |
| 1 kg      | 1000 grams       |
| 2 kg      | 2000 grams       |
| 5 kg      | 5000 grams       |
| 10 kg     | 10000 grams      |
| 25 kg     | 25000 grams      |
| 50 kg     | 50000 grams      |
| 100 kg    | 100000 grams     |

## Testing

### Test Case: Verify Weight in Grams

**Steps**:
1. Enable Quick Ship Mode
2. Enter weight: `10000` (for 10 kg)
3. Complete order
4. Check Firestore document
5. Ship order
6. Check Delhivery API logs

**Expected**:
- ✅ Order document shows: `weight: 10000`
- ✅ Delhivery receives: `"weight": "10000"`
- ✅ Shipment created successfully

## Important Notes

1. **Always enter weight in grams** - not kilograms
2. **No conversion needed** - value is sent as-is to Delhivery
3. **Delhivery expects grams** - this is the correct unit
4. **Placeholder shows example** - 25000 grams = 25 kg

## Summary

✅ **Fixed**: Form now correctly asks for weight in grams
✅ **Consistent**: Matches your product system (grams)
✅ **Correct**: Delhivery receives weight in grams
✅ **Clear**: Placeholder shows example (25000 for 25kg)

---

**Status**: Fixed and ready for testing
**Date**: November 19, 2025
