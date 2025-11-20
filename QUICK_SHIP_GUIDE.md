# Quick Ship Feature Guide

## Overview
The Quick Ship feature allows you to create and ship orders for products that are not in your product catalog. This is useful for:
- One-time custom shipments
- Sample products
- Special orders with custom packaging
- Products not yet added to the system

## How to Use Quick Ship

### Step 1: Open Create Order Dialog
1. Go to the Orders page in your admin panel
2. Click the "Create Order" button

### Step 2: Enable Quick Ship Mode
1. At the top of the dialog, check the **"Quick Ship Mode"** checkbox
2. The form will switch to custom product entry mode

### Step 3: Enter Customer Details (Step 1)
- Enter customer phone number and search (or create new customer)
- Fill in shipping address as usual

### Step 4: Add Custom Product (Step 2)
Instead of searching for products, you'll see a custom product form:

**Required Fields:**
- **Product Name**: e.g., "Custom Fertilizer Bag"
- **Quantity**: Number of units
- **Unit Price (₹)**: Price per unit
- **Weight (grams)**: Total weight per unit (e.g., 25000 grams for 25kg)
- **Dimensions (cm)**: Length x Breadth x Height (e.g., 50 x 30 x 20)

**Optional Fields:**
- **HSN Code**: Tax classification code (defaults to 000000)

Click "Add Custom Product" to add the item to the order.

### Step 5: Complete Order Details (Step 3)
- Select payment method (COD/Prepaid)
- Review pricing
- Submit the order

## Key Features

### Auto-Approval
Quick Ship orders are **automatically approved** and ready to ship immediately. No manual approval needed.

### Auto-Shipping (Optional)
You can configure Quick Ship orders to automatically create shipments with Delhivery after order creation.

### Visual Indicators
- Quick Ship orders show a **⚡ Quick Ship** badge in the orders list
- Badge has an amber/yellow background for easy identification
- Filter orders by "Quick Ship" in the source filter dropdown

### Order Tracking
Quick Ship orders are tracked just like regular orders:
- Delhivery tracking sync works normally
- WhatsApp notifications are sent
- Customer can track their order
- All order history is maintained

## Technical Details

### Order Source
Quick Ship orders have `orderSource: "admin_quick_ship"`

### Product ID
Custom products use `productId: "CUSTOM_PRODUCT"` with a unique SKU like `CUSTOM-1234567890`

### Weight & Dimensions
- Weight and dimensions are taken directly from your input
- No product catalog lookup required
- No manual verification needed

### Validation
The system validates that all required fields are filled:
- Product name must not be empty
- Price, weight, and all dimensions must be greater than 0
- Customer and shipping details follow normal validation

## Filtering Quick Ship Orders

To view only Quick Ship orders:
1. Go to the Orders page
2. Click the "Source" filter dropdown
3. Select "⚡ Quick Ship"

## Use Cases

### Example 1: Custom Packaging
Customer wants 5kg of Product A in a special 10kg bag:
- Product Name: "5kg Product A in 10kg Bag"
- Weight: 5 kg
- Dimensions: Custom bag size
- Price: Custom pricing

### Example 2: Sample Shipment
Sending product samples to a potential customer:
- Product Name: "Product Sample Pack"
- Weight: 2 kg
- Dimensions: Sample box size
- Price: 0 (or nominal charge)

### Example 3: Bulk Custom Order
Customer orders a custom quantity not in your catalog:
- Product Name: "Bulk Order - 50kg Custom Mix"
- Weight: 50 kg
- Dimensions: Large bag dimensions
- Price: Negotiated price

## Best Practices

1. **Use Descriptive Names**: Make product names clear for future reference
2. **Accurate Dimensions**: Ensure dimensions are correct for Delhivery
3. **Proper HSN Codes**: Use correct HSN codes for tax compliance
4. **Document Special Cases**: Add notes in the order if needed

## Limitations

- Quick Ship items don't update inventory (no stock tracking)
- No product history or analytics for custom items
- Cannot reorder the exact same custom product easily
- Custom items don't appear in product reports

## Future Enhancements

Potential improvements:
- Save frequently used custom products as templates
- Auto-ship immediately after order creation
- Bulk Quick Ship for multiple custom items
- Custom product library for common ad-hoc items

---

**Need Help?** Contact your system administrator or refer to the main order management documentation.
