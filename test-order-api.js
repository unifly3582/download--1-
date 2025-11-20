// Test the order API endpoint directly
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

async function testOrderAPI() {
  console.log('🧪 Testing Order API for order 5038...\n');

  try {
    // Get a custom token for authentication
    const customToken = await admin.auth().createCustomToken('test-admin-user', {
      role: 'admin'
    });

    console.log('✅ Generated auth token\n');

    // Call the order API
    const response = await fetch('http://localhost:9006/api/orders/5038', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${customToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Status Text:', response.statusText);
    console.log('');

    const result = await response.json();

    if (result.success) {
      console.log('✅ API call successful!\n');
      console.log('📦 Order Data:');
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ API call failed!\n');
      console.log('Error:', result.error);
      if (result.details) {
        console.log('Details:', result.details);
      }
    }

  } catch (error) {
    console.error('\n❌ Error calling API:', error.message);
  }
}

// Run the test
testOrderAPI()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
