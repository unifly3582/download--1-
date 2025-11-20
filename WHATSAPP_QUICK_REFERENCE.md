# WhatsApp Notifications - Quick Reference

## 🚀 Quick Status

✅ **All working!** Order placed and order cancelled notifications are live.

---

## 📱 Available Templates

| Template Name | Use Case | Parameters |
|---------------|----------|------------|
| `bugglysimple` | Order Placed | Name, Order ID |
| `buggly_order_shipped` | Order Shipped | Name, Order ID, AWB, Amount, Payment |
| `buggly_out_for_delivery` | Out for Delivery | Name, Order ID, AWB, Location |
| `order_cancelled` | Order Cancelled | Name, Order ID |

---

## 🧪 Test Commands

```bash
# Check orders for phone 9999968191
node check-phone-9999968191.js

# Test order placed notification
node send-correct-template-9999968191.js

# Test order cancelled notification  
node test-cancel-notification-9999968191.js

# Get all templates
node get-all-templates.js
```

---

## 🔍 Where Notifications Are Sent

### Order Placed
- **COD**: `src/app/api/customer/orders/create/route.ts` (line ~147)
- **Prepaid**: `src/app/api/razorpay/verify-payment/route.ts` (line ~115)

### Order Cancelled
- **Customer**: `src/app/api/customer/orders/[orderId]/cancel/route.ts` (line ~100)

---

## 📝 Key Files

```
src/lib/whatsapp/
├── templates.ts          # Template definitions
└── service.ts            # WhatsApp API service

src/lib/oms/
└── notifications.ts      # Notification orchestration

src/app/api/
├── customer/orders/create/route.ts                    # COD orders
├── razorpay/verify-payment/route.ts                   # Prepaid orders
└── customer/orders/[orderId]/cancel/route.ts          # Cancellations
```

---

## ⚡ Quick Fixes

### Customer not receiving messages?
1. Check phone format: `+91XXXXXXXXXX`
2. Check server logs for errors
3. Run test script: `node check-phone-9999968191.js`

### Need to add new template?
1. Create in Meta Business Manager
2. Get approval
3. Add to `src/lib/whatsapp/templates.ts`
4. Add method to `src/lib/whatsapp/service.ts`
5. Add method to `src/lib/oms/notifications.ts`
6. Call from appropriate API endpoint

---

## 📊 What Was Fixed Today

1. ✅ Changed `orderreceivedbuggly` → `bugglysimple` (order placed)
2. ✅ Added `order_cancelled` template support
3. ✅ Implemented cancellation notifications
4. ✅ Tested both on phone 9999968191
5. ✅ Created test scripts
6. ✅ Documented everything

---

## 🎯 Next Steps (Optional)

- [ ] Create "Order Delivered" template
- [ ] Create detailed "Order Placed" template with items/amount
- [ ] Fix notification logging to database
- [ ] Add refund notifications

