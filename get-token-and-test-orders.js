// Get Firebase ID token and test orders API
const fetch = require('node-fetch');

const FIREBASE_API_KEY = "AIzaSyBVX5nnclU8xrgIXtaoSr95bYFyRe3X_dE";
const BASE_URL = "http://localhost:9006";

async function getFirebaseToken() {
  console.log('🔑 Getting Firebase ID token...');
  
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: "uniflyinsect@gmail.com",
          password: "12345678",
          returnSecureToken: true
        })
      }
    );

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Successfully got ID token');
      console.log('📧 Email:', data.email);
      console.log('🔑 Token (first 50 chars):', data.idToken.substring(0, 50) + '...');
      console.log('⏰ Expires in:', data.expiresIn, 'seconds');
      return data.idToken;
    } else {
      console.log('❌ Authentication failed');
      console.log('Response:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    return null;
  }
}

async function testOrdersAPI(token) {
  console.log('\n📋 Testing Orders API...');
  
  const tests = [
    {
      name: 'Get Orders (to-approve)',
      url: `${BASE_URL}/api/orders?status=to-approve`,
      method: 'GET'
    },
    {
      name: 'Get Orders (all)',
      url: `${BASE_URL}/api/orders`,
      method: 'GET'
    },
    {
      name: 'Get Orders (to-ship)',
      url: `${BASE_URL}/api/orders?status=to-ship`,
      method: 'GET'
    },
    {
      name: 'Get Orders (completed)',
      url: `${BASE_URL}/api/orders?status=completed`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    console.log(`\n🧪 ${test.name}`);
    console.log('='.repeat(40));
    
    try {
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      console.log('📊 Status:', response.status);
      console.log('📈 Success:', data.success);
      
      if (data.success && data.data) {
        console.log('📦 Orders count:', data.data.length);
        if (data.data.length > 0) {
          console.log('📝 First order:', {
            orderId: data.data[0].orderId,
            customerName: data.data[0].customerInfo?.name,
            status: data.data[0].internalStatus,
            total: data.data[0].pricingInfo?.grandTotal
          });
        }
      } else {
        console.log('📄 Response:', JSON.stringify(data, null, 2));
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function generateCurlCommands(token) {
  console.log('\n🚀 CURL COMMANDS WITH YOUR TOKEN');
  console.log('='.repeat(60));
  
  const commands = [
    {
      name: 'Get orders pending approval',
      command: `curl -X GET "http://localhost:9006/api/orders?status=to-approve" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json"`
    },
    {
      name: 'Get all orders',
      command: `curl -X GET "http://localhost:9006/api/orders" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json"`
    },
    {
      name: 'Get orders ready to ship',
      command: `curl -X GET "http://localhost:9006/api/orders?status=to-ship" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json"`
    },
    {
      name: 'Get specific order (replace ORD_ID with actual order ID)',
      command: `curl -X GET "http://localhost:9006/api/orders/ORD_ID" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json"`
    }
  ];

  commands.forEach((cmd, index) => {
    console.log(`${index + 1}. ${cmd.name}:`);
    console.log(cmd.command);
    console.log('');
  });
  
  console.log('💡 Note: This token expires in 1 hour. Re-run this script to get a new one.');
}

// Main execution
async function main() {
  const token = await getFirebaseToken();
  
  if (!token) {
    console.log('❌ Could not get authentication token. Please check credentials.');
    return;
  }
  
  await testOrdersAPI(token);
  await generateCurlCommands(token);
}

main().catch(console.error);
