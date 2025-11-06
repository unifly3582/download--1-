// Test if the API key works for basic authentication
require('dotenv').config({ path: '.env.local' });

async function testApiKey() {
  console.log('🔑 Testing API Key Authentication...\n');

  const apiKey = "cbb7750d2371ea42ecacd25512d525da2c769dc9";
  
  console.log(`Using API Key: ${apiKey.substring(0, 8)}...`);

  try {
    // Test with a simple endpoint that should work with machine auth
    const response = await fetch('http://localhost:9006/api/orders', {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Key authentication successful!');
      console.log(`📋 Found ${result.data?.length || 0} orders`);
    } else {
      const errorResult = await response.json();
      console.log('❌ API Key authentication failed');
      console.log('Error:', errorResult);
      
      if (response.status === 401) {
        console.log('\n💡 Possible issues:');
        console.log('1. API key is incorrect');
        console.log('2. API key not configured in server');
        console.log('3. Endpoint requires different role');
      }
    }

  } catch (error) {
    console.error('❌ Connection Error:', error.message);
  }
}

testApiKey().catch(console.error);