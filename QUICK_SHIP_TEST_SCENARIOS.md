# Quick Ship - Test Scenarios

## Test Plan for Quick Ship Feature

### Test Environment Setup
- [ ] Admin user logged in
- [ ] Delhivery integration configured
- [ ] WhatsApp notifications enabled
- [ ] Test customer phone number available

---

## 1. Basic Quick Ship Order Creation

### Test Case 1.1: Create COD Quick Ship Order
**Steps:**
1. Navigate to Orders page
2. Click "Create Order"
3. Enable "Quick Ship Mode" checkbox
4. Enter customer phone: `9999999999`
5. Search customer (or create new)
6. Fill shipping address
7. Click Next
8. Enter custom product:
   - Name: "Test Custom Product"
   - Quantity: 1
   - Price: 500
   - Weight: 10
   - Dimensions: 30 x 20 x 15
   - HSN: 310100
9. Click "Add Custom Product"
10. Click Next
11. Select Payment: COD
12. Submit order

**Expected Result:**
- ✅ Order created successfully
- ✅ Order ID generated (e.g., 5100)
- ✅ Order status: "Approved"
- ✅ Payment status: "Pending"
- ✅ Order source: "admin_quick_ship"
- ✅ Success toast shown

### Test Case 1.2: Create Prepaid Quick Ship Order
**Steps:**
1-10. Same as Test Case 1.1
11. Select Payment: Prepaid
12. Submit order

**Expected Result:**
- ✅ Order created successfully
- ✅ Order status: "Approved"
- ✅ Payment status: "Completed"
- ✅ Ready to ship immediately

---

## 2. UI Validation Tests

### Test Case 2.1: Quick Ship Toggle Behavior
**Steps:**
1. Open Create Order dialog
2. Check "Quick Ship Mode"
3. Verify form changes to custom entry
4. Uncheck "Quick Ship Mode"
5. Verify form returns to product search

**Expected Result:**
- ✅ Form switches correctly
- ✅ Items list clears when switching modes
- ✅ No errors in console

### Test Case 2.2: Required Field Validation
**Steps:**
1. Enable Quick Ship Mode
2. Try to add product with empty fields
3. Fill only product name
4. Try to add product
5. Fill all required fields
6. Add product successfully

**Expected Result:**
- ✅ Error toast for missing fields
- ✅ Cannot add incomplete product
- ✅ Success when all fields filled

### Test Case 2.3: Numeric Field Validation
**Steps:**
1. Enter negative weight: -10
2. Try to add product
3. Enter zero dimensions: 0 x 0 x 0
4. Try to add product
5. Enter valid positive numbers
6. Add product successfully

**Expected Result:**
- ✅ Validation prevents negative/zero values
- ✅ Clear error messages shown

---

## 3. Order Display Tests

### Test Case 3.1: Quick Ship Badge Display
**Steps:**
1. Create a Quick Ship order
2. Navigate to Orders list
3. Locate the created order

**Expected Result:**
- ✅ Order shows "⚡ Quick Ship" badge
- ✅ Badge has amber/yellow background
- ✅ Badge is clearly visible

### Test Case 3.2: Source Filter
**Steps:**
1. Click Source filter dropdown
2. Select "⚡ Quick Ship"
3. Verify filtered results
4. Select "All"
5. Verify all orders shown

**Expected Result:**
- ✅ Filter shows only Quick Ship orders
- ✅ Filter count is accurate
- ✅ "All" shows all orders again

### Test Case 3.3: Order Details View
**Steps:**
1. Click on Quick Ship order
2. View order details dialog

**Expected Result:**
- ✅ Shows custom product name
- ✅ Shows custom SKU (CUSTOM-xxxxx)
- ✅ Shows weight and dimensions
- ✅ Shows HSN code
- ✅ Status shows "Approved"

---

## 4. Shipping Integration Tests

### Test Case 4.1: Ship Quick Ship Order via Delhivery
**Steps:**
1. Create Quick Ship order (approved)
2. Click "Ship" action
3. Select "Delhivery"
4. Confirm shipment

**Expected Result:**
- ✅ Shipment created successfully
- ✅ AWB number generated
- ✅ Tracking URL available
- ✅ Order status: "Shipped"
- ✅ No errors about missing product

### Test Case 4.2: Manual Shipment
**Steps:**
1. Create Quick Ship order
2. Click "Ship" action
3. Select "Manual"
4. Enter AWB: TEST123456
5. Confirm shipment

**Expected Result:**
- ✅ Manual shipment created
- ✅ AWB saved correctly
- ✅ Order status: "Shipped"

---

## 5. Tracking & Notifications Tests

### Test Case 5.1: WhatsApp Order Placed Notification
**Steps:**
1. Create Quick Ship order
2. Check WhatsApp for notification

**Expected Result:**
- ✅ Order placed notification sent
- ✅ Contains order ID
- ✅ Contains custom product name
- ✅ Contains total amount

### Test Case 5.2: WhatsApp Shipped Notification
**Steps:**
1. Ship Quick Ship order
2. Check WhatsApp for notification

**Expected Result:**
- ✅ Shipped notification sent
- ✅ Contains tracking link
- ✅ Contains AWB number

### Test Case 5.3: Tracking Sync
**Steps:**
1. Ship Quick Ship order via Delhivery
2. Wait for tracking sync (or trigger manually)
3. Check order tracking status

**Expected Result:**
- ✅ Tracking status updates
- ✅ No errors in sync process
- ✅ Tracking location shown

---

## 6. Edge Cases & Error Handling

### Test Case 6.1: Very Large Dimensions
**Steps:**
1. Enter dimensions: 200 x 150 x 100 cm
2. Weight: 100 kg
3. Create and ship order

