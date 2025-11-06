#!/usr/bin/env node

/**
 * Test script for customer APIs
 * Run: node scripts/test-customer-apis.js
 */

require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Test configuration
const tests = [
  {
    name: 'Get Products List',
    method: 'GET',
    url: `${BASE_URL}/products?limit=5`,
    expectedFields: ['success', 'data', 'pagination']
  },
  {
    name: 'Get Featured Products',
    method: 'GET',
    url: `${BASE_URL}/products/customer/featured?limit=3`,
    expectedFields: ['success', 'data', 'total']
  },
  {
    name: 'Get Product Categories',
    method: 'GET',
    url: `${BASE_URL}/products/customer/categories`,
    expectedFields: ['success', 'data', 'total']
  },
  {
    name: 'Search Products',
    method: 'GET',
    url: `${BASE_URL}/products/customer/search?q=test&limit=3`,
    expectedFields: ['success', 'data', 'query', 'total']
  },
  {
    name: 'Get Single Product (if exists)',
    method: 'GET',
    url: `${BASE_URL}/products/PROD_123`,
    expectedFields: ['success'],
    allowNotFound: true
  },
  {
    name: 'Validate Coupon',
    method: 'POST',
    url: `${BASE_URL}/customer/coupons/validate`,
    body: {
      couponCode: 'TEST10',
      customerId: 'CUS_TEST',
      customerPhone: '+919999999999',
      orderValue: 10000,
      items: [{ productId: 'PROD_123', quantity: 1, unitPrice: 10000 }]
    },
    expectedFields: ['success'],
    allowError: true
  },
  {
    name: 'Get Customer Profile',
    method: 'POST',
    url: `${BASE_URL}/customer/profile`,
    body: {
      action: 'get',
      phone: '+919999999999'
    },
    expectedFields: ['success'],
    allowNotFound: true
  },
  {
    name: 'Pincode Lookup',
    method: 'GET',
    url: `${BASE_URL}/pincode/400001`,
    expectedFields: ['success'],
    allowError: true
  }
];

// Test runner
async function runTests() {
  console.log('🧪 Testing Customer APIs...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'customer-api-test'
        }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      const data = await response.json();

      // Check response status
      if (!response.ok && !test.allowError && !test.allowNotFound) {
        throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      }

      if (response.status === 404 && test.allowNotFound) {
        console.log(`   ⚠️  Not Found (expected): ${test.url}`);
        passed++;
        continue;
      }

      if (!response.ok && test.allowError) {
        console.log(`   ⚠️  Error (allowed): ${data.error || 'Unknown error'}`);
        passed++;
        continue;
      }

      // Check expected fields
      const missingFields = test.expectedFields.filter(field => !(field in data));
      if (missingFields.length > 0) {
        throw new Error(`Missing fields: ${missingFields.join(', ')}`);
      }

      // Additional checks
      if (data.success === false && !test.allowError) {
        throw new Error(`API returned error: ${data.error}`);
      }

      if (data.data && Array.isArray(data.data)) {
        console.log(`   ✅ Success: Found ${data.data.length} items`);
      } else if (data.data) {
        console.log(`   ✅ Success: Data received`);
      } else {
        console.log(`   ✅ Success: Response received`);
      }

      passed++;

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      failed++;
    }

    console.log(''); // Empty line for readability
  }

  // Summary
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your customer APIs are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check your API endpoints and server status.');
  }

  return failed === 0;
}

// Performance test
async function performanceTest() {
  console.log('\n⚡ Running Performance Test...\n');

  const testUrl = `${BASE_URL}/products/customer/featured?limit=5`;
  const iterations = 10;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    
    try {
      const response = await fetch(testUrl);
      await response.json();
      const end = Date.now();
      times.push(end - start);
      process.stdout.write(`${i + 1}. ${end - start}ms `);
    } catch (error) {
      process.stdout.write(`${i + 1}. ERROR `);
    }
  }

  console.log('\n');

  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`📊 Performance Results:`);
    console.log(`   Average: ${avg.toFixed(2)}ms`);
    console.log(`   Min: ${min}ms`);
    console.log(`   Max: ${max}ms`);

    if (avg < 500) {
      console.log(`   ✅ Performance: Excellent (< 500ms)`);
    } else if (avg < 1000) {
      console.log(`   ⚠️  Performance: Good (< 1s)`);
    } else {
      console.log(`   ❌ Performance: Needs improvement (> 1s)`);
    }
  }
}

// CORS test
async function corsTest() {
  console.log('\n🌐 Testing CORS Headers...\n');

  try {
    const response = await fetch(`${BASE_URL}/products/customer/featured`, {
      method: 'OPTIONS'
    });

    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    };

    console.log('CORS Headers:');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      if (value) {
        console.log(`   ✅ ${key}: ${value}`);
      } else {
        console.log(`   ❌ ${key}: Missing`);
      }
    });

    const hasCors = Object.values(corsHeaders).some(value => value !== null);
    if (hasCors) {
      console.log('\n✅ CORS is properly configured');
    } else {
      console.log('\n❌ CORS headers are missing');
    }

  } catch (error) {
    console.log(`❌ CORS test failed: ${error.message}`);
  }
}

// Main execution
async function main() {
  console.log('🚀 Customer API Test Suite\n');
  console.log('This script tests all customer-facing APIs to ensure they work correctly.\n');

  // Check if server is running
  try {
    const healthCheck = await fetch(`${BASE_URL}/products?limit=1`);
    if (!healthCheck.ok) {
      throw new Error('Server not responding correctly');
    }
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log(`   Make sure your Next.js server is running on ${BASE_URL}`);
    console.log('   Run: npm run dev\n');
    process.exit(1);
  }

  // Run tests
  const success = await runTests();
  await performanceTest();
  await corsTest();

  console.log('\n📝 Next Steps:');
  console.log('• Review any failed tests and fix issues');
  console.log('• Check server logs for detailed error information');
  console.log('• Test APIs with real data in your application');
  console.log('• Monitor API performance in production');

  process.exit(success ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the tests
main();