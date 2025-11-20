/**
 * Detailed Testimonials Check
 * Shows exact data structure and helps diagnose issues
 */

async function detailedCheck() {
  try {
    console.log('🔍 DETAILED TESTIMONIALS CHECK\n');
    console.log('='.repeat(80));
    
    // Check customer API
    console.log('\n1️⃣  Checking Customer API (Public - Active Only)');
    console.log('   URL: /api/customer/testimonials?limit=100\n');
    
    const response = await fetch('http://localhost:3000/api/customer/testimonials?limit=100');
    const data = await response.json();
    
    console.log(`   HTTP Status: ${response.status}`);
    console.log(`   API Success: ${data.success}`);
    console.log(`   Total Count: ${data.count}`);
    console.log(`   Data Length: ${data.data?.length || 0}\n`);
    
    if (data.data && data.data.length > 0) {
      console.log('   📋 All Document IDs:');
      data.data.forEach((t, i) => {
        console.log(`      ${i + 1}. "${t.id}" - ${t.customerName} (Order: ${t.displayOrder})`);
      });
      
      console.log('\n   📊 Statistics:');
      console.log(`      - Unique IDs: ${new Set(data.data.map(t => t.id)).size}`);
      console.log(`      - Numeric IDs (1-9): ${data.data.filter(t => /^[0-9]$/.test(t.id)).length}`);
      console.log(`      - Auto-generated IDs: ${data.data.filter(t => t.id.length > 10).length}`);
      
      console.log('\n   🎬 Video IDs:');
      const videoIds = [...new Set(data.data.map(t => t.youtubeVideoId))];
      videoIds.forEach(vid => {
        const count = data.data.filter(t => t.youtubeVideoId === vid).length;
        console.log(`      - ${vid}: ${count} testimonial(s)`);
      });
      
      console.log('\n   📅 Creation Dates:');
      data.data.forEach((t, i) => {
        if (t.createdAt) {
          console.log(`      ${i + 1}. ${t.id}: ${t.createdAt}`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n2️⃣  Testing API Endpoints\n');
    
    // Test if we can reach admin API (will fail without auth, but we can see the error)
    try {
      const adminResponse = await fetch('http://localhost:3000/api/admin/testimonials');
      console.log(`   Admin API Status: ${adminResponse.status}`);
      if (adminResponse.status === 401 || adminResponse.status === 403) {
        console.log('   ✅ Admin API exists (requires authentication)');
      } else if (adminResponse.status === 200) {
        const adminData = await adminResponse.json();
        console.log(`   ⚠️  Admin API accessible without auth! Count: ${adminData.data?.length || 0}`);
      }
    } catch (e) {
      console.log(`   ❌ Admin API error: ${e.message}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n3️⃣  DIAGNOSIS\n');
    
    if (data.count === 6 && data.data.every(t => /^[1-6]$/.test(t.id))) {
      console.log('   ⚠️  ISSUE DETECTED: Only demo data present\n');
      console.log('   The 6 testimonials (IDs: 1-6) appear to be seed/demo data.');
      console.log('   Your new testimonials are NOT appearing.\n');
      console.log('   Possible reasons:\n');
      console.log('   ❌ New testimonials were not saved to Firestore');
      console.log('   ❌ New testimonials have isActive = false');
      console.log('   ❌ Browser/network error prevented save');
      console.log('   ❌ Firestore rules blocking writes\n');
      
      console.log('   🔧 NEXT STEPS:\n');
      console.log('   1. Open browser DevTools (F12)');
      console.log('   2. Go to: http://localhost:3000/testimonials');
      console.log('   3. Click "Add Testimonial"');
      console.log('   4. Fill the form and click "Create Testimonial"');
      console.log('   5. Watch the Console tab for errors');
      console.log('   6. Watch the Network tab for API calls');
      console.log('   7. Look for POST to /api/admin/testimonials');
      console.log('   8. Check if response is 200 OK or error\n');
      
    } else if (data.count > 6) {
      console.log('   ✅ SUCCESS: New testimonials detected!\n');
      console.log(`   Found ${data.count - 6} new testimonial(s) beyond the demo data.`);
      console.log('   Your testimonials system is working correctly.\n');
      
    } else if (data.count < 6) {
      console.log('   ⚠️  UNEXPECTED: Less than 6 testimonials\n');
      console.log('   Some demo testimonials may have been deleted or deactivated.\n');
    }
    
    console.log('='.repeat(80));
    console.log('\n4️⃣  FIREBASE CONSOLE CHECK\n');
    console.log('   To see ALL testimonials (including inactive):\n');
    console.log('   1. Go to: https://console.firebase.google.com');
    console.log('   2. Select your project');
    console.log('   3. Click "Firestore Database"');
    console.log('   4. Find "testimonials" collection');
    console.log('   5. Count total documents');
    console.log('   6. Check each document\'s "isActive" field\n');
    console.log('   If you see more than 6 documents there, but only 6 here,');
    console.log('   then the extra ones have isActive = false.\n');
    
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack:', error.stack);
  }
}

detailedCheck();
