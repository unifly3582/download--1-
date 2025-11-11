// Complete explanation of how /api/orders endpoint works
console.log('📋 HOW /api/orders ENDPOINT WORKS');
console.log('='.repeat(60));

console.log(`
🔍 ENDPOINT OVERVIEW
==================
Endpoint: GET /api/orders
Authentication: Admin required (🔐)
Purpose: Fetch and filter orders from the database

🛡️ AUTHENTICATION FLOW
======================
1. Request hits the endpoint
2. withAuth(['admin']) wrapper checks authentication:
   - Looks for "Authorization: Bearer <token>" header
   - Verifies Firebase ID token
   - Checks if user has admin claim OR is whitelisted email
   - If valid, passes request to handler with authContext

📊 FILTERING SYSTEM
==================
Query Parameter: ?status=<filter>
Default: 'to-approve' if no status specified

Status Options:
┌──────────────────┬─────────────────────────────────────────┐
│ Filter           │ Firestore Query                        │
├──────────────────┼─────────────────────────────────────────┤
│ to-approve       │ internalStatus IN ['created_pending',   │
│                  │   'needs_manual_verification']          │
├──────────────────┼─────────────────────────────────────────┤
│ to-ship          │ internalStatus IN ['approved',          │
│                  │   'ready_for_shipping']                 │
├──────────────────┼─────────────────────────────────────────┤
│ in-transit       │ internalStatus IN ['shipped',           │
│                  │   'in_transit']                         │
├──────────────────┼─────────────────────────────────────────┤
│ completed        │ internalStatus == 'delivered'           │
├──────────────────┼─────────────────────────────────────────┤
│ rejected         │ approval.status == 'rejected'           │
├──────────────────┼─────────────────────────────────────────┤
│ issues           │ internalStatus IN ['cancelled',         │
│                  │   'returned']                           │
└──────────────────┴─────────────────────────────────────────┘

🔄 PROCESSING FLOW
==================
1. Parse query parameters from URL
2. Build Firestore query based on status filter
3. Add .orderBy('createdAt', 'desc') for newest first
4. Execute query and get snapshot
5. Process each document:
   - Convert Firestore timestamps to ISO strings
   - Validate data against OrderSchema using Zod
   - Only include valid orders in response
6. Return JSON response with orders array

📦 DATA TRANSFORMATION
=====================
Raw Firestore Data → Processed Order Object

Firestore Timestamps:
- createdAt: Timestamp → ISO string
- updatedAt: Timestamp → ISO string  
- approval.approvedAt: Timestamp → ISO string

Validation:
- Each order validated against OrderSchema
- Invalid orders logged as warnings but excluded
- Only valid orders returned to client

🎯 RESPONSE FORMAT
==================
Success Response:
{
  "success": true,
  "data": [
    {
      "orderId": "ORD_2025_ABC123",
      "orderSource": "admin_form",
      "customerInfo": {
        "customerId": "CUS_123",
        "name": "John Doe",
        "phone": "+919876543210",
        "email": "john@example.com"
      },
      "shippingAddress": {...},
      "items": [
        {
          "productId": "PROD_123",
          "productName": "Product Name",
          "quantity": 2,
          "unitPrice": 500,
          "sku": "SKU_123"
        }
      ],
      "pricingInfo": {
        "subtotal": 1000,
        "discount": 50,
        "taxes": 0,
        "shippingCharges": 50,
        "grandTotal": 1000,
        "codCharges": 25
      },
      "paymentInfo": {
        "method": "COD",
        "status": "Pending"
      },
      "approval": {
        "status": "pending",
        "approvedBy": null,
        "approvedAt": null
      },
      "internalStatus": "created_pending",
      "customerFacingStatus": "confirmed",
      "createdAt": "2025-11-11T10:30:00Z",
      "updatedAt": "2025-11-11T10:30:00Z"
    }
  ]
}

Error Response:
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error info"
}

🚨 ERROR HANDLING
=================
1. Authentication Errors:
   - 401 Unauthorized if token invalid/missing
   
2. Database Errors:
   - FAILED_PRECONDITION: Missing Firestore index
   - Returns specific error message with index creation link
   
3. Validation Errors:
   - Invalid orders logged but don't break the response
   - Only valid orders returned
   
4. General Errors:
   - 500 Internal Server Error
   - Detailed error logging

🔧 TECHNICAL IMPLEMENTATION
==========================
Framework: Next.js App Router
Database: Cloud Firestore
Validation: Zod schemas
Authentication: Firebase Auth + custom withAuth wrapper
Error Handling: Comprehensive try/catch with logging
Timestamps: Automatic Firestore → ISO string conversion

📈 PERFORMANCE CONSIDERATIONS
============================
- Uses Firestore compound queries for filtering
- Orders sorted by creation date (descending)
- Requires Firestore indexes for optimal performance
- Data validation prevents corrupt data from reaching client
- Proper error boundaries prevent cascading failures

🎮 USAGE EXAMPLES
=================
// Get all pending orders (default)
GET /api/orders

// Get specific status
GET /api/orders?status=to-ship
GET /api/orders?status=completed
GET /api/orders?status=rejected

// Authentication required for all requests
Headers: {
  "Authorization": "Bearer <firebase_id_token>",
  "Content-Type": "application/json"
}
`);

console.log('\n🧪 TESTING THE ENDPOINT');
console.log('='.repeat(30));
console.log(`
1. Get Firebase token first:
   POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword
   
2. Use token to call orders API:
   GET http://localhost:9006/api/orders?status=to-approve
   
3. Response will show filtered orders based on status
`);

console.log('\n💡 KEY INSIGHTS');
console.log('='.repeat(20));
console.log(`
- Default filter is 'to-approve' (most common admin use case)
- All responses include validation and error handling
- Timestamps automatically converted for JSON compatibility
- Admin-only access prevents unauthorized data access
- Flexible filtering system supports different business workflows
- Performance optimized with proper indexing requirements
`);