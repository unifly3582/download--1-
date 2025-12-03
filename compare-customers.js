/**
 * Compare two customer profiles
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function compareCustomers() {
  const phone1 = '+919999968191';
  const phone2 = '+919680790855';
  
  console.log('🔍 Comparing Customer Profiles');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Get customer 1
    console.log(`📱 Customer 1: ${phone1}`);
    console.log('-'.repeat(60));
    const customer1Snapshot = await db.collection('customers')
      .where('phone', '==', phone1)
      .limit(1)
      .get();
    
    if (customer1Snapshot.empty) {
      console.log('❌ Customer 1 not found');
    } else {
      const customer1Doc = customer1Snapshot.docs[0];
      const customer1 = customer1Doc.data();
      
      console.log('Document ID:', customer1Doc.id);
      console.log('Customer ID:', customer1.customerId);
      console.log('Name:', customer1.name || 'N/A');
      console.log('Email:', customer1.email || 'N/A');
      console.log('Phone:', customer1.phone);
      console.log('');
      console.log('Default Address:');
      if (customer1.defaultAddress) {
        console.log('  ✅ EXISTS');
        console.log('  Street:', customer1.defaultAddress.street);
        console.log('  City:', customer1.defaultAddress.city);
        console.log('  State:', customer1.defaultAddress.state);
        console.log('  ZIP:', customer1.defaultAddress.zip);
        console.log('  Country:', customer1.defaultAddress.country);
      } else {
        console.log('  ❌ NOT SET');
      }
      console.log('');
      console.log('Saved Addresses:', customer1.savedAddresses?.length || 0);
      console.log('');
      console.log('Full JSON:');
      console.log(JSON.stringify(customer1, null, 2));
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    
    // Get customer 2
    console.log(`📱 Customer 2: ${phone2}`);
    console.log('-'.repeat(60));
    const customer2Snapshot = await db.collection('customers')
      .where('phone', '==', phone2)
      .limit(1)
      .get();
    
    if (customer2Snapshot.empty) {
      console.log('❌ Customer 2 not found');
    } else {
      const customer2Doc = customer2Snapshot.docs[0];
      const customer2 = customer2Doc.data();
      
      console.log('Document ID:', customer2Doc.id);
      console.log('Customer ID:', customer2.customerId);
      console.log('Name:', customer2.name || 'N/A');
      console.log('Email:', customer2.email || 'N/A');
      console.log('Phone:', customer2.phone);
      console.log('');
      console.log('Default Address:');
      if (customer2.defaultAddress) {
        console.log('  ✅ EXISTS');
        console.log('  Street:', customer2.defaultAddress.street);
        console.log('  City:', customer2.defaultAddress.city);
        console.log('  State:', customer2.defaultAddress.state);
        console.log('  ZIP:', customer2.defaultAddress.zip);
        console.log('  Country:', customer2.defaultAddress.country);
      } else {
        console.log('  ❌ NOT SET');
      }
      console.log('');
      console.log('Saved Addresses:', customer2.savedAddresses?.length || 0);
      console.log('');
      console.log('Full JSON:');
      console.log(JSON.stringify(customer2, null, 2));
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    
    // Compare structure
    if (!customer1Snapshot.empty && !customer2Snapshot.empty) {
      const customer1 = customer1Snapshot.docs[0].data();
      const customer2 = customer2Snapshot.docs[0].data();
      
      console.log('📊 COMPARISON');
      console.log('-'.repeat(60));
      console.log('');
      
      console.log('Field Comparison:');
      console.log(`  Name: ${customer1.name ? '✅' : '❌'} vs ${customer2.name ? '✅' : '❌'}`);
      console.log(`  Email: ${customer1.email ? '✅' : '❌'} vs ${customer2.email ? '✅' : '❌'}`);
      console.log(`  Default Address: ${customer1.defaultAddress ? '✅' : '❌'} vs ${customer2.defaultAddress ? '✅' : '❌'}`);
      console.log(`  Saved Addresses: ${customer1.savedAddresses?.length || 0} vs ${customer2.savedAddresses?.length || 0}`);
      console.log('');
      
      // Check data types
      console.log('Data Type Check:');
      console.log(`  Customer 1 defaultAddress type: ${typeof customer1.defaultAddress}`);
      console.log(`  Customer 2 defaultAddress type: ${typeof customer2.defaultAddress}`);
      console.log('');
      
      // Check if address fields exist
      if (customer1.defaultAddress) {
        console.log('Customer 1 Address Fields:');
        console.log(`  street: ${customer1.defaultAddress.street ? '✅' : '❌'} (${typeof customer1.defaultAddress.street})`);
        console.log(`  city: ${customer1.defaultAddress.city ? '✅' : '❌'} (${typeof customer1.defaultAddress.city})`);
        console.log(`  state: ${customer1.defaultAddress.state ? '✅' : '❌'} (${typeof customer1.defaultAddress.state})`);
        console.log(`  zip: ${customer1.defaultAddress.zip ? '✅' : '❌'} (${typeof customer1.defaultAddress.zip})`);
        console.log(`  country: ${customer1.defaultAddress.country ? '✅' : '❌'} (${typeof customer1.defaultAddress.country})`);
      }
      console.log('');
      
      if (customer2.defaultAddress) {
        console.log('Customer 2 Address Fields:');
        console.log(`  street: ${customer2.defaultAddress.street ? '✅' : '❌'} (${typeof customer2.defaultAddress.street})`);
        console.log(`  city: ${customer2.defaultAddress.city ? '✅' : '❌'} (${typeof customer2.defaultAddress.city})`);
        console.log(`  state: ${customer2.defaultAddress.state ? '✅' : '❌'} (${typeof customer2.defaultAddress.state})`);
        console.log(`  zip: ${customer2.defaultAddress.zip ? '✅' : '❌'} (${typeof customer2.defaultAddress.zip})`);
        console.log(`  country: ${customer2.defaultAddress.country ? '✅' : '❌'} (${typeof customer2.defaultAddress.country})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

compareCustomers()
  .then(() => {
    console.log('');
    console.log('✅ Comparison completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Comparison failed:', error);
    process.exit(1);
  });
