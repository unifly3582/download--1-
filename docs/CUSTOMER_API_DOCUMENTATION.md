# Customer API Documentation

## Overview

This documentation covers all customer-facing APIs that can be used by:
- Customer web applications
- Mobile apps
- AI agents and chatbots
- Third-party integrations

**Base URL**: `https://yourdomain.com/api`

**Authentication**: Not required for customer APIs

**CORS**: Enabled for all customer endpoints

---

## Product APIs

### 1. Get Products List

**Endpoint**: `GET /products`

**Description**: Get paginated list of products with smart routing (optimized for customers)

**Query Parameters**:
- `category` (string, optional) - Filter by category
- `featured` (boolean, optional) - Get only featured products
- `search` (string, optional) - Search products by name, tags, description
- `page` (number, optional, default: 1) - Page number
- `limit` (number, optional, default: 20) - Items per page

**Example Requests**:
```bash
# Get all products
GET /api/products

# Get featured products
GET /api/products?featured=true&limit=8

# Get products by category
GET /api/products?category=electronics&page=1&limit=20

# Search products
GET /api/products?search=laptop&limit=15
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "PROD_123",
      "name": "MacBook Pro 14-inch",
      "slug": "macbook-pro-14-inch",
      "category": "electronics",
      "priceRange": { "min": 199999, "max": 299999 },
      "originalPrice": { "min": 219999, "max": 319999 },
      "mainImage": "https://example.com/image.jpg",
      "inStock": true,
      "isFeatured": true,
      "availableOptions": {
        "colors": ["Silver", "Space Gray"],
        "storage": ["512GB", "1TB", "2TB"]
      },
      "defaultVariation": {
        "id": "VAR_001",
        "price": 219999,
        "salePrice": 199999,
        "stock": 15
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasMore": true
  }
}
```

### 2. Get Single Product

**Endpoint**: `GET /products/{productId}`

**Description**: Get detailed information about a specific product

**Parameters**:
- `productId` (string, required) - Product ID

**Example Request**:
```bash
GET /api/products/PROD_123
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "PROD_123",
    "name": "MacBook Pro 14-inch",
    "slug": "macbook-pro-14-inch",
    "description": "Powerful laptop for professionals...",
    "category": "electronics",
    "media": [
      { "type": "image", "url": "https://example.com/image1.jpg" },
      { "type": "image", "url": "https://example.com/image2.jpg" }
    ],
    "seo": {
      "title": "MacBook Pro 14-inch - Professional Laptop",
      "description": "Buy MacBook Pro 14-inch with M3 chip..."
    },
    "variations": [
      {
        "id": "VAR_001",
        "name": "Silver / 512GB",
        "sku": "MBP14_SILVER_512",
        "price": 219999,
        "salePrice": 199999,
        "stock": 15,
        "attributes": { "color": "Silver", "storage": "512GB" }
      }
    ],
    "inStock": true,
    "availableOptions": {
      "colors": ["Silver", "Space Gray"],
      "storage": ["512GB", "1TB", "2TB"]
    }
  }
}
```

### 3. Get Featured Products

**Endpoint**: `GET /products/customer/featured`

**Description**: Get featured products optimized for homepage display

**Query Parameters**:
- `limit` (number, optional, default: 8) - Number of products to return

**Example Request**:
```bash
GET /api/products/customer/featured?limit=6
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "PROD_123",
      "name": "MacBook Pro 14-inch",
      "priceRange": { "min": 199999, "max": 299999 },
      "mainImage": "https://example.com/image.jpg",
      "inStock": true
    }
  ],
  "total": 6
}
```

### 4. Get Product Categories

**Endpoint**: `GET /products/customer/categories`

**Description**: Get list of all product categories with metadata

**Example Request**:
```bash
GET /api/products/customer/categories
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "electronics",
      "slug": "electronics",
      "count": 45,
      "featuredCount": 8,
      "priceRange": { "min": 999, "max": 199999 },
      "sampleProduct": {
        "id": "PROD_123",
        "name": "MacBook Pro",
        "image": "https://example.com/sample.jpg"
      }
    }
  ],
  "total": 12
}
```

### 5. Search Products

**Endpoint**: `GET /products/customer/search`

**Description**: Advanced product search with relevance scoring

**Query Parameters**:
- `q` or `query` (string, required) - Search query (minimum 2 characters)
- `category` (string, optional) - Filter by category
- `limit` (number, optional, default: 20) - Maximum results

**Example Request**:
```bash
GET /api/products/customer/search?q=gaming laptop&limit=10
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "PROD_456",
      "name": "ASUS ROG Gaming Laptop",
      "priceRange": { "min": 89999, "max": 149999 },
      "category": "electronics",
      "inStock": true
    }
  ],
  "query": "gaming laptop",
  "category": null,
  "total": 8,
  "totalFound": 15
}
```

### 6. Get Product Variations

**Endpoint**: `GET /products/shared/variations/{productId}`

**Description**: Get all variations for a specific product