**Expected Result:**
- ✅ Order created successfully
- ✅ Delhivery accepts dimensions
- ✅ No validation errors

### Test Case 6.2: Special Characters in Product Name
**Steps:**
1. Product name: "Custom Mix (50kg) - Special Edition"
2. Create order

**Expected Result:**
- ✅ Name saved correctly
- ✅ No encoding issues
- ✅ Displays properly in list

### Test Case 6.3: Multiple Quick Ship Orders
**Steps:**
1. Create 5 Quick Ship orders in succession
2. Verify all appear in list
3. Filter by Quick Ship

**Expected Result:**
- ✅ All orders created successfully
- ✅ Unique SKUs generated
- ✅ All show in filter

### Test Case 6.4: Switch Between Modes Mid-Creation
**Steps:**
1. Start creating normal order
2. Add regular product
3. Enable Quick Ship Mode
4. Verify items cleared
5. Add custom product
6. Disable Quick Ship Mode
7. Verify items cleared again

**Expected Result:**
- ✅ Items clear when switching modes
- ✅ No data corruption
- ✅ Can complete order in either mode

---

## 7. Performance Tests

### Test Case 7.1: Quick Ship Order Creation Speed
**Steps:**
1. Time order creation from start to finish
2. Compare with regular order creation

**Expected Result:**
- ✅ Quick Ship faster than regular (no product lookup)
- ✅ Order created in < 5 seconds
- ✅ No lag in UI

### Test Case 7.2: Large Orders List with Quick Ship
**Steps:**
1. Create 50+ orders (mix of regular and Quick Ship)
2. Navigate orders list
3. Apply Quick Ship filter

**Expected Result:**
- ✅ List loads quickly
- ✅ Filter applies instantly
- ✅ No performance degradation

---

## 8. Data Integrity Tests

### Test Case 8.1: Order Data Structure
**Steps:**
1. Create Quick Ship order
2. Check Firestore document

**Expected Result:**
```json
{
  "orderId": "5100",
  "orderSource": "admin_quick_ship",
  "items": [{
    "productId": "CUSTOM_PRODUCT",
    "productName": "Test Custom Product",
    "sku": "CUSTOM-1700000000000",
    "isQuickShipItem": true,
    "weight": 10,
    "dimensions": { "l": 30, "b": 20, "h": 15 }
  }],
  "internalStatus": "approved",
  "approval": { "status": "approved" }
}
```

### Test Case 8.2: Customer Order History
**Steps:**
1. Create Quick Ship order for customer
2. Check customer's order history
3. Verify order appears

**Expected Result:**
- ✅ Order in customer history
- ✅ Shows custom product name
- ✅ Tracking works normally

---

## 9. Regression Tests

### Test Case 9.1: Regular Orders Still Work
**Steps:**
1. Create regular order (Quick Ship OFF)
2. Add products from catalog
3. Complete order

**Expected Result:**
- ✅ Regular order flow unchanged
- ✅ Product search works
- ✅ Approval workflow normal

### Test Case 9.2: Existing Orders Unaffected
**Steps:**
1. View existing orders created before Quick Ship
2. Ship existing orders
3. Track existing orders

**Expected Result:**
- ✅ All existing orders work normally
- ✅ No data corruption
- ✅ Backward compatible

---

## 10. User Acceptance Tests

### Test Case 10.1: Admin User Workflow
**Scenario:** Admin needs to ship a custom sample pack

**Steps:**
1. Admin receives request for sample shipment
2. Opens Create Order
3. Enables Quick Ship Mode
4. Enters "Sample Pack - 5 Products"
5. Sets price to ₹0 (free sample)
6. Enters actual weight and dimensions
7. Completes order
8. Ships immediately

**Expected Result:**
- ✅ Workflow is intuitive
- ✅ Takes < 3 minutes
- ✅ No confusion about fields
- ✅ Order ships successfully

### Test Case 10.2: Bulk Custom Order
**Scenario:** Customer orders 100kg custom mix

**Steps:**
1. Enable Quick Ship Mode
2. Product: "Custom Mix 100kg"
3. Quantity: 1
4. Price: ₹5000
5. Weight: 100 kg
6. Dimensions: 80 x 50 x 40 cm
7. Complete and ship

**Expected Result:**
- ✅ Large weight handled correctly
- ✅ Delhivery accepts shipment
- ✅ Tracking works

---

## Test Results Template

| Test Case | Status | Notes | Tester | Date |
|-----------|--------|-------|--------|------|
| 1.1 | ⬜ Pass / ❌ Fail | | | |
| 1.2 | ⬜ Pass / ❌ Fail | | | |
| 2.1 | ⬜ Pass / ❌ Fail | | | |
| ... | | | | |

---

## Critical Path Tests (Must Pass)

Priority tests that must pass before deployment:

1. ✅ Test Case 1.1 - Create COD Quick Ship Order
2. ✅ Test Case 1.2 - Create Prepaid Quick Ship Order
3. ✅ Test Case 2.2 - Required Field Validation
4. ✅ Test Case 3.1 - Quick Ship Badge Display
5. ✅ Test Case 4.1 - Ship via Delhivery
6. ✅ Test Case 5.1 - WhatsApp Notifications
7. ✅ Test Case 9.1 - Regular Orders Still Work

---

## Bug Report Template

```
**Bug ID**: QS-001
**Test Case**: 1.1
**Severity**: High / Medium / Low
**Description**: [What went wrong]
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Screenshots**: [If applicable]
**Environment**: Production / Staging
**Tester**: [Name]
**Date**: [Date]
```

---

**Testing Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete
**Last Updated**: November 19, 2025
