# Customer Sorting Feature

## Overview
The customers page now supports sorting to help identify your best customers and those who haven't ordered recently.

## Sorting Options

### 1. **Total Spent** (Best Customers)
- Sort by `Total Spent` in **descending** order
- Shows customers who have spent the most money
- Perfect for identifying VIP customers and high-value accounts

### 2. **Last Order Date** (Inactive Customers)
- Sort by `Last Order Date` in **ascending** order
- Shows customers who haven't ordered in the longest time
- Great for re-engagement campaigns and win-back strategies

### 3. **Total Orders** (Frequent Buyers)
- Sort by `Total Orders` in **descending** order
- Shows customers with the most orders
- Identifies your most loyal repeat customers

### 4. **Newest First** (Recent Signups)
- Sort by `Newest First` (default)
- Shows most recently registered customers
- Good for tracking new customer acquisition

### 5. **Name** (Alphabetical)
- Sort by `Name` in ascending/descending order
- Alphabetical listing of customers

## How to Use

1. **Navigate to Customers Page**: Go to the dashboard and click on "Customers"

2. **Select Sort Option**: Use the dropdown menu labeled with sort options:
   - Newest First
   - Total Spent
   - Total Orders
   - Last Order Date
   - Name

3. **Toggle Sort Direction**: Click the arrow button next to the sort dropdown to switch between:
   - **Descending** (↓): High to low, newest to oldest
   - **Ascending** (↑): Low to high, oldest to newest

4. **Quick Filter - 3+ Orders**: Click the "3+ Orders" button to instantly show only customers with 3 or more orders
   - Button turns blue when active
   - Click again to remove the filter
   - Perfect for finding repeat customers

5. **Combine with Filters**: You can combine sorting with:
   - Loyalty Tier filters (New, Repeat, Gold, Platinum)
   - Customer Segment filters (Active, Dormant, At Risk)
   - Minimum orders filter (3+ Orders button)
   - Search functionality

## Use Cases

### Finding Best Customers
1. Sort by "Total Spent" (descending)
2. Review top customers for special offers or loyalty rewards
3. Check their order history and preferences

### Finding Repeat Customers (3+ Orders)
1. Click the "3+ Orders" button
2. Sort by "Total Orders" or "Total Spent" (descending)
3. Identify your most loyal customers
4. Perfect for VIP programs or exclusive offers

### Re-engaging Inactive Customers
1. Sort by "Last Order Date" (ascending)
2. Filter by segment "Dormant" or "At Risk"
3. Identify customers who haven't ordered in 30+ days
4. Plan targeted re-engagement campaigns

### Analyzing Customer Behavior
1. Sort by "Total Orders" to find frequent buyers
2. Review their purchase patterns
3. Identify opportunities for subscription or bulk offers

## Customer Metrics Displayed

The table now shows:
- **Name**: Customer name
- **Contact**: Phone and email
- **Profile**: Loyalty tier and customer segment badges
- **Value**: Total spent and number of orders
- **Last Order**: How long ago they last ordered (e.g., "2 weeks ago", "3 months ago")

## Tips

- **Best Customers**: Sort by Total Spent (desc) + filter by "Gold" or "Platinum" tier
- **Repeat Buyers**: Click "3+ Orders" button + sort by Total Orders (desc)
- **High-Value Repeat Customers**: Click "3+ Orders" + sort by Total Spent (desc)
- **At-Risk Customers**: Sort by Last Order Date (asc) + filter by "At Risk" segment
- **New Customers**: Sort by Newest First + filter by "New" tier
- **Dormant Customers**: Sort by Last Order Date (asc) + filter by "Dormant" segment
- **Loyal but Inactive**: Click "3+ Orders" + sort by Last Order Date (asc)

## Technical Details

### API Support
- Both `/api/customers` and `/api/customers/paginated` endpoints support sorting and filtering
- Query parameters: `sortBy`, `sortOrder`, and `minOrders`
- Valid sort fields: `createdAt`, `totalSpent`, `totalOrders`, `lastOrderAt`, `name`
- `minOrders` parameter filters customers with at least that many orders

### Performance
- Sorting is done at the database level for optimal performance
- Firestore indexes may be required for some sort combinations
- Cache is used for search results to improve speed
