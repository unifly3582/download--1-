const admin = require('firebase-admin');

// Initialize Firebase Admin using environment variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'buggly-adminpanel',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function testPhone9999968191() {
  console.log('\n=== Testing Phone: 9999968191 ===\n');
  
  const testPhone = '9999968191';
  const normalizedPhone = `+91${testPhone}`;
  
  console.log(`Testing phone: ${testPhone}`);
  console.log(`Normalized: ${normalizedPhone}\n`);
  
  // Test 1: Query with +91 prefix
  console.log('1. Querying with +91 prefix...');
  try {
    const query1 = await db.collection('customers')
      .where('phone', '==', normalizedPhone)
      .limit(5)
      .get();
    
    console.log(`   Found ${query1.size} customer(s)`);
    
    if (!query1.empty) {
      query1.forEach(doc => {
        const data = doc.data();
        console.log(`\n   Customer Found:`);
        console.log(`   - Document ID: ${doc.id}`);
        console.log(`   - customerId: ${data.customerId}`);
        console.log(`   - name: ${data.name}`);
        console.log(`   - phone: ${data.phone}`);
        console.log(`   - email: ${data.email || 'N/A'}`);
        console.log(`   - totalOrders: ${data.totalOrders || 0}`);
        console.log(`   - loyaltyTier: ${data.loyaltyTier || 'N/A'}`);
        console.log(`   - Has defaultAddress: ${!!data.defaultAddress}`);
        console.log(`   - Has savedAddresses: ${!!data.savedAddresses} (${data.savedAddresses?.length || 0} addresses)`);
        console.log(`   - Has createdAt: ${!!data.createdAt}`);
        console.log(`   - Has updatedAt: ${!!data.updatedAt}`);
        
        if (data.defaultAddress) {
          console.log(`\n   Default Address:`);
          console.log(`   - Street: ${data.defaultAddress.street}`);
          console.log(`   - City: ${data.defaultAddress.city}`);
          console.log(`   - State: ${data.defaultAddress.state}`);
          console.log(`   - ZIP: ${data.defaultAddress.zip}`);
          console.log(`   - Country: ${data.defaultAddress.country}`);
        }
        
        if (data.savedAddresses && data.savedAddresses.length > 0) {
          console.log(`\n   Saved Addresses (${data.savedAddresses.length}):`);
          data.savedAddresses.forEach((addr, idx) => {
            console.log(`   ${idx + 1}. ${addr.street}, ${addr.city}, ${addr.state} - ${addr.zip}`);
          });
        }
        
        // Check for any fields that might cause validation issues
        console.log(`\n   Validation Check:`);
        const requiredFields = ['customerId', 'phone', 'name'];
        requiredFields.forEach(field => {
          const exists = !!data[field];
          console.log(`   - ${field}: ${exists ? '✓' : '❌ MISSING'}`);
        });
      });
    } else {
      console.log(`   ❌ No customer found with phone: ${normalizedPhone}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 2: Query without +91 prefix
  console.log('\n2. Querying without +91 prefix...');
  try {
    const query2 = await db.collection('customers')
      .where('phone', '==', testPhone)
      .limit(5)
      .get();
    
    console.log(`   Found ${query2.size} customer(s)`);
    
    if (!query2.empty) {
      query2.forEach(doc => {
        const data = doc.data();
        console.log(`   - Document ID: ${doc.id}, Name: ${data.name}, Phone: ${data.phone}`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 3: Check if stored as document ID
  console.log('\n3. Checking if stored as document ID...');
  try {
    const doc1 = await db.collection('customers').doc(normalizedPhone).get();
    if (doc1.exists) {
      const data = doc1.data();
      console.log(`   ✓ Found as document ID: ${normalizedPhone}`);
      console.log(`   - Name: ${data.name}`);
    } else {
      console.log(`   ❌ Not found as document ID: ${normalizedPhone}`);
    }
    
    const doc2 = await db.collection('customers').doc(testPhone).get();
    if (doc2.exists) {
      const data = doc2.data();
      console.log(`   ✓ Found as document ID: ${testPhone}`);
      console.log(`   - Name: ${data.name}`);
    } else {
      console.log(`   ❌ Not found as document ID: ${testPhone}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 4: Search in orders to see what phone format is used
  console.log('\n4. Checking orders for this phone...');
  try {
    const ordersQuery = await db.collection('orders')
      .where('customerInfo.phone', '==', normalizedPhone)
      .limit(3)
      .get();
    
    console.log(`   Found ${ordersQuery.size} order(s) with phone: ${normalizedPhone}`);
    
    if (!ordersQuery.empty) {
      ordersQuery.forEach(doc => {
        const data = doc.data();
        console.log(`   - Order ${data.orderId}: ${data.customerInfo.name} (${data.customerInfo.phone})`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n=== Test Complete ===\n');
}

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

testPhone9999968191()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
