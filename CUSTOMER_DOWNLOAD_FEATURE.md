# Customer Download Feature

## Overview
A comprehensive customer data download feature integrated into the Orders page that allows downloading all customer data locally with advanced filtering capabilities before exporting to CSV.

## Location
- **Component**: `src/components/customer-download-dialog.tsx`
- **Integration**: Customers page (`src/app/(dashboard)/customers/optimized-page.tsx`)

## Features

### 1. Download All Customers
- Fetches all customers from the database in batches
- Shows progress during data fetching
- Stores data locally in browser memory for instant filtering

### 2. Advanced Filtering
Filter customers by:
- **Loyalty Tier**: Bronze, Silver, Gold, Platinum
- **State**: All available states from customer addresses
- **Min Total Spent**: Filter by minimum lifetime value (₹)
- **Max Total Spent**: Filter by maximum lifetime value (₹)
- **Min Number of Orders**: Filter by minimum order count
- **Last Order Within**: Filter by days since last order (e.g., 30 days)

### 3. Real-time Filter Results
- Shows filtered count vs total count
- Updates instantly as filters change
- Clear all filters with one click

### 4. CSV Export
Downloads filtered customer data with the following fields:
- Customer ID
- Name
- Phone
- Email
- Loyalty Tier
- Customer Segment
- Total Orders
- Total Spent
- Last Order Date
- Street Address
- City
- State
- Pincode
- Region
- Created At

## Usage

### From Customers Page
1. Click the "Download Customers" button in the top toolbar (next to "Add Customer")
2. Wait for all customers to be fetched (progress shown)
3. Apply desired filters
4. Click "Download CSV" to export filtered data

### Access
The feature is accessible from the Customers page toolbar, making it easy to download and filter customer data anytime.

## Technical Details

### Data Fetching
- Uses paginated API (`/api/customers/paginated`)
- Fetches in batches of 100 customers
- Safety limit of 100 batches (10,000 customers max)
- Shows progress toasts during fetch

### Filtering Logic
All filters are applied client-side for instant results:
- Tier: Exact match on `loyaltyTier`
- State: Exact match on `shippingAddress.state`
- Order value: Range filter on `totalSpent`
- Order count: Minimum filter on `totalOrders`
- Last order: Date comparison on `lastOrderAt`

### CSV Format
- Standard CSV with comma separators
- Text fields wrapped in quotes to handle commas
- Filename includes filters and date: `customers_Gold_Maharashtra_2024-12-01.csv`

## Example Use Cases

### 1. High-Value Customers in Specific State
```
Tier: Gold
State: Maharashtra
Min Total Spent: 10000
```

### 2. Recent Active Customers
```
Last Order Within: 30 days
Min Orders: 3
```

### 3. Dormant Customers
```
Last Order Within: 180 days (leave empty)
Min Total Spent: 5000
```

### 4. New Customers by State
```
State: Karnataka
Max Orders: 2
```

## API Dependencies
- `GET /api/customers/paginated` - Fetches paginated customer data
  - Query params: `limit`, `cursor`, `sortBy`, `sortOrder`
  - Returns: `{ success, data: { data, hasMore, nextCursor, total } }`

## Future Enhancements
- [ ] Add customer segment filter
- [ ] Add region filter
- [ ] Add date range filter for customer creation
- [ ] Export to Excel format
- [ ] Save filter presets
- [ ] Schedule automated exports
- [ ] Email export option
- [ ] Add more customer fields (phone verified, email verified, etc.)
