# 🔌 API Reference

> Auto-generated on 30/10/2025, 01:45:03

## 📊 Overview

- **Total Endpoints**: 36
- **Public Endpoints**: 7
- **Admin Endpoints**: 27
- **Documentation Coverage**: 19/36
- **Usage Coverage**: 0/36

## `POST src\app\api\webhooks\razorpay\route.ts`

**Auth**: public 🌐

---

## `POST src\app\api\verified-combinations\route.ts`

**Auth**: admin 🔒

---

## `PUT, DELETE src\app\api\verified-combinations\[id]\route.ts`

**Auth**: admin 🔒

**Description**: PUT handler to update a specific product combination. Secured for admin access only.

**Parameters**:
- `id` (path) **required**
- `id` (path) **required**

---

## `POST src\app\api\tracking\sync\route.ts`

**Auth**: user 🔒

---

## `GET, POST src\app\api\settings\delhivery\route.ts`

**Auth**: admin 🔒

**Description**: GET handler to fetch current Delhivery settings. Secured for admin access only.

---

## `GET, POST src\app\api\settings\checkout\route.ts`

**Auth**: admin 🔒

**Description**: GET handler to fetch the current checkout settings. Secured for admin access only.

---

## `GET, POST src\app\api\settings\auto-approval\route.ts`

**Auth**: admin 🔒

**Description**: GET handler to fetch the current auto-approval settings. Secured for admin access only.

---

## `GET, POST src\app\api\products\route.ts`

**Auth**: admin 🔒

**Parameters**:
- `search` (query) optional

---

## `PUT, DELETE src\app\api\products\[productId]\route.ts`

**Auth**: admin 🔒

---

## `GET src\app\api\products\sku-check\route.ts`

**Auth**: admin 🔒

**Description**: GET handler to check if a product SKU is unique across the catalog. Secured for admin access only.

**Parameters**:
- `sku` (query) optional
- `productId` (query) optional

---

## `GET src\app\api\pincode\[pincode]\route.ts`

**Auth**: public 🌐

---

## `GET, POST src\app\api\orders\route.ts`

**Auth**: admin 🔒

**Parameters**:
- `status` (query) optional

---

## `GET src\app\api\orders\[orderId]\route.ts`

**Auth**: admin 🔒

---

## `POST src\app\api\orders\[orderId]\update-dimensions\route.ts`

**Auth**: admin 🔒

---

## `POST src\app\api\orders\[orderId]\ship\route.ts`

**Auth**: user 🔒

---

## `POST src\app\api\orders\[orderId]\approve\route.ts`

**Auth**: admin 🔒

---

## `GET src\app\api\orders\optimized\route.ts`

**Auth**: admin 🔒

**Parameters**:
- `status` (query) optional
- `limit` (query) optional
- `lastOrderId` (query) optional
- `fields` (query) optional

---

## `POST src\app\api\orders\bulk-optimized\route.ts`

**Auth**: admin 🔒

---

## `POST src\app\api\orders\bulk\route.ts`

**Auth**: admin 🔒

**Description**: POST /api/orders/bulk Bulk operations on orders (approve, reject, ship)

---

## `GET src\app\api\customers\route.ts`

**Auth**: admin 🔒

**Parameters**:
- `search` (query) optional
- `segment` (query) optional
- `tier` (query) optional
- `region` (query) optional

---

## `GET, PUT src\app\api\customers\[phone]\route.ts`

**Auth**: admin 🔒

---

## `POST src\app\api\customers\recalculate\route.ts`

**Auth**: admin 🔒

**Description**: POST handler to trigger a batch recalculation of loyalty tiers for all customers. Secured for admin access only.

---

## `POST src\app\api\customers\create\route.ts`

**Auth**: admin 🔒

---

## `GET src\app\api\customer\tracking\[awb]\route.ts`

**Auth**: public 🌐

**Description**: GET /api/customer/tracking/[awb] Track order by AWB number (for guest users)

---

## `GET src\app\api\customer\orders\route.ts`

**Auth**: public 🌐

**Description**: GET /api/customer/orders Fetch customer orders by customerId or phone

**Parameters**:
- `customerId` (query) optional
- `phone` (query) optional
- `limit` (query) optional

---

## `GET src\app\api\customer\orders\[orderId]\route.ts`

**Auth**: public 🌐

**Description**: GET /api/customer/orders/[orderId] Get specific customer order details

---

## `POST src\app\api\customer\orders\create\route.ts`

**Auth**: public 🌐

**Description**: POST /api/customer/orders/create Create order from customer-facing app (no authentication required)

---

## `POST src\app\api\customer\coupons\validate\route.ts`

**Auth**: public 🌐

**Description**: POST /api/customer/coupons/validate Validate coupon code for customer (no auth required)

---

## `GET, POST src\app\api\admin\tracking\status\route.ts`

**Auth**: admin 🔒

**Description**: GET /api/admin/tracking/status Get tracking system status and statistics

---

## `PUT, PATCH src\app\api\admin\orders\[orderId]\status\route.ts`

**Auth**: admin 🔒

---

## `POST src\app\api\admin\migrate-customer-orders\route.ts`

**Auth**: admin 🔒

**Description**: POST /api/admin/migrate-customer-orders One-time migration to sync existing orders to customerOrders collection

---

## `GET, POST src\app\api\admin\coupons\route.ts`

**Auth**: admin 🔒

**Description**: GET /api/admin/coupons List all coupons with optional filtering

**Parameters**:
- `isActive` (query) optional
- `usageType` (query) optional
- `limit` (query) optional

---

## `GET, PUT, DELETE src\app\api\admin\coupons\[couponId]\route.ts`

**Auth**: admin 🔒

**Description**: GET /api/admin/coupons/[couponId] Get specific coupon details

---

## `GET src\app\api\admin\coupons\[couponId]\stats\route.ts`

**Auth**: admin 🔒

**Description**: GET /api/admin/coupons/[couponId]/stats Get coupon usage statistics

---

## `GET, POST src\app\api\admin\cache\customers\route.ts`

**Auth**: admin 🔒

**Description**: GET /api/admin/cache/customers Get cache statistics

---

## `GET src\app\api\admin\analytics\traffic-sources\route.ts`

**Auth**: admin 🔒

**Description**: GET /api/admin/analytics/traffic-sources Get traffic source analytics

**Parameters**:
- `days` (query) optional

---

