# Product Combinations Management

This module provides a UI for managing verified product combinations with their weight and dimensions.

## Features

### View Combinations
- List all verified product combinations
- Search by product name, SKU, or combination hash
- View usage statistics for each combination
- See when combinations were last used

### Edit Combinations
- Update weight and dimensions
- Add or modify notes
- View product details in the combination
- See usage history

### Manage Status
- Activate/deactivate combinations
- Delete combinations (with confirmation)
- Track who verified and updated each combination

### Statistics Dashboard
- Total combinations count
- Active combinations
- Total usage across all combinations
- Average usage per combination

## How It Works

1. **Automatic Creation**: When an admin enters dimensions for an order with missing dimensions, a combination is automatically created and cached.

2. **Hash-Based Matching**: Each combination is identified by an MD5 hash of the sorted SKUs and quantities. This allows the system to automatically find matching combinations for future orders.

3. **Reusability**: Once a combination is verified, it can be automatically applied to future orders with the same product mix, saving time.

4. **Manual Management**: Admins can edit combinations if product packaging changes or if corrections are needed.

## API Endpoints

- `GET /api/combinations` - List all combinations
- `PATCH /api/combinations/[hash]` - Update a combination
- `DELETE /api/combinations/[hash]` - Delete a combination
- `PATCH /api/combinations/[hash]/toggle` - Activate/deactivate a combination

## Navigation

Access the Combinations page from the sidebar menu (Box icon) or navigate to `/combinations`.
