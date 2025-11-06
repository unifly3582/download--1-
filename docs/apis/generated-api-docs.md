# 🔌 API Documentation

> Auto-generated on 2025-10-29T20:13:51.656Z

## Core APIs

### `POST src\app\api\webhooks\razorpay\route.ts`

**Purpose**: No description

**Authentication**: None

**Used by**: Not detected in frontend scan

**File**: `src\app\api\webhooks\razorpay\route.ts`

---

### `POST src\app\api\verified-combinations\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\verified-combinations\route.ts`

---

### `PUT, DELETE src\app\api\verified-combinations\[id]\route.ts`

**Purpose**: PUT handler to update a specific product combination.

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\verified-combinations\[id]\route.ts`

---

### `POST src\app\api\tracking\sync\route.ts`

**Purpose**: No description

**Authentication**: User

**Used by**: Not detected in frontend scan

**File**: `src\app\api\tracking\sync\route.ts`

---

### `GET, POST src\app\api\settings\delhivery\route.ts`

**Purpose**: GET handler to fetch current Delhivery settings.

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\settings\delhivery\route.ts`

---

### `GET, POST src\app\api\settings\checkout\route.ts`

**Purpose**: GET handler to fetch the current checkout settings.

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\settings\checkout\route.ts`

---

### `GET, POST src\app\api\settings\auto-approval\route.ts`

**Purpose**: GET handler to fetch the current auto-approval settings.

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\settings\auto-approval\route.ts`

---

### `GET, POST src\app\api\products\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\products\route.ts`

---

### `PUT, DELETE src\app\api\products\[productId]\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\products\[productId]\route.ts`

---

### `GET src\app\api\products\sku-check\route.ts`

**Purpose**: GET handler to check if a product SKU is unique across the catalog.

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\products\sku-check\route.ts`

---

### `GET src\app\api\pincode\[pincode]\route.ts`

**Purpose**: No description

**Authentication**: None

**Used by**: Not detected in frontend scan

**File**: `src\app\api\pincode\[pincode]\route.ts`

---

### `GET, POST src\app\api\orders\route.ts`

**Purpose**: item.quantity, 0);

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\orders\route.ts`

---

### `GET src\app\api\orders\[orderId]\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\orders\[orderId]\route.ts`

---

### `POST src\app\api\orders\[orderId]\update-dimensions\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\orders\[orderId]\update-dimensions\route.ts`

---

### `POST src\app\api\orders\[orderId]\ship\route.ts`

**Purpose**: No description

**Authentication**: User

**Used by**: Not detected in frontend scan

**File**: `src\app\api\orders\[orderId]\ship\route.ts`

---

### `POST src\app\api\orders\[orderId]\approve\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\orders\[orderId]\approve\route.ts`

---

### `GET src\app\api\orders\optimized\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\orders\optimized\route.ts`

---

### `POST src\app\api\orders\bulk-optimized\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\orders\bulk-optimized\route.ts`

---

### `POST src\app\api\orders\bulk\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\orders\bulk\route.ts`

---

### `GET src\app\api\customers\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\customers\route.ts`

---

### `GET, PUT src\app\api\customers\[phone]\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\customers\[phone]\route.ts`

---

### `POST src\app\api\customers\recalculate\route.ts`

**Purpose**: POST handler to trigger a batch recalculation of loyalty tiers for all customers.

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\customers\recalculate\route.ts`

---

### `POST src\app\api\customers\create\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\customers\create\route.ts`

---

### `GET src\app\api\customer\tracking\[awb]\route.ts`

**Purpose**: No description

**Authentication**: None

**Used by**: Not detected in frontend scan

**File**: `src\app\api\customer\tracking\[awb]\route.ts`

---

### `GET src\app\api\customer\orders\route.ts`

**Purpose**: No description

**Authentication**: None

**Used by**: Not detected in frontend scan

**File**: `src\app\api\customer\orders\route.ts`

---

### `GET src\app\api\customer\orders\[orderId]\route.ts`

**Purpose**: No description

**Authentication**: None

**Used by**: Not detected in frontend scan

**File**: `src\app\api\customer\orders\[orderId]\route.ts`

---

### `POST src\app\api\customer\orders\create\route.ts`

**Purpose**: No description

**Authentication**: None

**Used by**: Not detected in frontend scan

**File**: `src\app\api\customer\orders\create\route.ts`

---

### `POST src\app\api\customer\coupons\validate\route.ts`

**Purpose**: No description

**Authentication**: None

**Used by**: Not detected in frontend scan

**File**: `src\app\api\customer\coupons\validate\route.ts`

---

### `GET, POST src\app\api\admin\tracking\status\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\admin\tracking\status\route.ts`

---

### `PUT src\app\api\admin\orders\[orderId]\status\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\admin\orders\[orderId]\status\route.ts`

---

### `POST src\app\api\admin\migrate-customer-orders\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\admin\migrate-customer-orders\route.ts`

---

### `GET, POST src\app\api\admin\coupons\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\admin\coupons\route.ts`

---

### `GET, PUT, DELETE src\app\api\admin\coupons\[couponId]\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\admin\coupons\[couponId]\route.ts`

---

### `GET src\app\api\admin\coupons\[couponId]\stats\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\admin\coupons\[couponId]\stats\route.ts`

---

### `GET, POST src\app\api\admin\cache\customers\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\admin\cache\customers\route.ts`

---

### `GET src\app\api\admin\analytics\traffic-sources\route.ts`

**Purpose**: No description

**Authentication**: Admin

**Used by**: Not detected in frontend scan

**File**: `src\app\api\admin\analytics\traffic-sources\route.ts`

---

