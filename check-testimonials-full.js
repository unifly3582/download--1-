/**
 * Check Full Testimonials API Response
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function checkFullResponse() {
  try {
    const response = await fetch(`${BASE_URL}/api/customer/testimonials?limit=10`);
    const data = await response.json();
    
    console.log('📊 Full API Response:\n');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n\n📋 Testimonials List:\n');
    console.log('='.repeat(80));
    
    data.data.forEach((t, index) => {
      console.log(`\n${index + 1}. ${t.customerName} (${t.customerLocation})`);
      console.log(`   Video ID: ${t.youtubeVideoId}`);
      console.log(`   Display Order: ${t.displayOrder}`);
      if (t.title) console.log(`   Title: ${t.title}`);
      if (t.description) console.log(`   Description: ${t.description}`);
      console.log(`   Embed URL: ${t.embedUrl}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`\nTotal: ${data.count} testimonials`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkFullResponse();
