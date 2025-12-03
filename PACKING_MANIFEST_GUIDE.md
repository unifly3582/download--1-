# 📦 Packing Manifest Feature - Quick Guide

## Overview
The Packing Manifest feature allows you to download a CSV file with all orders in the "To Ship" tab, optimized for your packing team.

## How to Use

### 1. Navigate to Orders Page
- Go to **Orders** page in your dashboard
- Click on the **"To Ship"** tab

### 2. Download Manifest
You have two options:

**Option A: Download All Orders**
- Click the green **"Download Manifest"** button in the toolbar
- This downloads ALL orders currently visible in the "To Ship" tab

**Option B: Download Selected Orders**
- Select specific orders using the checkboxes
- Click the green **"Download Manifest"** button
- Only selected orders will be included

### 3. Open in Excel/Google Sheets
- The file will be named: `packing_manifest_25_orders_2024-12-03T10-30-00.csv`
- Open it in Excel, Google Sheets, or any spreadsheet software
- The file includes UTF-8 BOM for proper Excel compatibility

## Manifest Columns

| Column | Description | Example |
|--------|-------------|---------|
| **Order ID** | Unique order identifier | 5001 |
| **Customer Name** | Full name of customer | John Doe |
| **Products (SKU x Quantity)** | All products with SKU and quantities | "ATT5 x2, RICE1 x1" |
| **Weight (gm)** | Package weight in grams | 10000 |

## Key Features

### ✅ Smart Sorting
- Orders are automatically **sorted by pincode**
- This helps packers group orders by delivery area
- More efficient packing and shipping workflow

### ✅ Editable Format
- CSV format is easy to edit in Excel/Sheets
- **Remove orders** that won't ship via Delhivery
- **Add notes** in the Special Instructions column
- **Mark status** as Packed/Shipped/Hold in the last column

### ✅ Product Details
- Shows SKU code with quantity (e.g., "ATT5 x2")
- Multiple products shown in one cell, separated by commas
- Clean format for quick scanning

### ✅ Weight in Grams
- Weight shown in grams for accuracy
- Calculated from order weight or item weights
- Empty if weight not available (needs manual weighing)

## Workflow Example

1. **Morning**: Download manifest for all "To Ship" orders
2. **Review**: Open in Excel, remove any orders on hold
3. **Print**: Print the manifest for your packing team
4. **Pack**: Packers check off each order as they pack
5. **Update**: Mark status column (Packed/Shipped/Hold)
6. **Ship**: Use the manifest to create shipments in Delhivery

## Tips for Packers

### Before Packing
- [ ] Check Order ID matches the order
- [ ] Verify customer name
- [ ] Confirm all SKUs are in stock
- [ ] Check weight column for reference

### During Packing
- [ ] Pack items according to SKU list
- [ ] Verify quantities match (x2, x1, etc.)
- [ ] Include invoice/packing slip
- [ ] Seal package securely

### After Packing
- [ ] Weigh the package if weight is empty
- [ ] Cross-check weight with manifest
- [ ] Mark order as packed in system
- [ ] Ready for courier pickup

## Troubleshooting

### No orders in manifest?
- Make sure you're on the "To Ship" tab
- Check if filters are applied (clear them if needed)
- Ensure there are approved orders ready to ship

### Products showing "N/A"?
- This means the order has no items (rare)
- Check the order details in the system
- Contact admin if this happens

### Weight column is empty?
- Weight not entered during order creation
- You'll need to weigh the package manually
- Update in the system before shipping

### SKU codes unclear?
- Each SKU represents a specific product
- Check your product catalog for SKU reference
- Format is always: SKU x Quantity (e.g., "ATT5 x2")

## Advanced Usage

### Filter Before Download
You can apply filters before downloading:
- **Payment Filter**: Download only COD or Prepaid orders
- **Source Filter**: Download only Quick Ship orders
- **Search**: Search by customer name/phone, then download results

### Batch Processing
1. Download manifest in the morning
2. Sort by pincode in Excel
3. Group orders by delivery area
4. Pack area by area for efficiency
5. Create shipments in batches

### Record Keeping
- Keep downloaded manifests as records
- Filename includes date and time
- Easy to track which orders were packed when
- Useful for auditing and reconciliation

## Integration with Shipping

After packing:
1. Go back to "To Ship" tab
2. Select packed orders
3. Click **"Bulk Ship"** to create shipments
4. Or ship individually via dropdown menu

The manifest helps you verify everything is packed before creating shipments in Delhivery.

---

**Need Help?** Contact your system administrator or check the Orders page for more options.
