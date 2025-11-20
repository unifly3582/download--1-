/**
 * Check API Raw Response
 */

async function checkAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/customer/testimonials?limit=20');
    const data = await response.json();
    
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n\nTestimonials found:', data.count);
    
    if (data.data && data.data.length > 0) {
      console.log('\nFirst testimonial:');
      console.log('- ID:', data.data[0].id);
      console.log('- Customer:', data.data[0].customerName);
      console.log('- Location:', data.data[0].customerLocation);
      console.log('- Video ID:', data.data[0].youtubeVideoId);
      
      console.log('\n\nAll IDs:', data.data.map(t => t.id).join(', '));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAPI();
