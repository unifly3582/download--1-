// Complete explanation of Address API functionality
console.log('🏠 ADDRESS API COMPREHENSIVE GUIDE');
console.log('='.repeat(60));

console.log(`
🎯 ENDPOINT OVERVIEW
===================
Base Path: /api/customers/[phone]/addresses
Authentication: Admin required (🔐)
Purpose: Complete address book management for customers

📋 API ENDPOINTS
===============

1. GET /api/customers/[phone]/addresses
   - Retrieve customer's address book
   - Returns default address + saved addresses list
   
2. POST /api/customers/[phone]/addresses  
   - Manage addresses with action-based operations
   - Supports: add, update, remove, setDefault actions

🔍 ADDRESS SCHEMA
================
Required Fields:
┌─────────────┬──────────────────────────────────────┐
│ Field       │ Validation                           │
├─────────────┼──────────────────────────────────────┤
│ street      │ String, min 1 char (required)        │
│ city        │ String, min 1 char (required)        │
│ state       │ String, min 1 char (required)        │
│ zip         │ String, min 1 char (required)        │
│ country     │ String, min 1 char (required)        │
└─────────────┴──────────────────────────────────────┘

🎮 OPERATIONS SUPPORTED
======================

1. 📋 GET ADDRESS BOOK
   GET /api/customers/{phone}/addresses
   
   Response:
   {
     "success": true,
     "data": {
       "defaultAddress": {
         "street": "123 Main St",
         "city": "New York",
         "state": "NY", 
         "zip": "10001",
         "country": "USA"
       },
       "savedAddresses": [
         // Array of saved addresses
       ],
       "totalAddresses": 3
     }
   }

2. ➕ ADD NEW ADDRESS
   POST /api/customers/{phone}/addresses
   
   Request Body:
   {
     "action": "add",
     "address": {
       "street": "456 Oak Ave",
       "city": "Los Angeles", 
       "state": "CA",
       "zip": "90210",
       "country": "USA"
     },
     "setAsDefault": false  // Optional, defaults to false
   }

3. ✏️ UPDATE EXISTING ADDRESS
   POST /api/customers/{phone}/addresses
   
   Request Body:
   {
     "action": "update",
     "oldAddress": {
       "street": "123 Main St",
       "city": "New York",
       "state": "NY",
       "zip": "10001", 
       "country": "USA"
     },
     "newAddress": {
       "street": "789 Pine Rd",
       "city": "New York",
       "state": "NY",
       "zip": "10002",
       "country": "USA"
     },
     "setAsDefault": true  // Optional
   }

4. 🗑️ REMOVE ADDRESS
   POST /api/customers/{phone}/addresses
   
   Request Body:
   {
     "action": "remove",
     "address": {
       "street": "456 Oak Ave",
       "city": "Los Angeles",
       "state": "CA", 
       "zip": "90210",
       "country": "USA"
     }
   }

5. ⭐ SET DEFAULT ADDRESS
   POST /api/customers/{phone}/addresses
   
   Request Body:
   {
     "action": "setDefault",
     "address": {
       "street": "789 Pine Rd",
       "city": "New York",
       "state": "NY",
       "zip": "10002",
       "country": "USA"
     }
   }

🧠 SMART FEATURES
================

1. 🔍 Address Comparison Algorithm:
   - Normalizes addresses before comparison
   - Handles case differences (Main St vs main st)
   - Removes extra whitespace
   - Standardizes abbreviations:
     • apartment → apt
     • building → bldg  
     • street → st
     • road → rd
     • avenue → ave

2. 🛡️ Duplicate Prevention:
   - Automatically detects duplicate addresses
   - Prevents adding same address twice
   - Smart comparison ignores formatting differences

3. 🎯 Default Address Management:
   - Auto-updates default when removing current default
   - Sets first available address as new default
   - Supports explicit default address setting

4. 📱 Phone Number Flexibility:
   - Supports URL encoded phone numbers
   - Handles international formats
   - Finds customers by phone regardless of storage format

🔧 TECHNICAL IMPLEMENTATION
==========================

Backend Functions:
- addCustomerAddress(): Adds new address with duplicate check
- updateCustomerAddress(): Updates existing address safely  
- removeCustomerAddress(): Removes address + updates defaults
- setDefaultAddress(): Sets specific address as default
- addressesEqual(): Smart address comparison algorithm

Database Operations:
- Uses Firestore for address storage
- Handles both customer ID and phone-based documents
- Atomic updates with server timestamps
- Optimistic duplicate checking

Error Handling:
- Comprehensive validation with Zod schemas
- Customer existence verification
- Duplicate address detection
- Database error recovery

🚨 ERROR RESPONSES
=================

Authentication Errors:
- 401: Invalid/missing Firebase token
- 403: Insufficient permissions (non-admin)

Validation Errors:
- 400: Invalid address format
- 400: Missing required fields
- 400: Invalid action type

Business Logic Errors:
- 404: Customer not found
- 400: Address already exists (for add)
- 400: Address not found (for update/remove/setDefault)
- 400: Duplicate new address (for update)

Server Errors:
- 500: Database connection issues
- 500: Firestore operation failures

📊 USAGE EXAMPLES
================

// Get customer's address book
GET /api/customers/%2B919876543210/addresses
Headers: {
  "Authorization": "Bearer <firebase_token>",
  "Content-Type": "application/json"
}

// Add new address
POST /api/customers/%2B919876543210/addresses
{
  "action": "add",
  "address": {
    "street": "123 Business Park",
    "city": "Mumbai", 
    "state": "Maharashtra",
    "zip": "400001",
    "country": "India"
  },
  "setAsDefault": true
}

// Update existing address
POST /api/customers/%2B919876543210/addresses
{
  "action": "update",
  "oldAddress": {
    "street": "123 Business Park",
    "city": "Mumbai",
    "state": "Maharashtra", 
    "zip": "400001",
    "country": "India"
  },
  "newAddress": {
    "street": "456 Corporate Plaza", 
    "city": "Mumbai",
    "state": "Maharashtra",
    "zip": "400002", 
    "country": "India"
  }
}

💡 BUSINESS BENEFITS
===================
- ✅ Complete address book management
- ✅ Prevents duplicate address entries  
- ✅ Smart address normalization
- ✅ Default address automation
- ✅ Admin-controlled operations
- ✅ Comprehensive error handling
- ✅ International address support
- ✅ URL-safe phone number handling

🔄 INTEGRATION POINTS
====================
- Used by order creation for shipping addresses
- Integrates with customer management system
- Supports e-commerce address selection
- Compatible with delivery/logistics systems
- Works with order fulfillment workflows
`);

console.log('\n🧪 TESTING ADDRESS API');
console.log('='.repeat(30));
console.log(`
1. Get Firebase admin token first
2. Test address operations:
   - GET address book
   - ADD new address  
   - UPDATE existing address
   - REMOVE address
   - SET default address

Test Phone: +919876543210 (URL encoded: %2B919876543210)
Base URL: http://localhost:9006/api/customers/
`);

console.log('\n🎯 NEXT STEPS');
console.log('='.repeat(15));
console.log(`
1. Test with real customer phone numbers
2. Verify address normalization works correctly
3. Test duplicate detection with similar addresses
4. Validate default address management
5. Check error handling for edge cases
`);