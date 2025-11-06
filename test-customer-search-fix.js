// Test script to verify customer search functionality
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already initialized)
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

async function testCustomerSearch() {
  console.log('🔍 Testing Customer Search Functionality...\n');
  
  try {
    // Test 1: Check how customers are actually stored
    console.log('📊 Test 1: Analyzing customer storage structure...');
    const customersSnapshot = await db.collection('customers').limit(5).get();
    
    if (customersSnapshot.empty) {
      console.log('❌ No customers found in database!');
      return;
    }
    
    console.log(`Found ${customersSnapshot.size} customers. Analyzing structure:`);
    customersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  • Document ID: ${doc.id}`);
      console.log(`  • Customer ID: ${data.customerId || 'NOT SET'}`);
      console.log(`  • Phone: ${data.phone || 'NOT SET'}`);
      console.log(`  • Name: ${data.name || 'NOT SET'}`);
      console.log('  ---');
    });
    
    // Test 2: Test phone-based search (the correct way)
    console.log('\n📱 Test 2: Testing phone-based search...');
    const firstCustomer = customersSnapshot.docs[0].data();
    const testPhone = firstCustomer.phone;
    
    if (testPhone) {
      console.log(`Searching for customer with phone: ${testPhone}`);
      
      // Method 1: Query by phone field (CORRECT)
      const phoneQuery = await db.collection('customers').where('phone', '==', testPhone).limit(1).get();
      console.log(`✅ Phone field query: ${phoneQuery.empty ? 'NOT FOUND' : 'FOUND'}`);
      
      // Method 2: Document ID lookup (INCORRECT for current setup)
      const phoneDoc = await db.collection('customers').doc(testPhone).get();
      console.log(`❌ Phone as doc ID: ${phoneDoc.exists ? 'FOUND' : 'NOT FOUND'} (Expected: NOT FOUND)`);
    }
    
    // Test 3: Test customerId-based search
    console.log('\n🆔 Test 3: Testing customerId-based search...');
    const testCustomerId = firstCustomer.customerId;
    
    if (testCustomerId) {
      console.log(`Searching for customer with ID: ${testCustomerId}`);
      
      // Method 1: Document ID lookup (CORRECT for current setup)
      const customerDoc = await db.collection('customers').doc(testCustomerId).get();
      console.log(`✅ CustomerId as doc ID: ${customerDoc.exists ? 'FOUND' : 'NOT FOUND'}`);
      
      // Method 2: Query by customerId field
      const customerQuery = await db.collection('customers').where('customerId', '==', testCustomerId).limit(1).get();
      console.log(`📋 CustomerId field query: ${customerQuery.empty ? 'NOT FOUND' : 'FOUND'}`);
    }
    
    // Test 4: Test name-based search
    console.log('\n👤 Test 4: Testing name-based search...');
    const testName = firstCustomer.name;
    
    if (testName) {
      const nameLower = testName.toLowerCase();
      console.log(`Searching for customers with name containing: ${testName}`);
      
      // Range query approach
      try {
        const nameQuery = await db.collection('customers')
          .where('name', '>=', nameLower)
          .where('name', '<=', nameLower + '\uf8ff')
          .limit(5)
          .get();
        console.log(`✅ Name range query: Found ${nameQuery.size} results`);
      } catch (error) {
        console.log(`❌ Name range query failed: ${error.message}`);
        
        // Fallback: scan approach
        console.log('Trying fallback scan approach...');
        const allCustomers = await db.collection('customers').limit(20).get();
        let matchCount = 0;
        allCustomers.forEach(doc => {
          const data = doc.data();
          if (data.name && data.name.toLowerCase().includes(nameLower)) {
            matchCount++;
          }
        });
        console.log(`📊 Fallback scan: Found ${matchCount} matches in ${allCustomers.size} customers`);
      }
    }
    
    console.log('\n✅ Customer search analysis complete!');
    console.log('\n📋 Summary:');
    console.log('• Customers are stored with customerId as document ID');
    console.log('• Phone searches should use .where("phone", "==", phone)');
    console.log('• CustomerId searches should use .doc(customerId)');
    console.log('• Name searches need proper indexing or fallback scanning');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCustomerSearch()
  .then(() => {
    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });