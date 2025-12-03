# 📦 Packing Manifest - Example Output

## Sample CSV Format

Here's what your downloaded manifest will look like:

```csv
Order ID,Customer Name,Products (SKU x Quantity),Weight (gm)
5001,Rajesh Kumar,"ATT5 x2, RICE1 x1",10500
5002,Priya Sharma,"OIL2 x1",2000
5003,Amit Patel,"ATT5 x1, RICE1 x2, OIL2 x1",8500
5004,Sneha Reddy,"WHEAT10 x1",10000
5005,Vikram Singh,"ATT5 x3",15000
```

## When Opened in Excel/Google Sheets

| Order ID | Customer Name | Products (SKU x Quantity) | Weight (gm) |
|----------|---------------|---------------------------|-------------|
| 5001 | Rajesh Kumar | ATT5 x2, RICE1 x1 | 10500 |
| 5002 | Priya Sharma | OIL2 x1 | 2000 |
| 5003 | Amit Patel | ATT5 x1, RICE1 x2, OIL2 x1 | 8500 |
| 5004 | Sneha Reddy | WHEAT10 x1 | 10000 |
| 5005 | Vikram Singh | ATT5 x3 | 15000 |

## Understanding the Format

### Order ID
- Unique identifier for each order
- Use this to match with your order system
- Example: `5001`, `5002`, etc.

### Customer Name
- Full name of the customer
- Helps verify you're packing the right order
- Example: `Rajesh Kumar`, `Priya Sharma`

### Products (SKU x Quantity)
- **Format**: `SKU x Quantity`
- **Multiple products**: Separated by commas
- **Examples**:
  - Single product: `ATT5 x2` (2 units of ATT5)
  - Multiple products: `ATT5 x1, RICE1 x2, OIL2 x1`

### Weight (gm)
- Total package weight in grams
- **10500 gm** = 10.5 kg
- **2000 gm** = 2 kg
- Empty if weight not available (weigh manually)

## Real-World Example

Let's say you're packing Order 5003:

1. **Order ID**: 5003
2. **Customer**: Amit Patel
3. **Pack these items**:
   - ATT5 (Atta 5kg) → Pack 1 unit
   - RICE1 (Rice 1kg) → Pack 2 units
   - OIL2 (Oil 2L) → Pack 1 unit
4. **Expected weight**: 8500 grams (8.5 kg)

## Editing the Manifest

### Remove Orders Not Shipping
If Order 5004 won't ship via Delhivery:
1. Open CSV in Excel
2. Delete the entire row for Order 5004
3. Save the file
4. Use edited manifest for packing

### Add Notes (Optional)
You can add a "Notes" column if needed:

| Order ID | Customer Name | Products | Weight (gm) | Notes |
|----------|---------------|----------|-------------|-------|
| 5001 | Rajesh Kumar | ATT5 x2, RICE1 x1 | 10500 | Fragile |
| 5002 | Priya Sharma | OIL2 x1 | 2000 | Priority |

## Sorting Options

### By Weight (Heaviest First)
Useful for packing heavy items first:
1. Select all data
2. Sort by "Weight (gm)" column
3. Descending order

### By Customer Name (Alphabetical)
Useful for organized packing:
1. Select all data
2. Sort by "Customer Name" column
3. A to Z

### By Order ID (Default)
Orders are already sorted by pincode for efficient delivery grouping.

## Print-Friendly Format

For printing:
1. Open in Excel
2. Adjust column widths
3. Set to landscape orientation
4. Print with gridlines
5. Use as physical checklist

## Tips for Efficient Packing

### Group Similar Products
- All orders with ATT5 → Pack together
- All orders with RICE1 → Pack together
- Reduces time searching for products

### Verify Weight
- Weigh each packed order
- Compare with manifest weight
- If different by >10%, recheck items

### Mark as Packed
- Print manifest
- Check off each order as you pack
- Or add "✓" in Excel as you go

---

**File Location**: Downloads folder
**Filename Format**: `packing_manifest_25_orders_2024-12-03T10-30-00.csv`
**Opens With**: Excel, Google Sheets, Numbers, or any spreadsheet app
