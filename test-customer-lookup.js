const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./temp-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testCustomerLookup() {
  console.log('\n=== Testing Customer Lookup by Phone ===\n');
  
  const testPhone = process.argv[2] || '+919876543210'; // Get phone from command line or use default
  
  console.log(`Testing with phone: ${testPhone}\n`);
  
  // Test 1: Direct query with normalized phone
  console.log('1. Querying with normalized phone (+91...)');
  const normalizedPhone = testPhone.startsWith('+91') ? testPhone : `+91${testPhone.replace(/^\+91/, '')}`;
  console.log(`   Normalized: ${normalizedPhone}`);
  
  try {
    const query1 = await db.collection('customers')
      .where('phone', '==', normalizedPhone)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (!query1.empty) {
      const doc = query1.docs[0];
      const data = doc.data();
      console.log(`   ✓ Found customer!`);
      console.log(`     - Document ID: ${doc.id}`);
      console.log(`     - customerId field: ${data.customerId}`);
      console.log(`     - name: ${data.name}`);
      console.log(`     - phone: ${data.phone}`);
      console.log(`     - Has defaultAddress: ${!!data.defaultAddress}`);
      console.log(`     - Has savedAddresses: ${!!data.savedAddresses} (${data.savedAddresses?.length || 0} addresses)`);
      
      if (data.defaultAddress) {
        console.log(`     - Default Address: ${data.defaultAddress.street}, ${data.defaultAddress.city}`);
      }
    } else {
      console.log(`   ❌ No customer found with normalized phone`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 2: Query without +91
  console.log('\n2. Querying without +91 prefix');
  const phoneWithout91 = testPhone.replace(/^\+91/, '');
  console.log(`   Phone: ${phoneWithout91}`);
  
  try {
    const query2 = await db.collection('customers')
      .where('phone', '==', phoneWithout91)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (!query2.empty) {
      const doc = query2.docs[0];
      const data = doc.data();
      console.log(`   ✓ Found customer!`);
      console.log(`     - Document ID: ${doc.id}`);
      console.log(`     - customerId: ${data.customerId}`);
      console.log(`     - name: ${data.name}`);
    } else {
      console.log(`   ❌ No customer found without +91 prefix`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 3: Check if stored as document ID (legacy)
  console.log('\n3. Checking if customer stored with phone as document ID (legacy)');
  try {
    const doc1 = await db.collection('customers').doc(normalizedPhone).get();
    if (doc1.exists) {
      console.log(`   ✓ Found as document ID: ${normalizedPhone}`);
    } else {
      console.log(`   ❌ Not found as document ID: ${normalizedPhone}`);
    }
    
    const doc2 = await db.collection('customers').doc(phoneWithout91).get();
    if (doc2.exists) {
      console.log(`   ✓ Found as document ID: ${phoneWithout91}`);
    } else {
      console.log(`   ❌ Not found as document ID: ${phoneWithout91}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 4: List some customers to see phone format
  console.log('\n4. Checking phone format in database (first 5 customers)');
  try {
    const sample = await db.collection('customers')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    console.log(`   Found ${sample.size} customers:`);
    sample.forEach(doc => {
      const data = doc.data();
      console.log(`     - ${data.name}: phone="${data.phone}" (Doc ID: ${doc.id})`);
    });
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n=== Test Complete ===\n');
  console.log('Usage: node test-customer-lookup.js <phone_number>');
  console.log('Example: node test-customer-lookup.js 9876543210');
  console.log('Example: node test-customer-lookup.js +919876543210\n');
}

testCustomerLookup()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
