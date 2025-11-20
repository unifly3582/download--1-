// Sync order 5038 to customer orders collection
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

async function syncOrder() {
  console.log('🔄 Syncing Order 5038 to customer collection...\n');

  try {
    // Get order from main collection
    const orderDoc = await db.collection('orders').doc('5038').get();
    
    if (!orderDoc.exists) {
      console.log('❌ Order not found!');
      return;
    }

    const orderData = orderDoc.data();
    const customerId = orderData.customerInfo.customerId;

    console.log('📦 Order Details:');
    console.log('   Order ID:', orderData.orderId);
    console.log('   Customer:', orderData.customerInfo.name);
    console.log('   Customer ID:', customerId);
    console.log('   Status:', orderData.internalStatus);
    console.log('');

    // Import the sync function
    const { syncOrderToCustomerCollection } = await import('./src/lib/oms/customerOrderSync.ts');

    console.log('🔄 Syncing to customer collection...');
    await syncOrderToCustomerCollection('5038', orderData);

    console.log('✅ Order synced successfully!');
    console.log(`   Location: customers/${customerId}/orders/5038`);

    // Verify sync
    console.log('\n🔍 Verifying sync...');
    const customerOrderDoc = await db.collection('customers')
      .doc(customerId)
      .collection('orders')
      .doc('5038')
      .get();

    if (customerOrderDoc.exists) {
      console.log('✅ Verified: Order now exists in customer collection!');
      const customerOrder = customerOrderDoc.data();
      console.log('   Status:', customerOrder.status);
      console.log('   Items:', customerOrder.items?.length);
      console.log('   Total:', customerOrder.totalAmount);
    } else {
      console.log('❌ Verification failed: Order still not in customer collection');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

syncOrder()
  .then(() => {
    console.log('\n✅ Sync complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
