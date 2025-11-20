// Check if order 5085 exists in Firestore
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

async function checkOrder5085() {
  console.log('🔍 Searching for order 5085...\n');

  try {
    // Method 1: Search by orderId field
    console.log('Method 1: Searching by orderId field...');
    const querySnapshot = await db.collection('orders')
      .where('orderId', '==', '5085')
      .get();

    if (!querySnapshot.empty) {
      console.log('✅ Found by orderId field!');
      querySnapshot.forEach(doc => {
        const data = doc.data();
        console.log('\nDocument ID:', doc.id);
        console.log('Order ID:', data.orderId);
        console.log('Customer:', data.customerInfo?.name);
        console.log('Phone:', data.customerInfo?.phone);
        console.log('Status:', data.internalStatus);
        console.log('Has Action Log:', !!data.shipmentInfo?.actionLog);
        console.log('Action Log Count:', data.shipmentInfo?.actionLog?.length || 0);
      });
    } else {
      console.log('❌ Not found by orderId field');
    }

    // Method 2: Try direct document lookup
    console.log('\n\nMethod 2: Trying direct document ID lookup...');
    const docSnapshot = await db.collection('orders').doc('5085').get();
    
    if (docSnapshot.exists) {
      console.log('✅ Found by document ID!');
      const data = docSnapshot.data();
      console.log('\nDocument ID:', docSnapshot.id);
      console.log('Order ID:', data.orderId);
      console.log('Customer:', data.customerInfo?.name);
      console.log('Phone:', data.customerInfo?.phone);
      console.log('Status:', data.internalStatus);
      console.log('Has Action Log:', !!data.shipmentInfo?.actionLog);
      console.log('Action Log Count:', data.shipmentInfo?.actionLog?.length || 0);
    } else {
      console.log('❌ Not found by document ID');
    }

    // Method 3: Search with range query (like the API does)
    console.log('\n\nMethod 3: Searching with range query (API method)...');
    const rangeSnapshot = await db.collection('orders')
      .where('orderId', '>=', '5085')
      .where('orderId', '<=', '5085' + '\uf8ff')
      .get();

    if (!rangeSnapshot.empty) {
      console.log('✅ Found by range query!');
      rangeSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('\nDocument ID:', doc.id);
        console.log('Order ID:', data.orderId);
        console.log('Customer:', data.customerInfo?.name);
        console.log('Status:', data.internalStatus);
      });
    } else {
      console.log('❌ Not found by range query');
    }

    // Method 4: List all orders to see what IDs exist
    console.log('\n\nMethod 4: Listing recent orders...');
    const recentOrders = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    console.log('Recent order IDs:');
    recentOrders.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.orderId} (doc: ${doc.id}) - ${data.customerInfo?.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }

  process.exit(0);
}

checkOrder5085();
