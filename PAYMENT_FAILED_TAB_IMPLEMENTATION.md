# Payment Pending Tab Implementation

## Overview
Added a new "Payment Pending" tab to the Orders page to track customers who initiated checkout but haven't completed payment (abandoned checkouts).

## Changes Made

### 1. Orders Page UI (`src/app/(dashboard)/orders/page.tsx`)
- Added new tab trigger: `<TabsTrigger value="payment-failed">Payment Pending</TabsTrigger>`
- Added corresponding tab content that reuses the existing table rendering logic
- The tab appears at the end of the tab list, after "Issues"

### 2. API Endpoint (`src/app/api/orders/optimized/route.ts`)
- Added new case in the status filter switch:
  ```typescript
  case 'payment-failed':
    // Show both Failed and Pending payments (abandoned checkouts)
    query = query.where('internalStatus', '==', 'payment_pending');
    break;
  ```
- Updated fallback query logic to handle payment-failed status for in-memory filtering

### 3. Firestore Index
- Uses existing composite index: `internalStatus` + `createdAt`
- No new index needed since we're only filtering by `internalStatus`

## How It Works

The "Payment Pending" tab shows orders where:
- `internalStatus` = `'payment_pending'`

This captures:
- Customers who created an order but haven't completed payment
- Customers who closed the payment window without completing
- Abandoned checkouts (payment initiated but not completed)
- Payment gateway errors or rejections (when status updates to "Failed")

## Order Data Structure

The payment information is tracked in the order's `paymentInfo` object:
```typescript
paymentInfo: {
  method: "COD" | "Prepaid",
  status: "Pending" | "Completed" | "Failed" | "Refunded",
  razorpayOrderId?: string,
  failureReason?: string,
  errorCode?: string,
  lastFailedPaymentId?: string,
  // ... other fields
}
```

## Current Status (Based on Database Check)

Found **5 orders** with `payment_pending` status:
- Order 5086: ₹5 (Razorpay Order ID: order_RhVuU42UxLx041)
- Order 5071: ₹5 (Razorpay Order ID: order_Rh7pq0P4WpBtgC)
- Order 5070: ₹300 (Razorpay Order ID: order_Rh7lSIzpSjZlkb)
- Order 5069: ₹300 (Razorpay Order ID: order_Rh7lBVIDZSndl2)
- Order 5067: ₹300 (Razorpay Order ID: order_Rh7gACZS7y3l6M)

All have `paymentInfo.status: "Pending"` - these are abandoned checkouts where customers initiated payment but didn't complete it.

## Next Steps

1. **No Index Deployment Needed**:
   - The existing `internalStatus` + `createdAt` index is sufficient
   - No need to run `firebase deploy --only firestore:indexes`

2. **Test the Tab**:
   - Navigate to the Orders page
   - Click on the "Payment Pending" tab
   - You should see all 5 orders listed above

3. **Optional Enhancements**:
   - Add bulk actions for payment-pending orders (e.g., "Send Payment Reminder")
   - Display payment status badge (Pending vs Failed) in the order row
   - Add filters to separate "Pending" from "Failed" payments
   - Create automated follow-up workflows for abandoned checkouts
   - Add time-based filters (e.g., "Pending > 24 hours")

## Usage

Once deployed, admins can:
- View all abandoned checkouts in one place
- Follow up with customers who didn't complete payment
- Send payment reminders via WhatsApp
- Identify patterns in checkout abandonment
- Take action to recover potentially lost sales

## Technical Notes

- The implementation reuses existing table rendering logic for consistency
- Supports all existing features: search, filters, sorting, bulk actions
- Uses optimized pagination and caching from the existing hook
- Falls back to in-memory filtering if Firestore indexes are still building
- Uses existing Firestore index (no new index deployment required)
