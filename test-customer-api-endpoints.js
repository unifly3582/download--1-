// Test script to verify customer API endpoints are working
require('dotenv').config({ path: '.env.local' });

async function testCustomerAPIs() {
  console.log('🔍 Testing Customer API Endpoints...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test 1: General customer search API
    console.log('📋 Test 1: General customer search API...');
    
    // Test phone search
    const phoneSearchResponse = await fetch(`${baseUrl}/api/customers?search=+916005270078`);
    const phoneSearchData = await phoneSearchResponse.json();
    console.log(`Phone search status: ${phoneSearchResponse.status}`);
    console.log(`Phone search results: ${phoneSearchData.success ? phoneSearchData.data.length : 'FAILED'} customers`);
    
    // Test name search
    const nameSearchResponse = await fetch(`${baseUrl}/api/customers?search=Riyaz`);
    const nameSearchData = await nameSearchResponse.json();
    console.log(`Name search status: ${nameSearchResponse.status}`);
    console.log(`Name search results: ${nameSearchData.success ? nameSearchData.data.length : 'FAILED'} customers`);
    
    // Test 2: Phone-specific customer API
    console.log('\n📱 Test 2: Phone-specific customer API...');
    const phoneApiResponse = await fetch(`${baseUrl}/api/customers/+916005270078`);
    const phoneApiData = await phoneApiResponse.json();
    console.log(`Phone API status: ${phoneApiResponse.status}`);
    console.log(`Phone API result: ${phoneApiData.success ? 'FOUND' : 'NOT FOUND'}`);
    if (phoneApiData.success) {
      console.log(`Customer: ${phoneApiData.data.name} (${phoneApiData.data.customerId})`);
      console.log(`Orders: ${phoneApiData.data.orders?.length || 0}`);
    }
    
    // Test 3: List all customers (no search)
    console.log('\n📊 Test 3: List all customers...');
    const allCustomersResponse = await fetch(`${baseUrl}/api/customers`);
    const allCustomersData = await allCustomersResponse.json();
    console.log(`All customers status: ${allCustomersResponse.status}`);
    console.log(`All customers count: ${allCustomersData.success ? allCustomersData.data.length : 'FAILED'}`);
    
    console.log('\n✅ API endpoint tests completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n💡 Make sure your Next.js development server is running on localhost:3000');
    console.log('Run: npm run dev');
  }
}

// Run the test
testCustomerAPIs()
  .then(() => {
    console.log('\n🎉 All tests completed!');
  })
  .catch(error => {
    console.error('💥 Test script failed:', error);
  });