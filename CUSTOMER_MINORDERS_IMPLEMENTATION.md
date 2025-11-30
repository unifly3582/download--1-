# Customer Min Orders Filter - Implementation Notes

## Overview
The minimum orders filter (e.g., "3+ Orders" button) allows filtering customers who have placed a certain number of orders.

## Implementation Approach

### Why Client-Side Filtering?
We use **client-side filtering** instead of Firestore `where()` clauses to avoid complex composite index requirements.

**Problem with Server-Side Filtering:**
```javascript
// This requires a composite index for EVERY sort field combination
query.where('totalOrders', '>=', 3)
     .orderBy('totalSpent', 'desc')  // Needs index: (totalOrders, totalSpent)
     .orderBy('lastOrderAt', 'desc') // Needs index: (totalOrders, lastOrderAt)
     // etc...
```

**Solution - Client-Side Filtering:**
```javascript
// Fetch more records than needed
query.orderBy('totalSpent', 'desc').limit(150)

// Filter in application code
customers.filter(c => c.totalOrders >= 3).slice(0, 50)
```

## How It Works

### API Routes
Both `/api/customers/route.ts` and `/api/customers/paginated/route.ts` implement this:

1. **Detect minOrders parameter**: `const minOrders = searchParams.get('minOrders')`
2. **Fetch extra records**: `fetchLimit = minOrders ? limit * 3 : limit`
3. **Filter client-side**: Check `totalOrders >= minOrders` before adding to results
4. **Return requested limit**: Only return up to the original limit

### Example Flow
```
User clicks "3+ Orders" button
↓
Frontend sends: ?minOrders=3&limit=25
↓
Backend fetches: 75 records (25 * 3)
↓
Backend filters: Keep only customers with totalOrders >= 3
↓
Backend returns: Up to 25 matching customers
```

## Performance Considerations

### Pros
- ✅ No complex indexes needed
- ✅ Works immediately (no index build time)
- ✅ Flexible - can change minOrders value without new indexes
- ✅ Simple to maintain

### Cons
- ⚠️ Fetches 3x more data from Firestore
- ⚠️ May not fill full page if few customers match
- ⚠️ Slightly higher read costs

### Optimization
The 3x multiplier is a balance:
- Too low (2x): May not get enough results
- Too high (5x): Wastes reads and bandwidth
- 3x: Good middle ground for most cases

## Alternative Approaches Considered

### 1. Composite Indexes (Rejected)
**Why not:** Would need 4+ indexes (one per sort field), takes time to build, inflexible

### 2. Separate Collection (Rejected)
**Why not:** Data duplication, sync complexity, maintenance overhead

### 3. Cloud Function Pre-filtering (Rejected)
**Why not:** Added latency, complexity, cost

### 4. Client-Side Filtering (Chosen) ✅
**Why yes:** Simple, flexible, no indexes, works immediately

## Future Improvements

If the customer base grows significantly (10,000+ customers), consider:

1. **Add specific indexes** for common combinations:
   - `(totalOrders DESC, totalSpent DESC)` - Most common use case
   - `(totalOrders DESC, lastOrderAt DESC)` - For re-engagement

2. **Increase fetch multiplier** based on data distribution:
   - If 50% of customers have 3+ orders: 2x is enough
   - If 10% of customers have 3+ orders: 5x might be better

3. **Cache filtered results** for frequently used filters

## Testing

### Test Cases
1. ✅ No filter: Returns all customers
2. ✅ 3+ orders: Returns only customers with >= 3 orders
3. ✅ Combined with sorting: Works with all sort options
4. ✅ Combined with other filters: Works with tier, segment, region
5. ✅ Pagination: Correctly handles "Load More"

### Edge Cases
- Customer with 0 orders: Excluded ✅
- Customer with exactly 3 orders: Included ✅
- No customers match: Returns empty array ✅
- All customers match: Returns up to limit ✅

## Code Locations

### Backend
- `src/app/api/customers/route.ts` - Main customers API
- `src/app/api/customers/paginated/route.ts` - Paginated API

### Frontend
- `src/app/(dashboard)/customers/optimized-page.tsx` - UI with "3+ Orders" button
- `src/hooks/useVirtualizedCustomers.ts` - Hook that passes minOrders parameter

### Indexes
- `firestore.indexes.json` - Contains basic customer indexes (not needed for minOrders)

## Monitoring

Watch for these metrics:
- **Read count**: Should be ~3x normal when filter is active
- **Response time**: Should remain under 1 second
- **Result count**: Should be close to requested limit

If results are consistently under-filled (e.g., requesting 25, getting 10), consider increasing the fetch multiplier.
