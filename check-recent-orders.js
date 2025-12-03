/**
 * Check the 10 most recent orders
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

async function checkRecentOrders() {
  console.log('🔍 Checking Recent Orders...');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    const ordersSnapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    console.log(`📦 Found ${ordersSnapshot.size} recent orders:\n`);
    
    for (const doc of ordersSnapshot.docs) {
      const order = doc.data();
      
      console.log(`Order ${order.orderId}`);
      console.log(`  Created: ${order.createdAt?.toDate?.()}`);
      console.log(`  Customer: ${order.customerInfo?.name || 'N/A'} (${order.customerInfo?.phone})`);
      console.log(`  Customer ID: ${order.customerInfo?.customerId}`);
      console.log(`  Status: ${order.internalStatus}`);
      console.log(`  Source: ${order.orderSource || 'N/A'}`);
      
      // Check if customer profile exists
      const customerPhone = order.customerInfo?.phone;
      if (customerPhone) {
        const customerSnapshot = await db.collection('customers')
          .where('phone', '==', customerPhone)
          .limit(1)
          .get();
        
        if (!customerSnapshot.empty) {
          const customer = customerSnapshot.docs[0].data();
          console.log(`  ✅ Customer Profile: ${customerSnapshot.docs[0].id}`);
          console.log(`     Address: ${customer.defaultAddress ? 'Saved' : 'NOT SAVED'}`);
        } else {
          console.log(`  ❌ Customer Profile: NOT FOUND`);
        }
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRecentOrders()
  .then(() => {
    console.log('✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
