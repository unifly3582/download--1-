// Test the improved customer search functionality
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// Simulate the improved search logic
async function testImprovedSearch() {
  console.log('🔍 Testing Improved Customer Search...\n');
  
  try {
    // Get sample data
    const sampleSnapshot = await db.collection('customers').limit(5).get();
    const sampleCustomers = [];
    
    sampleSnapshot.forEach(doc => {
      const data = doc.data();
      sampleCustomers.push({
        id: doc.id,
        name: data.name,
        phone: data.phone,
        customerId: data.customerId || doc.id
      });
    });
    
    console.log('Sample customers:');
    sampleCustomers.forEach(customer => {
      console.log(`  • ${customer.name} (${customer.phone})`);
    });
    
    // Test cases
    const testCases = [
      'Riyaz',           // Partial name (should work)
      'riyaz',           // Lowercase partial name
      'Riyaz tantray',   // Full name (mixed case)
      'riyaz tantray',   // Full name (lowercase)
      'tantray',         // Last name
      'Akeel',           // Another name
      '+916005270078',   // Phone number
      '6005270078',      // Phone without country code
    ];
    
    for (const searchTerm of testCases) {
      console.log(`\n🔍 Testing search: "${searchTerm}"`);
      
      // Test the improved search logic
      const searchLower = searchTerm.toLowerCase();
      let results = [];
      
      // Phone search
      if (/^\+?91?\d{10}$/.test(searchTerm.replace(/\D/g, ''))) {
        const formattedPhone = searchTerm.startsWith('+91') ? searchTerm : `+91${searchTerm.replace(/\D/g, '').slice(-10)}`;
        console.log(`  Phone search for: ${formattedPhone}`);
        
        const phoneQuery = await db.collection('customers').where('phone', '==', formattedPhone).limit(5).get();
        phoneQuery.forEach(doc => {
          const data = doc.data();
          results.push({ name: data.name, phone: data.phone, method: 'phone' });
        });
      } else {
        // Name search with improved logic
        const searchWords = searchLower.split(' ').filter(word => word.length > 0);
        
        if (searchWords.length > 0) {
          const firstWord = searchWords[0];
          const firstWordUpper = firstWord + '\uf8ff';
          
          console.log(`  Name prefix search: "${firstWord}" to "${firstWordUpper}"`);
          
          try {
            const nameQuery = await db.collection('customers')
              .where('name', '>=', firstWord)
              .where('name', '<=', firstWordUpper)
              .limit(20)
              .get();
            
            nameQuery.forEach(doc => {
              const data = doc.data();
              if (data.name && data.name.toLowerCase().includes(searchLower)) {
                results.push({ name: data.name, phone: data.phone, method: 'prefix' });
              }
            });
          } catch (error) {
            console.log(`    Prefix search failed: ${error.message}`);
          }
        }
        
        // Fallback scan if no results
        if (results.length === 0) {
          console.log(`  Fallback scan for: "${searchTerm}"`);
          const limitedSnapshot = await db.collection('customers').limit(50).get();
          
          limitedSnapshot.forEach(doc => {
            const data = doc.data();
            const nameMatch = data.name && data.name.toLowerCase().includes(searchLower);
            const emailMatch = data.email && data.email.toLowerCase().includes(searchLower);
            
            if ((nameMatch || emailMatch) && results.length < 10) {
              results.push({ name: data.name, phone: data.phone, method: 'fallback' });
            }
          });
        }
      }
      
      console.log(`  Results: ${results.length} found`);
      results.forEach(result => {
        console.log(`    • ${result.name} (${result.phone}) [${result.method}]`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testImprovedSearch()
  .then(() => {
    console.log('\n✅ Improved search test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });