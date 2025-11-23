const admin = require('firebase-admin');
const serviceAccount = require('./temp-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkRawFirestoreData() {
  console.log('🔍 CHECKING RAW FIRESTORE DOCUMENTS');
  console.log('='.repeat(80));
  
  const phones = ['+919999968191', '+918700925487'];
  
  for (const phone of phones) {
    console.log(`\n📱 Checking: ${phone}`);
    console.log('-'.repeat(80));
    
    // Try to find the document
    const querySnapshot = await db.collection('customers').where('phone', '==', phone).limit(1).get();
    
    if (querySnapshot.empty) {
      console.log('❌ Not found via query');
      continue;
    }
    
    const doc = querySnapshot.docs[0];
    console.log(`📄 Document ID: ${doc.id}`);
    console.log(`📄 Document Path: customers/${doc.id}`);
    
    // Get raw data
    const rawData = doc.data();
    console.log('\n🔍 Raw Document Data:');
    console.log(JSON.stringify(rawData, null, 2));
    
    // Check each field explicitly
    console.log('\n🔎 Field-by-field analysis:');
    for (const [key, value] of Object.entries(rawData)) {
      const type = typeof value;
      const isUndefined = value === undefined;
      const isNull = value === null;
      console.log(`  ${key}:`);
      console.log(`    Type: ${type}`);
      console.log(`    Value: ${JSON.stringify(value)}`);
      console.log(`    Is undefined: ${isUndefined}`);
      console.log(`    Is null: ${isNull}`);
    }
    
    // Try to write a test order-like structure
    console.log('\n🧪 Testing order creation structure:');
    const testOrderData = {
      customerInfo: {
        ...rawData,
        customerId: rawData.customerId
      }
    };
    
    console.log('Test structure:');
    console.log(JSON.stringify(testOrderData, null, 2));
  }
}

checkRawFirestoreData().catch(console.error);