**Parameters**:
- `productId` (string, required) - Product ID

**Example Request**:
```bash
GET /api/products/shared/variations/PROD_123
```

**Response**:
```json
{
  "success": true,
  "data": {
    "productId": "PROD_123",
    "productName": "MacBook Pro 14-inch",
    "variations": [
      {
        "id": "VAR_001",
        "name": "Silver / 512GB",
        "sku": "MBP14_SILVER_512",
        "price": 219999,
        "salePrice": 199999,
        "stock": 15,
        "attributes": { "color": "Silver", "storage": "512GB" }
      }
    ],
    "totalVariations": 6
  }
}
```

---

## Order APIs

### 7. Create Order

**Endpoint**: `POST /customer/orders/create`

**Description**: Create a new order from customer application

**Request Body**:
```json
{
  "customerInfo": {
    "name": "John Doe",
    "phone": "+919999999999",
    "email": "john@example.com"
  },
  "shippingAddress": {
    "street": "123 Main Street, Apt 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zip": "400001",
    "country": "India"
  },
  "items": [
    {
      "productId": "PROD_123",
      "variationId": "VAR_001",
      "sku": "MBP14_SILVER_512",
      "quantity": 1
    }
  ],
  "paymentInfo": {
    "method": "COD"
  },
  "couponCode": "SAVE10",
  "trafficSource": "website"
}
```

**Response**:
```json
{
  "success": true,
  "orderId": "ORD_2024_ABC123",
  "message": "Order placed successfully",
  "orderDetails": {
    "orderId": "ORD_2024_ABC123",
    "totalAmount": 199999,
    "discount": 10000,
    "expectedDelivery": "2024-01-15T00:00:00Z"
  }
}
```

### 8. Get Order Details

**Endpoint**: `GET /customer/orders/{orderId}`

**Description**: Get details of a specific order

**Parameters**:
- `orderId` (string, required) - Order ID

**Example Request**:
```bash
GET /api/customer/orders/ORD_2024_ABC123
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "ORD_2024_ABC123",
    "customerFacingStatus": "confirmed",
    "items": [
      {
        "productName": "MacBook Pro 14-inch - Silver / 512GB",
        "quantity": 1,
        "unitPrice": 199999
      }
    ],
    "pricingInfo": {
      "subtotal": 199999,
      "discount": 10000,
      "shippingCharges": 0,
      "grandTotal": 189999
    },
    "shippingAddress": {
      "street": "123 Main Street, Apt 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zip": "400001"
    },
    "createdAt": "2024-01-10T10:30:00Z"
  }
}
```

### 9. Get Customer Orders

**Endpoint**: `GET /customer/orders`

**Description**: Get order history for a customer

**Query Parameters**:
- `phone` (string, required) - Customer phone number
- `page` (number, optional, default: 1) - Page number
- `limit` (number, optional, default: 10) - Orders per page

**Example Request**:
```bash
GET /api/customer/orders?phone=%2B919999999999&page=1&limit=5
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "orderId": "ORD_2024_ABC123",
      "customerFacingStatus": "delivered",
      "totalAmount": 189999,
      "createdAt": "2024-01-10T10:30:00Z",
      "itemCount": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 12,
    "hasMore": true
  }
}
```

---

## Customer Profile APIs

### 10. Manage Customer Profile

**Endpoint**: `POST /customer/profile`

**Description**: Get or update customer profile information

**Request Body for Getting Profile**:
```json
{
  "action": "get",
  "phone": "+919999999999"
}
```

**Request Body for Updating Profile**:
```json
{
  "action": "update",
  "phone": "+919999999999",
  "name": "John Doe",
  "email": "john@example.com",
  "defaultAddress": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zip": "400001",
    "country": "India"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "customerId": "CUS_123456789",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919999999999",
    "defaultAddress": {
      "street": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zip": "400001",
      "country": "India"
    },
    "savedAddresses": [],
    "loyaltyTier": "gold",
    "totalOrders": 15,
    "memberSince": "2023-06-15T00:00:00Z"
  }
}
```

### 11. Get Public Profile

**Endpoint**: `GET /customer/profile/{phone}`

**Description**: Get minimal public profile information

**Parameters**:
- `phone` (string, required) - Customer phone number (URL encoded)

**Example Request**:
```bash
GET /api/customer/profile/%2B919999999999
```

**Response**:
```json
{
  "success": true,
  "data": {
    "customerId": "CUS_123456789",
    "name": "John Doe",
    "phone": "+919999999999",
    "loyaltyTier": "gold",
    "totalOrders": 15,
    "memberSince": "2023-06-15T00:00:00Z"
  }
}
```

---

## Address Management APIs

### 12. Manage Customer Addresses

**Endpoint**: `POST /customer/addresses`

**Description**: Manage customer address book

**Request Body Examples**:

**Get Addresses**:
```json
{
  "phone": "+919999999999",
  "action": "get"
}
```

