const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./temp-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testCustomerSearch() {
  console.log('\n=== Testing Customer Search ===\n');
  
  // Test 1: Get a sample customer to test with
  console.log('1. Getting sample customers...');
  const sampleSnapshot = await db.collection('customers')
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();
  
  if (sampleSnapshot.empty) {
    console.log('❌ No customers found in database!');
    return;
  }
  
  console.log(`✓ Found ${sampleSnapshot.size} sample customers\n`);
  
  const testCustomers = [];
  sampleSnapshot.forEach(doc => {
    const data = doc.data();
    testCustomers.push({
      id: doc.id,
      customerId: data.customerId,
      name: data.name,
      phone: data.phone,
      email: data.email
    });
    console.log(`  - ${data.name} (${data.phone}) [ID: ${doc.id}]`);
  });
  
  // Test 2: Search by phone (normalized)
  console.log('\n2. Testing phone search (normalized format)...');
  const testPhone = testCustomers[0].phone;
  console.log(`   Searching for: ${testPhone}`);
  
  const phoneQuery = await db.collection('customers')
    .where('phone', '==', testPhone)
    .limit(1)
    .get();
  
  if (phoneQuery.empty) {
    console.log(`   ❌ Phone search failed for ${testPhone}`);
  } else {
    console.log(`   ✓ Phone search successful: Found ${phoneQuery.docs[0].id}`);
  }
  
  // Test 3: Search by phone (without +91)
  console.log('\n3. Testing phone search (without +91)...');
  const phoneWithout91 = testPhone.replace('+91', '');
  console.log(`   Searching for: ${phoneWithout91}`);
  
  const phoneQuery2 = await db.collection('customers')
    .where('phone', '==', phoneWithout91)
    .limit(1)
    .get();
  
  if (phoneQuery2.empty) {
    console.log(`   ❌ Phone search failed for ${phoneWithout91}`);
  } else {
    console.log(`   ✓ Phone search successful: Found ${phoneQuery2.docs[0].id}`);
  }
  
  // Test 4: Search by name (case-sensitive)
  console.log('\n4. Testing name search (exact case)...');
  const testName = testCustomers[0].name;
  console.log(`   Searching for: ${testName}`);
  
  const nameQuery = await db.collection('customers')
    .where('name', '==', testName)
    .limit(1)
    .get();
  
  if (nameQuery.empty) {
    console.log(`   ❌ Name search failed for ${testName}`);
  } else {
    console.log(`   ✓ Name search successful: Found ${nameQuery.docs[0].id}`);
  }
  
  // Test 5: Search by name (lowercase)
  console.log('\n5. Testing name search (lowercase)...');
  const testNameLower = testName.toLowerCase();
  console.log(`   Searching for: ${testNameLower}`);
  
  const nameQueryLower = await db.collection('customers')
    .where('name', '==', testNameLower)
    .limit(1)
    .get();
  
  if (nameQueryLower.empty) {
    console.log(`   ❌ Name search failed for ${testNameLower} (expected - Firestore is case-sensitive)`);
  } else {
    console.log(`   ✓ Name search successful: Found ${nameQueryLower.docs[0].id}`);
  }
  
  // Test 6: Search by customerId
  console.log('\n6. Testing customerId search...');
  const testCustomerId = testCustomers[0].customerId;
  console.log(`   Searching for: ${testCustomerId}`);
  
  const customerIdDoc = await db.collection('customers').doc(testCustomerId).get();
  
  if (!customerIdDoc.exists) {
    console.log(`   ❌ CustomerId search failed for ${testCustomerId}`);
    console.log(`   Note: Document ID is ${testCustomers[0].id}, customerId field is ${testCustomerId}`);
  } else {
    console.log(`   ✓ CustomerId search successful: Found ${customerIdDoc.id}`);
  }
  
  // Test 7: Check if document ID matches customerId
  console.log('\n7. Checking document ID vs customerId field...');
  testCustomers.forEach(customer => {
    const match = customer.id === customer.customerId;
    console.log(`   ${customer.name}: Doc ID = ${customer.id}, customerId = ${customer.customerId} ${match ? '✓' : '❌'}`);
  });
  
  // Test 8: Check indexes
  console.log('\n8. Testing if orderBy works (indicates index exists)...');
  try {
    const indexTest = await db.collection('customers')
      .where('phone', '==', testPhone)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    console.log(`   ✓ Index exists for phone + createdAt`);
  } catch (error) {
    console.log(`   ❌ Index missing for phone + createdAt: ${error.message}`);
  }
  
  console.log('\n=== Test Complete ===\n');
}

testCustomerSearch()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
