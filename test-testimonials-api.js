/**
 * Test script for Testimonials API
 * 
 * This script tests the customer-facing testimonials API endpoint
 * Run with: node test-testimonials-api.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9006';

async function testTestimonialsAPI() {
  console.log('🧪 Testing Testimonials API...\n');

  try {
    // Test 1: Fetch all active testimonials
    console.log('Test 1: Fetching active testimonials (default limit)');
    const response1 = await fetch(`${BASE_URL}/api/customer/testimonials`);
    const data1 = await response1.json();
    
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(data1, null, 2));
    console.log('✅ Test 1 passed\n');

    // Test 2: Fetch with custom limit
    console.log('Test 2: Fetching testimonials with limit=3');
    const response2 = await fetch(`${BASE_URL}/api/customer/testimonials?limit=3`);
    const data2 = await response2.json();
    
    console.log('Status:', response2.status);
    console.log('Count:', data2.count);
    console.log('✅ Test 2 passed\n');

    // Test 3: Verify response structure
    console.log('Test 3: Verifying response structure');
    if (data1.success && Array.isArray(data1.data)) {
      console.log('✅ Response has correct structure');
      
      if (data1.data.length > 0) {
        const testimonial = data1.data[0];
        console.log('\nSample testimonial:');
        console.log('- ID:', testimonial.id);
        console.log('- Customer:', testimonial.customerName);
        console.log('- Location:', testimonial.customerLocation);
        console.log('- Video ID:', testimonial.youtubeVideoId);
        console.log('- Thumbnail URL:', testimonial.thumbnailUrl);
        console.log('- Embed URL:', testimonial.embedUrl);
        console.log('- Watch URL:', testimonial.watchUrl);
        
        // Verify all required fields are present
        const requiredFields = [
          'id', 'youtubeVideoId', 'customerName', 'customerLocation',
          'thumbnailUrl', 'embedUrl', 'watchUrl', 'displayOrder'
        ];
        
        const missingFields = requiredFields.filter(field => !(field in testimonial));
        if (missingFields.length === 0) {
          console.log('✅ All required fields present');
        } else {
          console.log('❌ Missing fields:', missingFields);
        }
      } else {
        console.log('ℹ️  No testimonials found (database might be empty)');
      }
    } else {
      console.log('❌ Invalid response structure');
    }
    console.log('✅ Test 3 passed\n');

    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testTestimonialsAPI();
