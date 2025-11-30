# Customer Filters - Quick Reference

## New Feature: Minimum Orders Filter

### What It Does
Filters customers to show only those with a minimum number of orders.

### How to Use
1. Go to Customers page
2. Click the **"3+ Orders"** button
3. The button turns blue when active
4. Click again to remove the filter

### Common Use Cases

#### 1. Find Repeat Customers (3+ Orders)
```
Action: Click "3+ Orders" button
Result: Shows only customers with 3 or more orders
Perfect for: Identifying loyal customers for VIP programs
```

#### 2. Best Repeat Customers
```
Action: Click "3+ Orders" + Sort by "Total Spent" (desc)
Result: Your highest-spending repeat customers
Perfect for: Premium offers, loyalty rewards
```

#### 3. Most Frequent Buyers
```
Action: Click "3+ Orders" + Sort by "Total Orders" (desc)
Result: Customers sorted by order frequency
Perfect for: Subscription offers, bulk discounts
```

#### 4. Inactive Loyal Customers
```
Action: Click "3+ Orders" + Sort by "Last Order Date" (asc)
Result: Repeat customers who haven't ordered recently
Perfect for: Win-back campaigns for previously loyal customers
```

#### 5. High-Value Gold/Platinum Customers
```
Action: Click "3+ Orders" + Filter "Gold" or "Platinum" tier + Sort by "Total Spent" (desc)
Result: Your absolute best customers
Perfect for: Exclusive offers, early access to new products
```

## All Available Filters

### Loyalty Tier
- New
- Repeat
- Gold
- Platinum

### Customer Segment
- Active
- Dormant
- At Risk

### Minimum Orders
- 3+ Orders (quick button)
- Can be customized via API with any number

### Sorting Options
- Newest First (default)
- Total Spent
- Total Orders
- Last Order Date
- Name (A-Z)

### Sort Direction
- Descending (↓) - High to low, newest to oldest
- Ascending (↑) - Low to high, oldest to newest

## Pro Tips

1. **Combine filters** for precise targeting:
   - "3+ Orders" + "Dormant" segment = Previously loyal customers to re-engage
   - "3+ Orders" + "Platinum" tier = Your VIP customers
   - "3+ Orders" + Sort by "Last Order Date" (asc) = Loyal customers at risk of churning

2. **Use sorting strategically**:
   - Sort by "Total Spent" to find high-value customers
   - Sort by "Last Order Date" to find inactive customers
   - Sort by "Total Orders" to find frequent buyers

3. **Quick workflows**:
   - **VIP List**: 3+ Orders + Platinum tier + Sort by Total Spent (desc)
   - **Re-engagement**: 3+ Orders + Sort by Last Order Date (asc)
   - **New Loyalists**: 3+ Orders + New tier (customers who quickly became repeat buyers)

## Technical Details

### API Endpoints
- `/api/customers?minOrders=3`
- `/api/customers/paginated?minOrders=3`

### Query Parameters
```
minOrders: number (optional)
sortBy: 'createdAt' | 'totalSpent' | 'totalOrders' | 'lastOrderAt' | 'name'
sortOrder: 'asc' | 'desc'
tier: 'all' | 'new' | 'repeat' | 'gold' | 'platinum'
segment: 'all' | 'Active' | 'Dormant' | 'At Risk'
```

### Database Query
Uses Firestore `where('totalOrders', '>=', minOrders)` for efficient filtering.

### Performance
- Indexed queries for fast results
- Works with pagination
- Combines with other filters seamlessly
