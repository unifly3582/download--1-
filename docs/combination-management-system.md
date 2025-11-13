# Combination Management System

## Overview

The Combination Management System is a comprehensive solution for storing, managing, and optimizing product combinations with their verified weight and dimensions. This system addresses the need to pre-calculate and cache the physical properties of frequently ordered product combinations to improve order processing efficiency.

## Key Features

- **Verified Combinations**: Store combinations with manually verified weight and dimensions
- **Automatic Detection**: Generate unique hashes for product combinations based on SKU and quantities
- **Usage Tracking**: Monitor how frequently combinations are used
- **Admin Management**: Complete CRUD operations through REST APIs
- **Analytics**: Get insights into combination usage patterns
- **Integration**: Seamlessly works with existing order processing logic

## Architecture

### Core Components

1. **CombinationService** (`src/lib/oms/combinationService.ts`)
   - Main service class handling all combination operations
   - Hash generation and validation logic
   - Database interactions with Firestore

2. **Type Definitions** (`src/types/combination.ts`)
   - Zod schemas for validation
   - TypeScript types for type safety
   - Comprehensive data structure definitions

3. **API Endpoints** (`src/app/api/combinations/`)
   - RESTful API for combination management
   - Admin authentication required
   - Support for CRUD operations

4. **Integration Layer** (`src/lib/oms/orderLogic.ts`)
   - Modified to use combination service
   - Automatic usage tracking
   - Fallback to individual product calculations

## Data Structure

### VerifiedCombination

```typescript
interface VerifiedCombination {
  combinationHash: string;           // Unique MD5 hash identifier
  items: OrderItem[];                // Array of products with quantities
  weight: number;                    // Total verified weight in kg
  dimensions: {                      // Total verified dimensions in cm
    l: number;                       // Length
    b: number;                       // Breadth
    h: number;                       // Height
  };
  productSkus: string[];             // SKU array for efficient querying
  
  // Metadata
  verifiedBy: string;                // User who verified the combination
  verifiedAt: Date;                  // When combination was created
  updatedBy?: string;                // User who last updated
  updatedAt?: Date;                  // Last update timestamp
  notes?: string;                    // Optional notes
  
  // Usage tracking
  usageCount: number;                // How many times used
  lastUsedAt?: Date;                 // When last used
  
  // Status
  isActive: boolean;                 // Whether combination is active
}
```

## Hash Generation

Combinations are uniquely identified using MD5 hashes generated from:
- Sorted array of `SKU_QUANTITY` pairs
- Example: `["SKU001_2", "SKU002_1"]` → `a1b2c3d4e5f6...`

This ensures the same combination of products (regardless of order) always generates the same hash.

## API Reference

### Base URL: `/api/combinations`

#### GET `/api/combinations`
List all active combinations with optional filtering.

**Query Parameters:**
- `limit` (number): Maximum results to return (default: 50)
- `product` (string): Filter by product ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "combinationHash": "a1b2c3...",
      "items": [...],
      "weight": 3.5,
      "dimensions": { "l": 25, "b": 20, "h": 15 },
      "usageCount": 42,
      "verifiedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST `/api/combinations`
Create a new verified combination.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "PROD001",
      "productName": "Product Name",
      "sku": "SKU001",
      "quantity": 2,
      "unitPrice": 100
    }
  ],
  "weight": 3.5,
  "dimensions": { "l": 25, "b": 20, "h": 15 },
  "notes": "Manually verified combination"
}
```

#### GET `/api/combinations/[hash]`
Get a specific combination by hash.

#### PUT `/api/combinations/[hash]`
Update combination weight and dimensions.

#### DELETE `/api/combinations/[hash]`
Deactivate a combination (soft delete).

## Usage in Order Processing

### Automatic Integration

The system automatically integrates with existing order processing:

```typescript
// In orderLogic.ts
const combination = await CombinationService.findCombination(orderItems);

