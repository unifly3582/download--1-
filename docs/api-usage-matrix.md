# 📊 API Usage Matrix

> **Auto-generated** - Last updated: $(date)

## 🎯 Quick Reference

| API Endpoint | Used By | Auth Required | Purpose | Status |
|--------------|---------|---------------|---------|--------|
| `/api/customer/orders/create` | Customer Website | ❌ No | Order placement | ✅ Active |
| `/api/customer/orders` | Customer Website | ❌ No | Order history | ✅ Active |
| `/api/customer/coupons/validate` | Customer Website | ❌ No | Coupon validation | ✅ Active |
| `/api/customer/tracking/[awb]` | Customer Website | ❌ No | Package tracking | ✅ Active |
| `/api/admin/analytics/traffic-sources` | Admin Dashboard | ✅ Admin | Business analytics | ✅ Active |
| `/api/admin/coupons` | Admin Dashboard | ✅ Admin | Coupon management | ✅ Active |
| `/api/admin/cache/customers` | Admin Dashboard | ✅ Admin | Cache management | ✅ Active |
| `/api/customers` | Admin Dashboard | ✅ Admin | Customer search | ✅ Active |
| `/api/orders` | Admin Dashboard | ✅ Admin | Order management | ✅ Active |

## 🔍 Detailed Usage

### Customer-Facing APIs
```mermaid
graph LR
    A[Customer Website] --> B[/api/customer/orders/create]
    A --> C[/api/customer/coupons/validate]
    A --> D[/api/customer/orders]
    A --> E[/api/customer/tracking/AWB123]
    
    B --> F[(Orders DB)]
    C --> G[(Coupons DB)]
    D --> H[(Customer Orders DB)]
    E --> I[(Tracking Service)]
```

### Admin Dashboard APIs
```mermaid
graph LR
    A[Admin Dashboard] --> B[/api/admin/analytics/traffic-sources]
    A --> C[/api/admin/coupons]
    A --> D[/api/customers]
    A --> E[/api/orders]
    
    B --> F[(Orders DB)]
    C --> G[(Coupons DB)]
    D --> H[(Customers DB)]
    E --> F
```

## 📱 Frontend Usage

### Analytics Page
- **File**: `src/app/(dashboard)/analytics/page.tsx`
- **API**: `/api/admin/analytics/traffic-sources`
- **Purpose**: Display business metrics and traffic analysis

### Customer Search
- **File**: `src/app/(dashboard)/customers/page.tsx`
- **API**: `/api/customers`
- **Purpose**: Search and manage customer records

### Order Management
- **File**: `src/app/(dashboard)/orders/page.tsx`
- **API**: `/api/orders`
- **Purpose**: View and manage all orders

---
*This document is automatically updated by running `npm run docs:update`*