# Quick Ship - Dimension Unit Converter

## Feature Overview
The Quick Ship form now includes a built-in dimension unit converter that allows you to enter dimensions in **inches** and automatically converts them to **centimeters** for Delhivery.

## How to Use

### Step 1: Select Unit
At the top of the Dimensions section, you'll see two buttons:
- **cm** (default)
- **inch**

Click the unit you want to use.

### Step 2: Enter Dimensions
Enter your dimensions in the selected unit:

**Example in Inches:**
```
Unit: [inch] selected
Length: 20 (inches)
Breadth: 12 (inches)
Height: 8 (inches)
```

**Example in Centimeters:**
```
Unit: [cm] selected
Length: 50 (cm)
Breadth: 30 (cm)
Height: 20 (cm)
```

### Step 3: Automatic Conversion
When you click "Add Custom Product":
- If **cm** is selected: Values are used as-is
- If **inch** is selected: Values are automatically converted to cm

**Conversion Formula:** `cm = inches × 2.54`

## Visual Guide

```
┌─────────────────────────────────────────────┐
│ Dimensions *              [cm] [inch]       │
├─────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│ │ Length   │  │ Breadth  │  │ Height   │  │
│ │   20     │  │   12     │  │    8     │  │
│ └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│ ℹ️ Values will be automatically converted   │
│   to cm (1 inch = 2.54 cm)                 │
└─────────────────────────────────────────────┘
```

## Conversion Examples

| Inches | Centimeters | Notes |
|--------|-------------|-------|
| 1"     | 2.5 cm      | Rounded to 1 decimal |
| 5"     | 12.7 cm     | |
| 10"    | 25.4 cm     | |
| 12"    | 30.5 cm     | 1 foot |
| 20"    | 50.8 cm     | |
| 24"    | 61.0 cm     | 2 feet |
| 36"    | 91.4 cm     | 3 feet |
| 48"    | 121.9 cm    | 4 feet |

## Real-World Examples

### Example 1: Small Box (Inches)
**Input:**
- Unit: **inch**
- Dimensions: 10 × 8 × 6 inches

**Converted to:**
- 25.4 × 20.3 × 15.2 cm

**Sent to Delhivery:**
```json
{
  "shipment_length": "25.4",
  "shipment_width": "20.3",
  "shipment_height": "15.2"
}
```

### Example 2: Medium Box (Inches)
**Input:**
- Unit: **inch**
- Dimensions: 20 × 15 × 10 inches

**Converted to:**
- 50.8 × 38.1 × 25.4 cm

### Example 3: Large Box (Centimeters)
**Input:**
- Unit: **cm**
- Dimensions: 80 × 50 × 40 cm

**No conversion needed:**
- 80 × 50 × 40 cm (used as-is)

## Common Package Sizes

### Standard Courier Boxes (in inches → cm)

| Box Size | Inches (L×W×H) | Centimeters (L×W×H) |
|----------|----------------|---------------------|
| Small    | 12 × 9 × 6     | 30.5 × 22.9 × 15.2 |
| Medium   | 18 × 12 × 10   | 45.7 × 30.5 × 25.4 |
| Large    | 24 × 18 × 12   | 61.0 × 45.7 × 30.5 |
| X-Large  | 30 × 20 × 15   | 76.2 × 50.8 × 38.1 |

## Features

### ✅ Automatic Conversion
- No manual calculation needed
- Instant conversion when adding product
- Rounded to 1 decimal place for accuracy

### ✅ Visual Feedback
- Active unit button highlighted in blue
- Helper text shows conversion will happen
- Success toast shows converted dimensions

### ✅ Flexible Input
- Switch between units anytime
- Decimal values supported (e.g., 10.5 inches)
- Clear placeholders for each unit

## Success Toast Messages

**When using cm:**
```
✅ Success
Custom product added
```

**When using inches:**
```
✅ Success
Dimensions converted to 50.8×30.5×25.4 cm
```

## Tips

1. **Use inches when**: You have product specs in inches (common for imported products)
2. **Use cm when**: You have metric measurements (standard in India)
3. **Decimal precision**: Converter rounds to 1 decimal place (e.g., 10.5" → 26.7 cm)
4. **Verification**: Check the success toast to see converted values

## Technical Details

### Conversion Logic
```typescript
if (dimensionUnit === 'inch') {
  length = Math.round(length * 2.54 * 10) / 10;
  breadth = Math.round(breadth * 2.54 * 10) / 10;
  height = Math.round(height * 2.54 * 10) / 10;
}
```

### Storage
All dimensions are stored in **centimeters** in the database, regardless of input unit.

### Delhivery API
Delhivery always receives dimensions in **centimeters**.

## Troubleshooting

### Issue: Wrong unit selected
**Solution**: Click the correct unit button before entering values

### Issue: Need to change unit after entering
**Solution**: Click the other unit button, values will be re-interpreted

### Issue: Decimal values not working
**Solution**: Use dot (.) not comma (,) for decimals (e.g., 10.5 not 10,5)

## Quick Reference Card

```
┌─────────────────────────────────────────┐
│ DIMENSION CONVERTER QUICK GUIDE         │
├─────────────────────────────────────────┤
│                                         │
│ 1 inch = 2.54 cm                       │
│                                         │
│ Common Conversions:                     │
│ • 6"  = 15.2 cm                        │
│ • 12" = 30.5 cm (1 foot)               │
│ • 24" = 61.0 cm (2 feet)               │
│ • 36" = 91.4 cm (3 feet)               │
│                                         │
│ How to Use:                             │
│ 1. Click [cm] or [inch] button         │
│ 2. Enter dimensions                     │
│ 3. Click "Add Custom Product"          │
│ 4. Conversion happens automatically     │
│                                         │
└─────────────────────────────────────────┘
```

---

**Status**: ✅ Implemented and ready to use
**Conversion**: Automatic (1 inch = 2.54 cm)
**Precision**: Rounded to 1 decimal place
