# Customer Order Cancellation API

## Endpoint
`POST /api/customer/orders/[orderId]/cancel`

## Description
Allows customers to cancel their own orders before they are shipped.

## Authentication
No authentication required, but customer must provide their phone number to verify ownership.

## Request Body
```json
{
  "phone": "9876543210",
  "reason": "Changed my mind" // optional
}
```

## Cancellation Rules
- **Allowed statuses**: `created_pending`, `approved`
- **Not allowed**: Orders that are `ready_for_shipping`, `shipped`, `in_transit`, `delivered`, or already `cancelled`
- Customer must own the order (phone number verification)

## Response

### Success (200)
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "orderId": "12345"
}
```

### Error (400/403/404)
```json
{
  "success": false,
  "error": "Order cannot be cancelled. Current status: shipped",
  "message": "Orders can only be cancelled before shipping. Please contact support for assistance."
}
```

## Cancellation Tracking
When a customer cancels an order, the following fields are recorded:
- `cancellation.cancelledBy`: Customer ID
- `cancellation.cancelledAt`: Timestamp
- `cancellation.cancelledByRole`: "customer"
- `cancellation.reason`: Customer-provided reason or "Customer cancelled"

## Admin vs Customer Cancellation
The system now tracks who cancelled the order:
- **Admin cancellations**: `cancelledByRole: "admin"` (via bulk operations)
- **Customer cancellations**: `cancelledByRole: "customer"` (via this endpoint)
