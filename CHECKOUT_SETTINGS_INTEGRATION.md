# Checkout Settings Integration - Complete

## Summary
Successfully integrated the checkout settings system to **auto-fill** COD charges and prepaid discounts in order forms based on admin-configured values. The settings are used for form pre-filling only, not automatic application.

## Changes Made

### 1. New Utility Module: `src/lib/oms/checkoutSettings.ts`
- Created centralized module for fetching and calculating checkout settings
- Implements 1-minute caching to reduce Firestore reads
- Functions:
  - `getCheckoutSettings()` - Fetches settings with caching
  - `calculateCodCharges()` - Calculates COD charges (fixed or percentage)
  - `calculatePrepaidDiscount()` - Calculates prepaid discount (fixed or percentage)

### 2. Updated Order Type: `src/types/order.ts`
- Added `prepaidDiscount` field to `PricingInfoSchema`
- Added optional `pricingInfo` to `CustomerCreateOrderSchema` (for frontend-calculated values)
- Now tracks both COD charges and prepaid discounts separately

### 3. Customer Order Creation: `src/app/api/customer/orders/create/route.ts`
- Accepts pricing info from customer app (calculated on frontend)
- Falls back to default calculations if not provided
- Updated grand total formula: `subtotal - discount - prepaidDiscount + taxes + shippingCharges + codCharges`

### 4. Public API Endpoint: `src/app/api/customer/checkout-settings/route.ts`
- New public endpoint for customer app to fetch checkout settings
- No authentication required
- Returns settings for form pre-filling

### 5. Admin Order Dialog: `src/app/(dashboard)/orders/create-order-dialog.tsx`
- Fetches checkout settings on dialog open
- Auto-fills COD charges and prepaid discount fields with configured values
- Added prepaid discount input field (shows when payment method is Prepaid)
- Shows prepaid discount in order summary (in green with minus sign)
- Admin can override the auto-filled values

### 6. Documentation: `CUSTOMER_FACING_API_GUIDE.md`
- Updated pricing calculation documentation
- Added prepaid discount to example calculations

## How It Works

### For Customer App (Frontend)
1. Customer app fetches settings from `GET /api/customer/checkout-settings`
2. When customer selects payment method, app calculates charges/discounts using settings
3. Calculated values are pre-filled in the checkout form
4. Customer can see the charges before placing order
5. Final values are sent to backend in order creation request

### For Admin Dashboard
1. Admin opens order creation dialog
2. Dialog fetches checkout settings automatically
3. COD charges and prepaid discount fields are auto-filled with configured values
4. Admin can override these values if needed
5. Values are used in order creation

### Settings Configuration
- Admin configures in `/settings/checkout`
- COD charges: Fixed amount (e.g., ₹25) or percentage (e.g., 2%)
- Prepaid discount: Fixed amount (e.g., ₹50) or percentage (e.g., 5%)

## API Endpoints

### GET /api/customer/checkout-settings (Public)
Returns checkout settings for form pre-filling
```json
{
  "success": true,
  "data": {
    "codCharges": { "type": "fixed", "value": 25 },
    "prepaidDiscount": { "type": "fixed", "value": 0 }
  }
}
```

### GET /api/settings/checkout (Admin Only)
Same as above but requires admin authentication

### POST /api/settings/checkout (Admin Only)
Updates checkout settings

## Settings Storage
- Location: Firestore `settings/checkout` document
- Structure:
```json
{
  "codCharges": {
    "type": "fixed" | "percentage",
    "value": number
  },
  "prepaidDiscount": {
    "type": "fixed" | "percentage",
    "value": number
  }
}
```

## Default Values
- COD Charges: Fixed ₹25 (maintains backward compatibility)
- Prepaid Discount: Fixed ₹0 (no discount by default)

## Benefits
- Flexible pricing without code changes
- Transparent pricing - customers see charges before ordering
- Admin control over COD costs and prepaid incentives
- Can override auto-filled values when needed
- Cached for performance (1-minute TTL)
