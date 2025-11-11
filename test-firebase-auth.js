// Quick test script to verify Firebase Authentication
const fetch = require('node-fetch');

const FIREBASE_API_KEY = "AIzaSyBVX5nnclU8xrgIXtaoSr95bYFyRe3X_dE";

async function testFirebaseAuth() {
  console.log('🔍 Testing Firebase Authentication...');
  
  const testData = {
    email: "uniflyinsect@gmail.com",
    password: "test123", // Replace with actual password
    returnSecureToken: true
  };

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      }
    );

    const result = await response.text();
    
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      const data = JSON.parse(result);
      console.log('✅ Success! ID Token:', data.idToken.substring(0, 50) + '...');
      
      // Test the customer creation API
      console.log('\n🔍 Testing Customer Creation API...');
      await testCustomerAPI(data.idToken);
    } else {
      console.log('❌ Authentication failed');
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(result);
        console.log('Error details:', errorData);
      } catch (e) {
        console.log('Raw error response:', result);
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

async function testCustomerAPI(idToken) {
  try {
    const customerData = {
      phone: "9876543210",
      name: "Test Customer via Script",
      email: "scripttest@example.com",
      preferredLanguage: "en"
    };

    const response = await fetch('http://localhost:9006/api/customers/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(customerData)
    });

    const result = await response.text();
    console.log('Customer API Status:', response.status);
    console.log('Customer API Response:', result);

  } catch (error) {
    console.error('❌ Customer API error:', error.message);
  }
}

// Alternative test: try creating a new user first
async function testCreateUser() {
  console.log('\n🔍 Testing User Creation...');
  
  const newUserData = {
    email: "testuser@example.com",
    password: "testpass123",
    returnSecureToken: true
  };

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUserData)
      }
    );

    const result = await response.text();
    console.log('Create User Status:', response.status);
    console.log('Create User Response:', result);

  } catch (error) {
    console.error('❌ Create user error:', error.message);
  }
}

// Run tests
testFirebaseAuth();
testCreateUser();