// Test new numeric-only order ID format
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

async function createTestOrder(token, orderNum) {
  return new Promise((resolve) => {
    const orderData = JSON.stringify({
      orderSource: "admin_form",
      customerInfo: {
        name: `Test Customer ${orderNum}`,
        phone: `987654321${orderNum}`,
        email: `test${orderNum}@example.com`
      },
      shippingAddress: {
        street: `${orderNum} Test Street`,
        city: "Mumbai",
        state: "Maharashtra",
        zip: "400001",
        country: "India"
      },
      items: [{
        productId: "D2goAtuQSOB8WylrbOPe",
        variationId: null,
        productName: `Test Product ${orderNum}`,
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
  
  console.log('🧪 Testing new numeric-only order ID format...');
  console.log('📋 Expected format: Numbers only (e.g., 5003, 5004, 5005)');
  console.log('');
  
  // Create 3 test orders to verify sequential numbering
  for (let i = 0; i < 3; i++) {
    console.log(`🎯 Creating order ${i + 1}...`);
    const result = await createTestOrder(token, i);
    
    if (result.error) {
      console.log(`❌ Connection error: ${result.error}`);
      console.log('💡 Make sure your dev server is running on port 9006');
      return;
    }
    
    if (result.status === 201 && result.body.success) {
      const orderId = result.body.orderId;
      console.log(`✅ Order created: ${orderId}`);
      
      // Validate it's numeric only
      const isNumericOnly = /^\d+$/.test(orderId);
      const orderNumber = parseInt(orderId, 10);
      
      if (isNumericOnly) {
        console.log(`   ✅ Format is correct! (Pure number: ${orderNumber})`);
        console.log(`   📊 Numeric ID: ${orderNumber}`);
        
        if (orderNumber > 0) {
          console.log('   ✅ Number is positive');
        } else {
          console.log('   ❌ Number should be positive');
        }
      } else {
        console.log(`   ❌ Format is incorrect - should be numbers only, got: ${orderId}`);
      }
    } else {
      console.log(`   ❌ Failed: Status ${result.status}`);
      console.log(`   📄 Response:`, JSON.stringify(result.body, null, 2));
    }
    
    console.log('');
    // Small delay between orders
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('🎉 Test completed!');
  console.log('📈 New format provides simple, sequential numeric order IDs');
}

main().catch(console.error);