if (combination) {
  // Use verified combination data
  totalWeight = combination.weight;
  totalDimensions = combination.dimensions;
  
  // Record usage for analytics
  await CombinationService.recordUsage(combination.combinationHash);
} else {
  // Fall back to individual product calculations
  totalWeight = calculateWeightFromProducts(orderItems);
  totalDimensions = calculateDimensionsFromProducts(orderItems);
}
```

### Manual Verification Workflow

1. Admin processes an order with new product combination
2. Physical verification of weight and dimensions
3. Create combination via API: `POST /api/combinations`
4. Future orders with same combination use verified data automatically

## Service Methods

### CombinationService

#### Core Operations
- `createCombinationHash(items)` - Generate unique hash
- `saveCombination(items, weight, dimensions, verifiedBy, notes?)` - Save new combination
- `getCombination(hash)` - Get combination by hash
- `findCombination(items)` - Find combination for order items

#### Management
- `updateCombination(hash, weight, dimensions, updatedBy, notes?)` - Update existing
- `deactivateCombination(hash, deactivatedBy)` - Soft delete
- `recordUsage(hash)` - Track usage

#### Analytics
- `listCombinations(limit?)` - List all active combinations
- `findCombinationsWithProduct(productId)` - Search by product
- `getCombinationStats()` - Get usage statistics

## Database Schema

### Firestore Collection: `verifiedCombinations`

```
verifiedCombinations/
  {combinationHash}/
    combinationHash: string
    items: array
    weight: number
    dimensions: object
    productSkus: array
    verifiedBy: string
    verifiedAt: timestamp
    updatedBy?: string
    updatedAt?: timestamp
    notes?: string
    usageCount: number
    lastUsedAt?: timestamp
    isActive: boolean
```

### Required Indexes

```javascript
// Composite indexes needed for efficient queries
db.collection('verifiedCombinations').where('isActive', '==', true).orderBy('verifiedAt', 'desc')
db.collection('verifiedCombinations').where('isActive', '==', true).orderBy('usageCount', 'desc')
db.collection('verifiedCombinations').where('productSkus', 'array-contains', 'SKU001')
```

## Testing

### Test Script
Run the comprehensive test suite:

```bash
npm run ts-node src/scripts/test-combination-system.ts
```

### Test Coverage
- Hash generation consistency
- Combination saving and retrieval
- Usage tracking accuracy
- Product search functionality
- Statistics calculation
- Error handling

## Benefits

### Performance
- **Reduced Calculation Time**: Pre-calculated combinations eliminate real-time weight/dimension calculations
- **Database Efficiency**: Single lookup vs multiple product queries
- **Caching**: Frequently used combinations are immediately available

### Accuracy
- **Manual Verification**: Physical verification ensures accurate shipping calculations
- **Consistency**: Same combination always uses same verified data
- **Quality Control**: Admin review process for all combinations

### Analytics
- **Usage Tracking**: Identify most common product combinations
- **Optimization Opportunities**: Focus verification efforts on high-usage combinations
- **Business Insights**: Understand customer ordering patterns

## Implementation Status

✅ **Completed:**
- Core CombinationService implementation
- Type definitions and validation schemas
- REST API endpoints with authentication
- Integration with order processing logic
- Comprehensive test suite
- Error handling for undefined values in customerOrderSync

✅ **Enhanced Features:**
- Usage analytics and statistics
- Product search functionality
- Combination deactivation (soft delete)
- Admin-only access controls
- Comprehensive logging

## Future Enhancements

### Potential Improvements
1. **Bulk Operations**: Import/export combinations in bulk
2. **Auto-Verification**: ML-based weight/dimension prediction
3. **Combination Suggestions**: Recommend combinations for verification based on frequency
4. **Historical Analysis**: Track accuracy improvements over time
5. **Integration**: Connect with warehouse management systems

### Monitoring
1. **Performance Metrics**: Track combination hit rates
2. **Accuracy Tracking**: Compare predicted vs actual shipping weights
3. **Usage Patterns**: Analyze seasonal combination trends

## Troubleshooting

### Common Issues

**Hash Mismatch:**
- Ensure items are properly formatted with productId, sku, and quantity
- Check for extra whitespace or special characters in SKUs

**Combination Not Found:**
- Verify items array structure matches OrderItem schema
- Check if combination exists with `listCombinations()`

**Permission Errors:**
- Ensure user has admin role for API access
- Check Firebase authentication middleware

**Database Errors:**
- Verify Firestore indexes are created
- Check service account permissions

### Debugging

Enable detailed logging:
```typescript
// In combination service
logger.setLevel('debug');
```

Monitor Firestore operations:
```bash
# Check Firestore logs
firebase functions:log --only combinations
```

This comprehensive system provides a robust foundation for managing product combinations with verified physical properties, improving both operational efficiency and shipping accuracy.