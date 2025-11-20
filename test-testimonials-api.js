/**
 * Test Customer Testimonials API
 * 
 * This script tests the public testimonials API endpoint
 * Run: node test-testimonials-api.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testTestimonialsAPI() {
  console.log('🧪 Testing Customer Testimonials API\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Fetch testimonials with default limit
    console.log('\n📡 Test 1: Fetch testimonials (default limit)');
    console.log(`GET ${BASE_URL}/api/customer/testimonials`);
    
    const response1 = await fetch(`${BASE_URL}/api/customer/testimonials`);
    const data1 = await response1.json();
    
    console.log('Status:', response1.status);
    console.log('Success:', data1.success);
    console.log('Count:', data1.count);
    
    if (data1.success && data1.data.length > 0) {
      console.log('\n✅ Sample Testimonial:');
      const sample = data1.data[0];
      console.log('  ID:', sample.id);
      console.log('  Customer:', sample.customerName);
      console.log('  Location:', sample.customerLocation);
      console.log('  Video ID:', sample.youtubeVideoId);
      console.log('  Display Order:', sample.displayOrder);
      console.log('  Embed URL:', sample.embedUrl);
      console.log('  Thumbnail:', sample.thumbnailUrl);
      if (sample.title) console.log('  Title:', sample.title);
      if (sample.description) console.log('  Description:', sample.description);
    } else if (data1.count === 0) {
      console.log('\n⚠️  No testimonials found');
      console.log('   Add testimonials in admin dashboard: /testimonials');
    }
    
    // Test 2: Fetch with custom limit
    console.log('\n' + '='.repeat(60));
    console.log('\n📡 Test 2: Fetch testimonials (limit=3)');
    console.log(`GET ${BASE_URL}/api/customer/testimonials?limit=3`);
    
    const response2 = await fetch(`${BASE_URL}/api/customer/testimonials?limit=3`);
    const data2 = await response2.json();
    
    console.log('Status:', response2.status);
    console.log('Success:', data2.success);
    console.log('Count:', data2.count);
    console.log('Limit respected:', data2.count <= 3 ? '✅' : '❌');
    
    // Test 3: Check response structure
    console.log('\n' + '='.repeat(60));
    console.log('\n🔍 Test 3: Validate response structure');
    
    if (data1.success && data1.data.length > 0) {
      const testimonial = data1.data[0];
      const requiredFields = [
        'id',
        'youtubeVideoId',
        'customerName',
        'customerLocation',
        'displayOrder',
        'thumbnailUrl',
        'embedUrl',
        'watchUrl'
      ];
      
      const missingFields = requiredFields.filter(field => !(field in testimonial));
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields present');
      } else {
        console.log('❌ Missing fields:', missingFields.join(', '));
      }
      
      // Validate URLs
      console.log('\n🔗 URL Validation:');
      console.log('  Thumbnail URL valid:', testimonial.thumbnailUrl.startsWith('https://img.youtube.com') ? '✅' : '❌');
      console.log('  Embed URL valid:', testimonial.embedUrl.startsWith('https://www.youtube.com/embed/') ? '✅' : '❌');
      console.log('  Watch URL valid:', testimonial.watchUrl.startsWith('https://www.youtube.com/watch?v=') ? '✅' : '❌');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Summary:');
    console.log('  Total testimonials:', data1.count);
    console.log('  API Status:', data1.success ? '✅ Working' : '❌ Failed');
    console.log('  Response Time:', response1.headers.get('x-response-time') || 'N/A');
    
    if (data1.count > 0) {
      console.log('\n✅ API is working correctly!');
      console.log('\n📝 Next Steps:');
      console.log('  1. View example: http://localhost:3000/testimonials-example.html');
      console.log('  2. Use component: import { CustomerTestimonials } from "@/components/customer-testimonials"');
      console.log('  3. Read guide: TESTIMONIALS_QUICK_START.md');
    } else {
      console.log('\n⚠️  No testimonials found');
      console.log('\n📝 To add testimonials:');
      console.log('  1. Go to: http://localhost:3000/testimonials');
      console.log('  2. Click "Add Testimonial"');
      console.log('  3. Enter YouTube Video ID and customer details');
      console.log('  4. Run this test again');
    }
    
  } catch (error) {
    console.error('\n❌ Error testing API:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('  1. Is the server running? (npm run dev)');
    console.error('  2. Is Firebase configured?');
    console.error('  3. Check Firestore rules allow public read');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the test
testTestimonialsAPI();
