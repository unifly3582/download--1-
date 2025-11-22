# Order Creation Debug Guide

## Issue
Some orders are failing to be created with 500 Internal Server Error, showing errors like:
- "Failed to load resource: the server responded with a status of 500"
- "Order creation error"
- "Timeout" errors

## What We've Done

### Enhanced Error Logging
Added comprehensive logging to both order creation endpoints to identify exactly where failures occur:

1. **Customer COD Orders** (`/api/customer/orders/create`)
2. **Customer Prepaid Orders** (`/api/razorpay/create-order`)

### Logging Points Added

Each endpoint now logs at every critical step:

1. ✅ Request received
2. ✅ Schema validation
3. ✅ Customer creation/update
4. ✅ Item validation (per item)
   - Product lookup
   - Variation lookup
   - Stock check
5. ✅ Weight/dimension calculation
6. ✅ Order ID generation
7. ✅ Razorpay order creation (prepaid only)
8. ✅ Database save
9. ✅ Coupon validation/application
10. ✅ Final success/error

### Error Details Now Captured

When an error occurs, the logs now include:
- Error message
- Error stack trace
- Error type/name
- Error code
- Context about what was being processed

## How to Debug Order Creation Failures

### Step 1: Check Server Logs
Look for logs with these prefixes:
- `[CUSTOMER_ORDER]` - COD orders
- `[RAZORPAY_ORDER]` - Prepaid orders

### Step 2: Identify the Failure Point
The logs will show exactly where the process stopped:

```
[CUSTOMER_ORDER] Starting order creation...
[CUSTOMER_ORDER] Request body received
[CUSTOMER_ORDER] Schema validation passed
[CUSTOMER_ORDER] Creating/updating customer...
[CUSTOMER_ORDER] Customer created/updated: CUST123
[CUSTOMER_ORDER] Validating and enriching items...
[CUSTOMER_ORDER] Validating item: prod_123 SKU_ABC
[CUSTOMER_ORDER] Product not found: prod_123  ❌ FAILURE HERE
```

### Step 3: Common Failure Scenarios

#### 1. Product Not Found
```
[CUSTOMER_ORDER] Product not found: prod_xyz
```
**Solution**: Product ID doesn't exist in database. Check if product was deleted or ID is incorrect.

#### 2. Variation/SKU Not Found
```
[CUSTOMER_ORDER] Variation not found: SKU_ABC
Available variations: ['SKU_XYZ', 'SKU_DEF']
```
**Solution**: The SKU doesn't match any product variation. Update product or fix SKU in request.

#### 3. Insufficient Stock
```
[CUSTOMER_ORDER] Insufficient stock: Product Name
Available: 2, Requested: 5
```
**Solution**: Not enough stock. Update inventory or reduce order quantity.

#### 4. Customer Creation Failed
```
[CUSTOMER_ORDER] Customer created/updated: [ERROR]
```
**Solution**: Issue with customer data or Firebase permissions.

#### 5. Weight/Dimension Calculation Failed
```
[CUSTOMER_ORDER] Calculating weight and dimensions...
[ERROR] ...
```
**Solution**: Product missing weight/dimension data.

#### 6. Order ID Generation Failed
```
[CUSTOMER_ORDER_ID_GENERATION] Error querying existing orders
```
**Solution**: Database query issue or permissions problem.

#### 7. Razorpay Order Creation Failed (Prepaid)
```
[RAZORPAY_ORDER] Razorpay order creation failed: [error details]
```
**Solution**: Check Razorpay credentials, API status, or amount validation.

#### 8. Database Write Failed
```
[CUSTOMER_ORDER] Saving order to database...
[ERROR] ...
```
**Solution**: Firebase permissions or data validation issue.

#### 9. Schema Validation Failed
```
[CUSTOMER_ORDER] Schema validation failed: { ... }
```
**Solution**: Request data doesn't match expected schema. Check required fields.

## Testing Order Creation

### Test COD Order
```bash
curl -X POST https://admin.jarakitchen.com/api/customer/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderSource": "customer_app",
    "customerInfo": {
      "name": "Test Customer",
      "phone": "9999999999",
      "email": "test@example.com"
    },
    "shippingAddress": {
      "street": "123 Test St",
      "city": "Test City",
      "state": "Test State",
      "pincode": "123456"
    },
    "items": [{
      "productId": "prod_123",
      "sku": "SKU_ABC",
      "quantity": 1
    }],
    "paymentInfo": {
      "method": "COD"
    }
  }'
```

### Test Prepaid Order
```bash
curl -X POST https://admin.jarakitchen.com/api/razorpay/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "orderSource": "customer_app",
    "customerInfo": {
      "name": "Test Customer",
      "phone": "9999999999",
      "email": "test@example.com"
    },
    "shippingAddress": {
      "street": "123 Test St",
      "city": "Test City",
      "state": "Test State",
      "pincode": "123456"
    },
    "items": [{
      "productId": "prod_123",
      "sku": "SKU_ABC",
      "quantity": 1
    }],
    "paymentInfo": {
      "method": "Prepaid"
    }
  }'
```

## Next Steps

1. **Deploy the changes** to production
2. **Monitor logs** when order creation fails
3. **Identify the specific failure point** from logs
4. **Fix the root cause** based on the error type
5. **Add validation** on frontend to prevent invalid requests

## Quick Fixes for Common Issues

### Missing Product Data
- Ensure all products have valid variations with SKUs
- Ensure all variations have weight and dimensions
- Ensure stock levels are updated

### Customer Data Issues
- Validate phone numbers (10 digits)
- Validate email format
- Validate pincode format

### Payment Issues
- Verify Razorpay credentials in environment variables
- Check Razorpay API status
- Ensure amounts are positive numbers

## Files Modified
- `src/app/api/customer/orders/create/route.ts` - Enhanced logging
- `src/app/api/razorpay/create-order/route.ts` - Enhanced logging
