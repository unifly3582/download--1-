/**
 * Test the customer API for phone 9999968191
 */

const fetch = require('node-fetch');

async function testCustomerAPI() {
  const phone = '9999968191';
  const encodedPhone = encodeURIComponent(`+91${phone}`);
  const url = `http://localhost:9006/api/customers/${encodedPhone}`;
  
  console.log('\n=== Testing Customer API ===\n');
  console.log(`Phone: ${phone}`);
  console.log(`Encoded: ${encodedPhone}`);
  console.log(`URL: ${url}\n`);
  
  try {
    console.log('Making request...');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add any auth headers if needed
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}\n`);
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ SUCCESS!\n');
      console.log('Customer Data:');
      console.log('-------------');
      console.log(`Customer ID: ${data.data.customerId}`);
      console.log(`Name: ${data.data.name}`);
      console.log(`Phone: ${data.data.phone}`);
      console.log(`Email: ${data.data.email || 'N/A'}`);
      console.log(`Loyalty Tier: ${data.data.loyaltyTier}`);
      console.log(`Total Orders: ${data.data.totalOrders}`);
      
      if (data.data.defaultAddress) {
        console.log('\nDefault Address:');
        console.log(`  ${data.data.defaultAddress.street}`);
        console.log(`  ${data.data.defaultAddress.city}, ${data.data.defaultAddress.state} ${data.data.defaultAddress.zip}`);
      }
      
      if (data.data.orders && data.data.orders.length > 0) {
        console.log(`\nOrders: ${data.data.orders.length} found`);
      }
    } else {
      console.log('❌ FAILED\n');
      console.log('Error:', data.error);
    }
    
    console.log('\n=== Full Response ===');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testCustomerAPI()
  .then(() => {
    console.log('\n✅ Test complete\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
