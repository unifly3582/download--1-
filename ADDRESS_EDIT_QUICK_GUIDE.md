# Quick Guide: Edit Order Addresses

## 🎯 What Changed?

### Before
```
Address Column:
Mumbai, Maharashtra
PIN: 400001
```

### After
```
Address Column:
123 Main Street, Near Central Park, Apartment 5B
Mumbai, Maharashtra
PIN: 400001
✏️ Edit Address [Button]
```

## 🚀 How to Edit an Address

### Method 1: Direct Button
1. Find the order in any tab
2. Look at the "Address & Pincode" column
3. Click the **"✏️ Edit Address"** button
4. Update the fields
5. Click **"Save Address"**

### Method 2: Dropdown Menu
1. Click the **⋮** (three dots) on any order row
2. Select **"✏️ Edit Address"**
3. Update the fields
4. Click **"Save Address"**

## 📝 Edit Dialog Fields

```
┌─────────────────────────────────────────┐
│  Edit Shipping Address                  │
├─────────────────────────────────────────┤
│                                         │
│  Street Address *                       │
│  [123 Main St, Near Park, Apt 5B]      │
│                                         │
│  City *              State *            │
│  [Mumbai]            [Maharashtra]      │
│                                         │
│  Pincode *           Country *          │
│  [400001]            [India]            │
│                                         │
│  📍 Address Preview:                    │
│  123 Main St, Near Park, Apt 5B        │
│  Mumbai, Maharashtra - 400001           │
│  India                                  │
│                                         │
│         [Cancel]  [Save Address]        │
└─────────────────────────────────────────┘
```

## ✅ When to Use

### ✓ Good Use Cases
- Customer calls with complete address
- Address is incomplete or unclear
- Wrong pincode entered
- Need to add landmark for delivery
- Verifying address before shipping

### ✗ Cannot Edit When
- Order is already shipped
- Order is in transit
- Order is delivered
- Order is cancelled

## 💡 Pro Tips

1. **Call First**: Always call the customer to verify before editing
2. **Add Landmarks**: Include nearby landmarks for easier delivery
3. **Check Pincode**: Verify pincode matches the city/state
4. **Complete Address**: Include house/flat number, street name, area
5. **Action Log**: Your changes are automatically logged

## 🔍 What Gets Logged

Every address change creates an action log entry:
- Who made the change
- When it was changed
- Old address
- New address
- Reason (if provided)

## 📊 Example Workflow

```
1. Order comes in with incomplete address
   "Near station, Mumbai"
   
2. You see it's not sendable
   
3. Call customer: +91 9999999999
   
4. Customer provides complete address:
   "Shop No. 5, Station Road, Near Railway Station,
    Andheri West, Mumbai, Maharashtra - 400058"
   
5. Click "✏️ Edit Address"
   
6. Enter complete address
   
7. Save
   
8. Order is now ready to ship! ✅
```

## 🎨 Visual Indicators

- **Complete Address**: Shows full street address
- **Edit Button**: Always visible in address column
- **Preview**: See formatted address before saving
- **Validation**: Red border if field is invalid
- **Success**: Green toast notification on save

## 🔐 Security

- Only admins can edit addresses
- Changes are logged for audit
- Cannot edit shipped/delivered orders
- All fields are validated

## 📱 Mobile Friendly

The edit dialog works great on mobile devices too!

---

**Need Help?** Check ADDRESS_EDIT_FEATURE.md for detailed documentation.
