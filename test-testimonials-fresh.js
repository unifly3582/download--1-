const fetch = require('node-fetch');

async function testTestimonials() {
  console.log('\n=== TESTING TESTIMONIALS API ===\n');
  
  const baseUrl = 'http://localhost:9006';
  
  try {
    // Test customer API
    console.log('1. Testing Customer API (Public)...');
    const customerResponse = await fetch(`${baseUrl}/api/customer/testimonials?limit=20`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    
    const customerData = await customerResponse.json();
    console.log(`   Status: ${customerResponse.status}`);
    console.log(`   Cache-Control: ${customerResponse.headers.get('cache-control')}`);
    console.log(`   Count: ${customerData.count || 0}`);
    
    if (customerData.data && customerData.data.length > 0) {
      console.log('\n   Testimonials:');
      customerData.data.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.customerName} - ${t.customerLocation}`);
        console.log(`      Video: ${t.youtubeVideoId}`);
        console.log(`      Order: ${t.displayOrder}`);
      });
    }
    
    console.log('\n2. Testing Admin API...');
    const adminResponse = await fetch(`${baseUrl}/api/admin/testimonials`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    
    const adminData = await adminResponse.json();
    console.log(`   Status: ${adminResponse.status}`);
    console.log(`   Cache-Control: ${adminResponse.headers.get('cache-control')}`);
    console.log(`   Count: ${adminData.data?.length || 0}`);
    
    if (adminData.data && adminData.data.length > 0) {
      console.log('\n   All Testimonials:');
      adminData.data.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.customerName} - ${t.customerLocation}`);
        console.log(`      Video: ${t.youtubeVideoId}`);
        console.log(`      Active: ${t.isActive}`);
        console.log(`      Order: ${t.displayOrder}`);
      });
    }
    
    console.log('\n✅ Test complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTestimonials();
