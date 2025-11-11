// Test script for Address API functionality
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:9006';
const TEST_PHONE = '%2B919876543210'; // URL encoded +919876543210

// You'll need to get a real Firebase token for testing
const FIREBASE_TOKEN = 'YOUR_FIREBASE_TOKEN_HERE';

const headers = {
  'Authorization': `Bearer ${FIREBASE_TOKEN}`,
  'Content-Type': 'application/json'
};

console.log('🏠 ADDRESS API TESTING SUITE');
console.log('='.repeat(50));

async function testAddressAPI() {
  
  console.log('\n1. 📋 GET ADDRESS BOOK');
  console.log('-'.repeat(30));
  try {
    const response = await fetch(`${API_BASE}/api/customers/${TEST_PHONE}/addresses`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n2. ➕ ADD NEW ADDRESS');
  console.log('-'.repeat(30));
  try {
    const newAddress = {
      action: 'add',
      address: {
        street: '123 Business Park, Sector 5',
        city: 'Mumbai',
        state: 'Maharashtra', 
        zip: '400001',
        country: 'India'
      },
      setAsDefault: true
    };
    
    const response = await fetch(`${API_BASE}/api/customers/${TEST_PHONE}/addresses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newAddress)
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n3. ➕ ADD ANOTHER ADDRESS');
  console.log('-'.repeat(30));
  try {
    const secondAddress = {
      action: 'add',
      address: {
        street: '456 Corporate Plaza, Block A',
        city: 'Delhi',
        state: 'Delhi',
        zip: '110001', 
        country: 'India'
      },
      setAsDefault: false
    };
    
    const response = await fetch(`${API_BASE}/api/customers/${TEST_PHONE}/addresses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(secondAddress)
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n4. 📋 GET UPDATED ADDRESS BOOK');
  console.log('-'.repeat(35));
  try {
    const response = await fetch(`${API_BASE}/api/customers/${TEST_PHONE}/addresses`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n5. ✏️ UPDATE ADDRESS');
  console.log('-'.repeat(25));
  try {
    const updateRequest = {
      action: 'update',
      oldAddress: {
        street: '123 Business Park, Sector 5',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400001',
        country: 'India'
      },
      newAddress: {
        street: '789 Tech Hub, Sector 7',
        city: 'Mumbai', 
        state: 'Maharashtra',
        zip: '400002',
        country: 'India'
      },
      setAsDefault: true
    };
    
    const response = await fetch(`${API_BASE}/api/customers/${TEST_PHONE}/addresses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(updateRequest)
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n6. ⭐ SET DEFAULT ADDRESS');
  console.log('-'.repeat(30));
  try {
    const setDefaultRequest = {
      action: 'setDefault',
      address: {
        street: '456 Corporate Plaza, Block A',
        city: 'Delhi',
        state: 'Delhi',
        zip: '110001',
        country: 'India'
      }
    };
    
    const response = await fetch(`${API_BASE}/api/customers/${TEST_PHONE}/addresses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(setDefaultRequest)
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n7. 🗑️ REMOVE ADDRESS');
  console.log('-'.repeat(25));
  try {
    const removeRequest = {
      action: 'remove',
      address: {
        street: '789 Tech Hub, Sector 7',
        city: 'Mumbai',
        state: 'Maharashtra', 
        zip: '400002',
        country: 'India'
      }
    };
    
    const response = await fetch(`${API_BASE}/api/customers/${TEST_PHONE}/addresses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(removeRequest)
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n8. 📋 FINAL ADDRESS BOOK STATE');
  console.log('-'.repeat(35));
  try {
    const response = await fetch(`${API_BASE}/api/customers/${TEST_PHONE}/addresses`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n🧪 TESTING EDGE CASES');
  console.log('='.repeat(25));

  console.log('\n9. ❌ DUPLICATE ADDRESS TEST');
  console.log('-'.repeat(35));
  try {
    const duplicateAddress = {
      action: 'add',
      address: {
        street: '456 Corporate Plaza, Block A', // Same as existing address
        city: 'Delhi',
        state: 'Delhi',
        zip: '110001',
        country: 'India'
      }
    };
    
    const response = await fetch(`${API_BASE}/api/customers/${TEST_PHONE}/addresses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(duplicateAddress)
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Expected: 400 (Address already exists)');
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n10. ❌ INVALID ADDRESS TEST');
  console.log('-'.repeat(35));
  try {
    const invalidAddress = {
      action: 'add',
      address: {
        street: '', // Empty street should fail validation
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400001',
        country: 'India'
      }
    };
    
    const response = await fetch(`${API_BASE}/api/customers/${TEST_PHONE}/addresses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(invalidAddress)
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Expected: 400 (Validation error)');
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

console.log(`
🚀 READY TO TEST ADDRESS API!

Setup Instructions:
1. Make sure your dev server is running on port 9006
2. Replace FIREBASE_TOKEN with a real admin token
3. Ensure customer ${TEST_PHONE.replace('%2B', '+')} exists in your database
4. Run: node test-address-api.js

This test will:
✅ Get initial address book
✅ Add new addresses
✅ Update existing addresses
✅ Set default addresses
✅ Remove addresses
✅ Test duplicate detection
✅ Test validation errors

🔧 To get Firebase token:
node get-token-and-test-orders.js
`);

// Uncomment the line below to run the tests (after setting up token)
// testAddressAPI().catch(console.error);