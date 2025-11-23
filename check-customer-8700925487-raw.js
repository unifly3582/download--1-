const admin = require('firebase-admin');
const serviceAccount = require('./temp-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkCustomer() {
  const phone = '+918700925487';
  
  console.log('🔍 Checking customer data for:', phone);
  console.log('='.repeat(60));
  
  // Method 1: Query by phone field
  console.log('\n📋 Method 1: Query by phone field');
  const querySnapshot = await db.collection('customers').where('phone', '==', phone).get();
  
  if (!querySnapshot.empty) {
    querySnapshot.forEach(doc => {
      console.log('\nDocument ID:', doc.id);
      console.log('Document Data:');
      console.log(JSON.stringify(doc.data(), null, 2));
      
      const data = doc.data();
      console.log('\n🔍 Key Fields:');
      console.log('  customerId:', data.customerId);
      console.log('  customerId type:', typeof data.customerId);
      console.log('  customerId === undefined:', data.customerId === undefined);
      console.log('  phone:', data.phone);
      console.log('  name:', data.name);
    });
  } else {
    console.log('❌ No customer found with phone query');
  }
  
  // Method 2: Try direct document lookup
  console.log('\n📋 Method 2: Direct document lookup by phone');
  const phoneDoc = await db.collection('customers').doc(phone).get();
  
  if (phoneDoc.exists) {
    console.log('\nDocument ID:', phoneDoc.id);
    console.log('Document Data:');
    console.log(JSON.stringify(phoneDoc.data(), null, 2));
    
    const data = phoneDoc.data();
    console.log('\n🔍 Key Fields:');
    console.log('  customerId:', data.customerId);
    console.log('  customerId type:', typeof data.customerId);
    console.log('  customerId === undefined:', data.customerId === undefined);
    console.log('  phone:', data.phone);
    console.log('  name:', data.name);
  } else {
    console.log('❌ No customer found with direct lookup');
  }
}

checkCustomer().catch(console.error);
