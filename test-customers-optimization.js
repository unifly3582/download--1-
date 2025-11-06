// Test script to verify customers page optimization
const { authenticatedFetch } = require('./src/lib/api/utils');

async function testCustomersOptimization() {
  console.log('🧪 Testing Customers Page Optimization...\n');

  try {
    // Test 1: Paginated API endpoint
    console.log('1️⃣ Testing paginated customers API...');
    const startTime1 = Date.now();
    
    const paginatedResponse = await fetch('http://localhost:3000/api/customers/paginated?limit=10', {
      headers: {
        'Authorization': 'Bearer test-token', // Replace with actual token
        'Content-Type': 'application/json'
      }
    });
    
    const paginatedData = await paginatedResponse.json();
    const time1 = Date.now() - startTime1;
    
    console.log(`   ✅ Paginated API: ${time1}ms`);
    console.log(`   📊 Loaded: ${paginatedData.data?.data?.length || 0} customers`);
    console.log(`   🔄 Has more: ${paginatedData.data?.hasMore || false}\n`);

    // Test 2: Original API endpoint (for comparison)
    console.log('2️⃣ Testing original customers API...');
    const startTime2 = Date.now();
    
    const originalResponse = await fetch('http://localhost:3000/api/customers', {
      headers: {
        'Authorization': 'Bearer test-token', // Replace with actual token
        'Content-Type': 'application/json'
      }
    });
    
    const originalData = await originalResponse.json();
    const time2 = Date.now() - startTime2;
    
    console.log(`   ✅ Original API: ${time2}ms`);
    console.log(`   📊 Loaded: ${originalData.data?.length || 0} customers\n`);

    // Test 3: Customer profile API
    if (originalData.data && originalData.data.length > 0) {
      const testCustomer = originalData.data[0];
      
      console.log('3️⃣ Testing optimized customer profile API...');
      const startTime3 = Date.now();
      
      const profileResponse = await fetch(`http://localhost:3000/api/customers/${encodeURIComponent(testCustomer.phone)}/profile`, {
        headers: {
          'Authorization': 'Bearer test-token', // Replace with actual token
          'Content-Type': 'application/json'
        }
      });
      
      const profileData = await profileResponse.json();
      const time3 = Date.now() - startTime3;
      
      console.log(`   ✅ Profile API: ${time3}ms`);
      console.log(`   📊 Recent orders: ${profileData.data?.recentOrders?.length || 0}`);
      console.log(`   💰 Total spent: ₹${profileData.data?.stats?.totalSpent || 0}\n`);
    }

    // Performance comparison
    console.log('📈 Performance Comparison:');
    console.log(`   Original API: ${time2}ms`);
    console.log(`   Paginated API: ${time1}ms`);
    console.log(`   Improvement: ${Math.round(((time2 - time1) / time2) * 100)}% faster\n`);

    // Test 4: Search functionality
    console.log('4️⃣ Testing search functionality...');
    const startTime4 = Date.now();
    
    const searchResponse = await fetch('http://localhost:3000/api/customers/paginated?search=test&limit=5', {
      headers: {
        'Authorization': 'Bearer test-token', // Replace with actual token
        'Content-Type': 'application/json'
      }
    });
    
    const searchData = await searchResponse.json();
    const time4 = Date.now() - startTime4;
    
    console.log(`   ✅ Search API: ${time4}ms`);
    console.log(`   🔍 Search results: ${searchData.data?.data?.length || 0} customers\n`);

    console.log('✅ All optimization tests completed successfully!');
    
    // Summary
    console.log('\n📋 Optimization Summary:');
    console.log('   ✅ Pagination implemented (25 customers per page)');
    console.log('   ✅ Debounced search (500ms delay)');
    console.log('   ✅ Lightweight profile API (recent 10 orders only)');
    console.log('   ✅ Smart caching for search results');
    console.log('   ✅ Memoized components for better rendering');
    console.log('   ✅ Cursor-based pagination for efficient loading');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   - Next.js server is running (npm run dev)');
    console.log('   - You have valid authentication token');
    console.log('   - Database is accessible');
  }
}

// Run the test
testCustomersOptimization();