// Test update dimensions API fix
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

async function testUpdateDimensions(token, orderId) {
  return new Promise((resolve) => {
    const dimensionsData = JSON.stringify({
      weight: 850,
      dimensions: {
        l: 25.5,
        b: 20.3,  // Using 'b' for width (breadth) - this should fix the 400 error
        h: 15.7
      }
    });

    const options = {
      hostname: 'localhost',
      port: 9006,
      path: `/api/orders/${orderId}/update-dimensions`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dimensionsData)
      }
    };

    const req = require('http').request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const responseData = JSON.parse(data);
          resolve({ 
            status: res.statusCode, 
            body: responseData,
            headers: res.headers
          });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, error: e.message });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    req.write(dimensionsData);
    req.end();
  });
}

async function main() {
  console.log('🔑 Getting Firebase token...');
  try {
    const token = await getToken();
    console.log('✅ Token obtained successfully');
    
    // Test with the order ID from the error
    const orderId = 'ORD_2025_D4DF9D86';
    console.log(`\n🧪 Testing dimensions update for order: ${orderId}`);
    console.log('📦 Sending data: { weight: 850, dimensions: { l: 25.5, b: 20.3, h: 15.7 } }');
    
    const result = await testUpdateDimensions(token, orderId);
    
    if (result.error) {
      console.log(`❌ Connection error: ${result.error}`);
      console.log('💡 Make sure your dev server is running on port 9006');
      return;
    }
    
    console.log(`\n📊 Response Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log('✅ SUCCESS! Dimensions updated successfully');
      console.log('📄 Response:', JSON.stringify(result.body, null, 2));
    } else if (result.status === 400) {
      console.log('❌ Still getting 400 error');
      console.log('📄 Error details:', JSON.stringify(result.body, null, 2));
      
      if (result.body.details) {
        console.log('\n🔍 Validation errors:');
        const details = result.body.details;
        if (details.fieldErrors) {
          Object.entries(details.fieldErrors).forEach(([field, errors]) => {
            console.log(`   ${field}: ${errors.join(', ')}`);
          });
        }
      }
    } else if (result.status === 404) {
      console.log('❌ Order not found');
      console.log('💡 The order might not exist or might have a different ID format');
    } else {
      console.log(`❓ Unexpected status: ${result.status}`);
      console.log('📄 Response:', JSON.stringify(result.body, null, 2));
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

main();