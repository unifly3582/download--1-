# Customer Tier Filter Fix

## Problem
When clicking on the "Repeat" tier filter (or any loyalty tier filter) in the customers page, the API returned a 500 error:
```
API Error: "Failed to fetch customers" "(Status: 500)"
```

## Root Cause
Firestore requires **composite indexes** when you:
1. Filter by one field (`loyaltyTier`)
2. AND sort by another field (`createdAt`, `totalSpent`, etc.)

Without these indexes, Firestore cannot execute the query and returns an error.

## Solution
Added composite indexes for all combinations of `loyaltyTier` filter with sorting fields:

### Indexes Added:
1. `(loyaltyTier, createdAt)` - For sorting by newest first
2. `(loyaltyTier, totalSpent)` - For sorting by total spent
3. `(loyaltyTier, totalOrders)` - For sorting by total orders
4. `(loyaltyTier, lastOrderAt)` - For sorting by last order date
5. `(loyaltyTier, name)` - For sorting alphabetically

## Files Changed
- `firestore.indexes.json` - Added 5 new composite indexes for customers collection

## Deployment
Indexes deployed to Firebase:
```bash
firebase deploy --only firestore:indexes
```

## Index Build Time
⏳ **Note**: Firestore indexes take a few minutes to build. The tier filter will work once the indexes are ready.

You can check index status at:
https://console.firebase.google.com/project/buggly-adminpanel/firestore/indexes

## How to Use
Once indexes are built (usually 2-5 minutes):

1. Go to Customers page
2. Click on any tier filter:
   - **New** (0-2 orders)
   - **Repeat** (3-10 orders)
   - **Gold** (11-25 orders)
   - **Platinum** (26+ orders)
3. Combine with sorting options
4. Use with other filters (segment, region)

## Expected Results

### Repeat Tier Filter:
- Should show **205 customers** with 3-10 orders
- Combined revenue: ₹9,82,830 (60% of total)

### Gold Tier Filter:
- Should show **3 customers** with 11-25 orders
- Top customers: G.kiran Kumar, MOHAMMED Haji, vishal sathawane

### New Tier Filter:
- Should show **1,028 customers** with 0-2 orders

## Testing
After indexes are built, test:
1. ✅ Filter by "Repeat" tier
2. ✅ Sort by "Total Spent" (descending)
3. ✅ Combine with "3+ Orders" button
4. ✅ Search while tier filter is active

## Related Features
This fix enables:
- Tier-based customer segmentation
- Targeted marketing campaigns
- VIP customer identification
- Loyalty program management

## Prevention
When adding new filters or sort options to the customers page, always check if composite indexes are needed:
- Filter field + Sort field = Composite index required
- Use Firebase console error messages to identify missing indexes
- Add indexes to `firestore.indexes.json` before deploying

## Monitoring
Watch for these errors in logs:
- "FAILED_PRECONDITION: The query requires an index"
- "Failed to fetch customers (Status: 500)"

These indicate missing indexes.
