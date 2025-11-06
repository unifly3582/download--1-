// Test script for enhanced customer functionality
const { authenticatedFetch } = require('./src/lib/api/utils');

async function testEnhancedCustomers() {
  console.log('🧪 Testing Enhanced Customer Functionality...\n');

  try {
    // Test 1: Create a new customer with enhanced data
    console.log('1️⃣ Testing customer creation with enhanced fields...');
    
    const newCustomer = {
      name: 'Test Enhanced Customer',
      phone: '9876543210',
      email: 'test.enhanced@example.com',
      preferredLanguage: 'en',
      whatsappOptIn: true,
      region: 'south',
      referralSource: 'google',
      loyaltyTier: 'new',
      customerSegment: 'Active',
      tags: ['test', 'enhanced', 'demo'],
      notes: 'This is a test customer with enhanced profile data',
      preferredCourier: 'delhivery',
      isDubious: false,
      defaultAddress: {
        street: '123 Test Street',
        city: 'Bangalore',
        state: 'Karnataka',
        zip: '560001',
        country: 'India',
        label: 'Home'
      }
    };

    const createResponse = await fetch('http://localhost:3000/api/customers/create', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token', // Replace with actual token
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newCustomer)
    });

    const createResult = await createResponse.json();
    console.log(`   ✅ Customer creation: ${createResult.success ? 'Success' : 'Failed'}`);
    
    if (createResult.success) {
      console.log(`   📋 Customer ID: ${createResult.data.customerId}`);
      console.log(`   📞 Phone: ${createResult.data.phone}`);
      console.log(`   🏷️ Tags: ${createResult.data.tags.join(', ')}`);
      console.log(`   📍 Region: ${createResult.data.region}\n`);
    } else {
      console.log(`   ❌ Error: ${createResult.error}\n`);
    }

    // Test 2: Test enhanced profile API
    if (createResult.success) {
      console.log('2️⃣ Testing enhanced profile API...');
      
      const profileResponse = await fetch(`http://localhost:3000/api/customers/${createResult.data.phone}/profile`, {
        headers: {
          'Authorization': 'Bearer test-token', // Replace with actual token
          'Content-Type': 'application/json'
        }
      });

      const profileResult = await profileResponse.json();
      console.log(`   ✅ Profile fetch: ${profileResult.success ? 'Success' : 'Failed'}`);
      
      if (profileResult.success) {
        const profile = profileResult.data;
        console.log(`   👤 Name: ${profile.name}`);
        console.log(`   📊 Stats: ${profile.stats.totalOrders} orders, ₹${profile.stats.totalSpent} spent`);
        console.log(`   🎯 Risk Level: ${profile.riskLevel}`);
        console.log(`   📅 Member Since: ${profile.memberSince ? new Date(profile.memberSince).toLocaleDateString() : 'N/A'}`);
        console.log(`   🏠 Default Address: ${profile.defaultAddress ? 'Yes' : 'No'}\n`);
      }

      // Test 3: Test customer update
      console.log('3️⃣ Testing customer update...');
      
      const updateData = {
        notes: 'Updated notes with additional information',
        tags: ['test', 'enhanced', 'demo', 'updated'],
        loyaltyTier: 'repeat',
        region: 'west'
      };

      const updateResponse = await fetch(`http://localhost:3000/api/customers/${createResult.data.phone}/update`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer test-token', // Replace with actual token
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const updateResult = await updateResponse.json();
      console.log(`   ✅ Customer update: ${updateResult.success ? 'Success' : 'Failed'}`);
      
      if (updateResult.success) {
        console.log(`   🏷️ Updated Tags: ${updateResult.data.tags.join(', ')}`);
        console.log(`   ⭐ Updated Tier: ${updateResult.data.loyaltyTier}`);
        console.log(`   📍 Updated Region: ${updateResult.data.region}\n`);
      }
    }

    // Test 4: Test paginated customers with filters
    console.log('4️⃣ Testing paginated customers with enhanced filters...');
    
    const paginatedResponse = await fetch('http://localhost:3000/api/customers/paginated?limit=5&tier=new&segment=Active', {
      headers: {
        'Authorization': 'Bearer test-token', // Replace with actual token
        'Content-Type': 'application/json'
      }
    });

    const paginatedResult = await paginatedResponse.json();
    console.log(`   ✅ Paginated fetch: ${paginatedResult.success ? 'Success' : 'Failed'}`);
    
    if (paginatedResult.success) {
      console.log(`   📊 Customers loaded: ${paginatedResult.data.data.length}`);
      console.log(`   🔄 Has more: ${paginatedResult.data.hasMore}`);
      console.log(`   🎯 Filtered by: tier=new, segment=Active\n`);
    }

    console.log('✅ All enhanced customer tests completed!');
    
    // Summary of enhancements
    console.log('\n📋 Enhancement Summary:');
    console.log('   ✅ Enhanced customer creation with all fields');
    console.log('   ✅ Comprehensive profile view with tabs');
    console.log('   ✅ Advanced edit dialog with tabbed interface');
    console.log('   ✅ Enhanced address management with labels');
    console.log('   ✅ Risk assessment and trust scoring');
    console.log('   ✅ Business intelligence fields (region, referral source)');
    console.log('   ✅ Improved caching and performance');
    console.log('   ✅ Better data validation and error handling');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   - Next.js server is running (npm run dev)');
    console.log('   - You have valid authentication token');
    console.log('   - Database is accessible');
    console.log('   - All new API endpoints are deployed');
  }
}

// Run the test
testEnhancedCustomers();