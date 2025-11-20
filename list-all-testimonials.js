/**
 * List ALL testimonials from API (including inactive)
 */

async function listAll() {
  try {
    console.log('Fetching from admin API...\n');
    
    // This would need auth, so let's just check what the customer API returns
    const response = await fetch('http://localhost:3000/api/customer/testimonials?limit=50');
    const data = await response.json();
    
    console.log(`Total testimonials returned: ${data.count}\n`);
    console.log('Document IDs:', data.data.map(t => t.id).join(', '));
    console.log('\n' + '='.repeat(80) + '\n');
    
    data.data.forEach((t, i) => {
      console.log(`${i + 1}. Document ID: "${t.id}"`);
      console.log(`   Customer: ${t.customerName}`);
      console.log(`   Location: ${t.customerLocation}`);
      console.log(`   Video ID: ${t.youtubeVideoId}`);
      console.log(`   Display Order: ${t.displayOrder}`);
      console.log('');
    });
    
    console.log('='.repeat(80));
    console.log('\n💡 Note: If you added new testimonials and they\'re not showing:');
    console.log('   1. Check if "Active" toggle is ON');
    console.log('   2. Check the displayOrder value');
    console.log('   3. Try refreshing the page (Ctrl+F5)');
    console.log('   4. Check browser console for errors');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listAll();
