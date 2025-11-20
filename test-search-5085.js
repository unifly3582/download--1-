// Test the search API for order 5085
// Run this after starting your dev server

const testSearch = async () => {
  console.log('🔍 Testing search for order 5085...\n');

  try {
    // Test the search API endpoint
    const url = 'http://localhost:3000/api/orders/search?searchType=orderId&query=5085&status=all';
    console.log('Testing URL:', url);
    console.log('Note: Make sure your dev server is running and you are logged in as admin\n');

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        // Add your auth token here if needed
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);

    const data = await response.json();
    console.log('\nResponse data:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success && data.data && data.data.length > 0) {
      console.log('\n✅ Order found!');
      console.log('Order ID:', data.data[0].orderId);
      console.log('Customer:', data.data[0].customerInfo?.name);
      console.log('Status:', data.data[0].internalStatus);
      console.log('Has Action Log:', !!data.data[0].shipmentInfo?.actionLog);
    } else {
      console.log('\n❌ Order not found');
      console.log('Possible reasons:');
      console.log('1. Order 5085 does not exist');
      console.log('2. Authentication required (not logged in)');
      console.log('3. Order ID format is different');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testSearch();
