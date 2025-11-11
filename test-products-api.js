// Test script to fetch products API
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:9006';
const FIREBASE_API_KEY = "AIzaSyBVX5nnclU8xrgIXtaoSr95bYFyRe3X_dE";

async function testProductsAPI() {
  console.log('🛍️ Testing Products API...\n');

  // Test 1: Public products fetch (customer view)
  console.log('1️⃣ CUSTOMER VIEW - Public Products');
  console.log('='.repeat(40));
  try {
    const response = await fetch(`${BASE_URL}/api/products`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 2: Featured products
  console.log('2️⃣ CUSTOMER VIEW - Featured Products');
  console.log('='.repeat(40));
  try {
    const response = await fetch(`${BASE_URL}/api/products?featured=true`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Featured Products:', JSON.stringify(data, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 3: Search products
  console.log('3️⃣ CUSTOMER VIEW - Search Products');
  console.log('='.repeat(40));
  try {
    const response = await fetch(`${BASE_URL}/api/products?search=laptop`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Search Results:', JSON.stringify(data, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 4: Category filter
  console.log('4️⃣ CUSTOMER VIEW - Category Filter');
  console.log('='.repeat(40));
  try {
    const response = await fetch(`${BASE_URL}/api/products?category=electronics`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Electronics Category:', JSON.stringify(data, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 5: Pagination
  console.log('5️⃣ CUSTOMER VIEW - Pagination');
  console.log('='.repeat(40));
  try {
    const response = await fetch(`${BASE_URL}/api/products?page=1&limit=5`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Paginated Results:', JSON.stringify(data, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testAdminProductsAPI() {
  console.log('🔐 Testing Admin Products API...\n');
  
  // First get admin token
  console.log('Getting admin token...');
  let idToken = null;
  
  try {
    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: "testadmin@example.com",
          password: "testpass123",
          returnSecureToken: true
        })
      }
    );
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      idToken = authData.idToken;
      console.log('✅ Got ID token');
    } else {
      // Try sign in instead
      const signInResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: "uniflyinsect@gmail.com",
            password: "test123", // Replace with actual password
            returnSecureToken: true
          })
        }
      );
      
      if (signInResponse.ok) {
        const signInData = await signInResponse.json();
        idToken = signInData.idToken;
        console.log('✅ Got ID token via sign in');
      } else {
        console.log('❌ Could not get ID token');
        return;
      }
    }
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    return;
  }

  if (!idToken) {
    console.log('❌ No ID token available, skipping admin tests');
    return;
  }

  // Test admin products view
  console.log('6️⃣ ADMIN VIEW - All Products');
  console.log('='.repeat(40));
  try {
    const response = await fetch(`${BASE_URL}/api/products`, {
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Admin Products:', JSON.stringify(data, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test admin search (returns variations)
  console.log('7️⃣ ADMIN VIEW - Search (Variations)');
  console.log('='.repeat(40));
  try {
    const response = await fetch(`${BASE_URL}/api/products?search=test`, {
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Admin Search Results:', JSON.stringify(data, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Alternative customer products endpoints
async function testCustomerProductsEndpoints() {
  console.log('🛒 Testing Customer-Specific Product Endpoints...\n');

  // Test customer categories
  console.log('8️⃣ Customer Categories');
  console.log('='.repeat(30));
  try {
    const response = await fetch(`${BASE_URL}/api/products/customer/categories`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Categories:', JSON.stringify(data, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test customer featured products
  console.log('9️⃣ Customer Featured Products');
  console.log('='.repeat(30));
  try {
    const response = await fetch(`${BASE_URL}/api/products/customer/featured?limit=5`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Featured Products:', JSON.stringify(data, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test customer search
  console.log('🔟 Customer Product Search');
  console.log('='.repeat(30));
  try {
    const response = await fetch(`${BASE_URL}/api/products/customer/search?q=laptop&limit=3`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Search Results:', JSON.stringify(data, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testProductsAPI();
  await testCustomerProductsEndpoints();
  // await testAdminProductsAPI(); // Uncomment if you have valid credentials
}

runAllTests().catch(console.error);