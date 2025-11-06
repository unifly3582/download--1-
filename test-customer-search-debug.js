// Debug script to test customer search functionality
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

async function debugCustomerSearch() {
  console.log('🔍 Debugging Customer Search Issues...\n');
  
  try {
    // Get a sample customer to test with
    console.log('📊 Getting sample customer data...');
    const sampleSnapshot = await db.collection('customers').limit(3).get();
    
    if (sampleSnapshot.empty) {
      console.log('❌ No customers found in database!');
      return;
    }
    
    const sampleCustomers = [];
    sampleSnapshot.forEach(doc => {
      const data = doc.data();
      sampleCustomers.push({
        id: doc.id,
        name: data.name,
        phone: data.phone,
        customerId: data.customerId
      });
    });
    
    console.log('Sample customers:');
    sampleCustomers.forEach(customer => {
      console.log(`  • ${customer.name} (${customer.phone}) - ID: ${customer.id} - CustomerId: ${customer.customerId || 'NOT SET'}`);
    });
    
    // Test 1: Phone search
    console.log('\n📱 Testing phone search...');
    const testPhone = sampleCustomers[0].phone;
    console.log(`Searching for: ${testPhone}`);
    
    const phoneQuery = await db.collection('customers').where('phone', '==', testPhone).get();
    console.log(`Phone search result: ${phoneQuery.empty ? 'NOT FOUND' : 'FOUND'} (${phoneQuery.size} results)`);
    
    // Test 2: Name search (range query)
    console.log('\n👤 Testing name search (range query)...');
    const testName = sampleCustomers[0].name;
    const nameLower = testName.toLowerCase();
    const nameUpper = nameLower + '\uf8ff';
    
    console.log(`Searching for name: "${testName}" (range: "${nameLower}" to "${nameUpper}")`);
    
    try {
      const nameQuery = await db.collection('customers')
        .where('name', '>=', nameLower)
        .where('name', '<=', nameUpper)
        .limit(5)
        .get();
      
      console.log(`Name range query result: ${nameQuery.empty ? 'NOT FOUND' : 'FOUND'} (${nameQuery.size} results)`);
      
      if (!nameQuery.empty) {
        nameQuery.forEach(doc => {
          const data = doc.data();
          console.log(`  Found: ${data.name} (stored as: "${data.name}")`);
        });
      }
    } catch (error) {
      console.log(`❌ Name range query failed: ${error.message}`);
      
      // Test fallback approach
      console.log('🔄 Testing fallback scan approach...');
      const allCustomers = await db.collection('customers').limit(20).get();
      let matches = 0;
      
      allCustomers.forEach(doc => {
        const data = doc.data();
        if (data.name && data.name.toLowerCase().includes(nameLower)) {
          matches++;
          console.log(`  Fallback match: ${data.name}`);
        }
      });
      
      console.log(`Fallback scan found ${matches} matches`);
    }
    
    // Test 3: Check if names are stored in the right format
    console.log('\n📝 Analyzing name storage format...');
    sampleCustomers.forEach(customer => {
      console.log(`  "${customer.name}" - lowercase: "${customer.name.toLowerCase()}"`);
    });
    
    // Test 4: Test partial name search
    console.log('\n🔍 Testing partial name search...');
    const partialName = sampleCustomers[0].name.split(' ')[0].toLowerCase(); // First word
    console.log(`Searching for partial name: "${partialName}"`);
    
    const partialQuery = await db.collection('customers')
      .where('name', '>=', partialName)
      .where('name', '<=', partialName + '\uf8ff')
      .limit(5)
      .get();
    
    console.log(`Partial name search result: ${partialQuery.empty ? 'NOT FOUND' : 'FOUND'} (${partialQuery.size} results)`);
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
}

// Run the debug test
debugCustomerSearch()
  .then(() => {
    console.log('\n✅ Debug test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Debug script failed:', error);
    process.exit(1);
  });