**Add Address**:
```json
{
  "phone": "+919999999999",
  "action": "add",
  "address": {
    "street": "456 Second Street",
    "city": "Delhi",
    "state": "Delhi",
    "zip": "110001",
    "country": "India"
  },
  "setAsDefault": false
}
```

**Update Address**:
```json
{
  "phone": "+919999999999",
  "action": "update",
  "oldAddress": {
    "street": "456 Second Street",
    "city": "Delhi",
    "state": "Delhi",
    "zip": "110001",
    "country": "India"
  },
  "newAddress": {
    "street": "456 Second Street, Apt 2A",
    "city": "Delhi",
    "state": "Delhi",
    "zip": "110001",
    "country": "India"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Address updated successfully"
}
```

---

## Coupon APIs

### 13. Validate Coupon

**Endpoint**: `POST /customer/coupons/validate`

**Description**: Validate a coupon code for customer order

**Request Body**:
```json
{
  "couponCode": "SAVE10",
  "customerId": "CUS_123456789",
  "customerPhone": "+919999999999",
  "orderValue": 199999,
  "items": [
    {
      "productId": "PROD_123",
      "quantity": 1,
      "unitPrice": 199999
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "discountAmount": 10000,
    "couponDetails": {
      "couponId": "COUP_123",
      "type": "percentage",
      "value": 5,
      "description": "5% off on all products"
    }
  }
}
```

---

## Tracking APIs

### 14. Track Order

**Endpoint**: `GET /customer/tracking/{awb}`

**Description**: Track order shipment by AWB number

**Parameters**:
- `awb` (string, required) - AWB/tracking number

**Example Request**:
```bash
GET /api/customer/tracking/1234567890
```

**Response**:
```json
{
  "success": true,
  "data": {
    "awb": "1234567890",
    "status": "in_transit",
    "currentLocation": "Mumbai Hub",
    "estimatedDelivery": "2024-01-15",
    "trackingEvents": [
      {
        "status": "picked_up",
        "location": "Mumbai",
        "timestamp": "2024-01-12T10:00:00Z",
        "description": "Package picked up"
      },
      {
        "status": "in_transit",
        "location": "Mumbai Hub",
        "timestamp": "2024-01-12T15:30:00Z",
        "description": "Package in transit"
      }
    ]
  }
}
```

---

## Utility APIs

### 15. Pincode Lookup

**Endpoint**: `GET /pincode/{pincode}`

**Description**: Get location details for a pincode

**Parameters**:
- `pincode` (string, required) - Indian pincode

**Example Request**:
```bash
GET /api/pincode/400001
```

**Response**:
```json
{
  "success": true,
  "data": {
    "pincode": "400001",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "deliveryAvailable": true,
    "codAvailable": true,
    "estimatedDays": 2
  }
}
```

---

## Error Responses

All APIs return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Customer APIs have generous rate limits:
- **Products APIs**: 1000 requests per hour per IP
- **Order APIs**: 100 requests per hour per phone number
- **Search APIs**: 500 requests per hour per IP

---

## CORS Policy

All customer APIs support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

---

## Caching

Customer APIs include caching headers for better performance:
- **Product Lists**: Cached for 1 hour
- **Single Products**: Cached for 30 minutes
- **Categories**: Cached for 2 hours
- **Search Results**: Cached for 15 minutes

---

## SDK Examples

### JavaScript/Node.js
```javascript
const API_BASE = 'https://yourdomain.com/api';

// Get featured products
const getFeaturedProducts = async () => {
  const response = await fetch(`${API_BASE}/products/customer/featured?limit=8`);
  return response.json();
};

// Search products
const searchProducts = async (query) => {
  const response = await fetch(`${API_BASE}/products/customer/search?q=${encodeURIComponent(query)}`);
  return response.json();
};

// Create order
const createOrder = async (orderData) => {
  const response = await fetch(`${API_BASE}/customer/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  return response.json();
};
```

### Python
```python
import requests

API_BASE = 'https://yourdomain.com/api'

# Get products
def get_products(category=None, featured=None):
    params = {}
    if category:
        params['category'] = category
    if featured:
        params['featured'] = 'true'
    
    response = requests.get(f'{API_BASE}/products', params=params)
    return response.json()

# Search products
def search_products(query):
    params = {'q': query}
    response = requests.get(f'{API_BASE}/products/customer/search', params=params)
    return response.json()
```

### cURL
```bash
# Get featured products
curl "https://yourdomain.com/api/products/customer/featured?limit=8"

# Search products
curl "https://yourdomain.com/api/products/customer/search?q=laptop"

# Create order
curl -X POST "https://yourdomain.com/api/customer/orders/create" \
  -H "Content-Type: application/json" \
  -d '{"customerInfo":{"name":"John","phone":"+919999999999"},"items":[...]}'
```

---

## Support

For API support and questions:
- **Documentation**: This document
- **Status Page**: Check API status and uptime
- **Contact**: api-support@yourdomain.com

---

*Last Updated: January 2024*