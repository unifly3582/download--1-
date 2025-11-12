// Test order creation with empty name via API
const https = require('https');
const FIREBASE_API_KEY = 'AIzaSyBVX5nnclU8xrgIXtaoSr95bYFyRe3X_dE';

async function getToken() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'uniflyinsect@gmail.com',
      password: '12345678',
      returnSecureToken: true
    });
    
    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.idToken);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testOrderWithEmptyName(token) {
  return new Promise((resolve) => {
    const orderData = JSON.stringify({
      orderSource: "admin_form",
      customerInfo: {
        name: "",  // Empty name should be rejected
        phone: "9876543210",
        email: "test@example.com"
      },
      shippingAddress: {
        street: "123 Test St",
        city: "Mumbai",
        state: "Maharashtra",
        zip: "400001",
        country: "India"
      },
      items: [{
        productId: "D2goAtuQSOB8WylrbOPe",
        variationId: null,
        productName: "Test Product",
        quantity: 1,
        unitPrice: 100,
        sku: "TEST-SKU"
      }],
      paymentInfo: {
        method: "COD"
      }
    });

    const options = {
      hostname: 'localhost',
      port: 9006,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(orderData)
      }
    };

    const req = require('http').request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(data) });
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    req.write(orderData);
    req.end();
  });
}

async function main() {
  console.log('🔑 Getting Firebase token...');
  const token = await getToken();
  
  console.log('🧪 Testing order creation with empty name...');
  const result = await testOrderWithEmptyName(token);
  
  if (result.error) {
    console.log('❌ Connection error:', result.error);
    console.log('💡 Make sure your dev server is running on port 9006');
    return;
  }
  
  console.log(`📊 Status: ${result.status}`);
  console.log('📄 Response:', JSON.stringify(result.body, null, 2));
  
  if (result.status === 400 && result.body.error === 'Invalid order data provided.') {
    console.log('✅ SUCCESS: Empty name was properly rejected!');
    if (result.body.details?.fieldErrors?.customerInfo) {
      console.log('🔍 Name validation error:', result.body.details.fieldErrors.customerInfo);
    }
  } else if (result.status === 201) {
    console.log('❌ FAILED: Order was created despite empty name!');
  } else {
    console.log('❓ Unexpected response');
  }
}

main().catch(console.error);