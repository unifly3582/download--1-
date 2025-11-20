/**
 * Check Testimonials Database via API
 * This uses the Next.js API which has proper Firebase access
 */

async function checkDatabase() {
  try {
    console.log('🔍 Checking testimonials database via API...\n');
    console.log('='.repeat(80));
    
    // Fetch from customer API (public, shows only active)
    console.log('\n📡 Fetching from PUBLIC API (customer-facing):');
    console.log('   GET /api/customer/testimonials?limit=50\n');
    
    const customerResponse = await fetch('http://localhost:3000/api/customer/testimonials?limit=50');
    const customerData = await customerResponse.json();
    
    console.log(`   Status: ${customerResponse.status}`);
    console.log(`   Success: ${customerData.success}`);
    console.log(`   Count: ${customerData.count}`);
    
    if (customerData.success && customerData.count > 0) {
      console.log('\n   ✅ Active Testimonials (showing on website):');
      customerData.data.forEach((t, i) => {
        console.log(`\n   ${i + 1}. Document ID: "${t.id}"`);
        console.log(`      Customer: ${t.customerName}`);
        console.log(`      Location: ${t.customerLocation}`);
        console.log(`      Video ID: ${t.youtubeVideoId}`);
        console.log(`      Display Order: ${t.displayOrder}`);
        if (t.createdAt) console.log(`      Created: ${t.createdAt}`);
      });
    } else {
      console.log('\n   ❌ No active testimonials found');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 DIAGNOSIS:\n');
    
    if (customerData.count === 6) {
      console.log('   ⚠️  Only showing 6 testimonials (IDs: 1, 2, 3, 4, 5, 6)');
      console.log('   These appear to be demo/seed data.\n');
      console.log('   If you added NEW testimonials and they\'re not showing, check:\n');
      console.log('   1. ❓ Is the "Active" toggle turned ON?');
      console.log('      → Go to http://localhost:3000/testimonials');
      console.log('      → Find your testimonial');
      console.log('      → Make sure the toggle switch is GREEN/ON\n');
      console.log('   2. ❓ Did the save operation succeed?');
      console.log('      → Check browser console for errors');
      console.log('      → Look for success message after clicking Save\n');
      console.log('   3. ❓ Is there a Firestore index issue?');
      console.log('      → Check server logs for "index not ready" warnings');
      console.log('      → May need to create composite index in Firebase Console\n');
    } else if (customerData.count > 6) {
      console.log(`   ✅ Found ${customerData.count} testimonials!`);
      console.log('   Your new testimonials are showing correctly.\n');
    } else if (customerData.count < 6) {
      console.log(`   ⚠️  Only ${customerData.count} testimonials found.`);
      console.log('   Some testimonials may have been deactivated.\n');
    }
    
    console.log('='.repeat(80));
    console.log('\n🔧 HOW TO CHECK IN FIREBASE CONSOLE:\n');
    console.log('   1. Go to: https://console.firebase.google.com');
    console.log('   2. Select your project');
    console.log('   3. Click "Firestore Database" in left menu');
    console.log('   4. Find "testimonials" collection');
    console.log('   5. Look at all documents and their "isActive" field');
    console.log('   6. Check if your new testimonials are there\n');
    
    console.log('='.repeat(80));
    console.log('\n📝 TO ADD NEW TESTIMONIALS:\n');
    console.log('   1. Go to: http://localhost:3000/testimonials');
    console.log('   2. Click "Add Testimonial" button');
    console.log('   3. Fill in:');
    console.log('      - YouTube Video ID (11 characters, e.g., "dQw4w9WgXcQ")');
    console.log('      - Customer Name');
    console.log('      - Customer Location');
    console.log('      - Title (optional)');
    console.log('      - Description (optional)');
    console.log('      - Display Order (0 = first, 1 = second, etc.)');
    console.log('      - Active toggle: ON ✅');
    console.log('   4. Click "Create Testimonial"');
    console.log('   5. Refresh this script to see if it appears\n');
    
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n🔧 Make sure:');
    console.error('   1. Dev server is running (npm run dev)');
    console.error('   2. Server is accessible at http://localhost:3000');
  }
}

checkDatabase();
