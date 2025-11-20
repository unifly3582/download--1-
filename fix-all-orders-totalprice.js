// Fix all orders missing totalPrice in items
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

async function fixAllOrders() {
  console.log('🔧 Scanning all orders for missing totalPrice...\n');

  try {
    // Get all orders
    const ordersSnapshot = await db.collection('orders').get();
    
    console.log(`📊 Total orders: ${ordersSnapshot.size}\n`);

    let ordersNeedingFix = [];
    let ordersFixed = 0;
    let ordersFailed = 0;

    // Find orders with missing totalPrice
    ordersSnapshot.forEach(doc => {
      const data = doc.data();
      const hasMissingTotalPrice = data.items?.some(item => item.totalPrice === undefined);
      
      if (hasMissingTotalPrice) {
        ordersNeedingFix.push({
          id: doc.id,
          orderId: data.orderId,
          items: data.items
        });
      }
    });

    console.log(`🔍 Found ${ordersNeedingFix.length} orders needing fix\n`);

    if (ordersNeedingFix.length === 0) {
      console.log('✅ All orders are good! No fixes needed.');
      return;
    }

    // Fix each order
    for (const order of ordersNeedingFix) {
      try {
        console.log(`🔧 Fixing Order ${order.orderId} (${order.id})...`);
        
        const fixedItems = order.items.map(item => ({
          ...item,
          totalPrice: item.totalPrice || (item.quantity * item.unitPrice)
        }));

        await db.collection('orders').doc(order.id).update({
          items: fixedItems,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`   ✅ Fixed ${order.items.length} items`);
        ordersFixed++;
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        ordersFailed++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total orders scanned: ${ordersSnapshot.size}`);
    console.log(`   Orders needing fix: ${ordersNeedingFix.length}`);
    console.log(`   Orders fixed: ${ordersFixed} ✅`);
    console.log(`   Orders failed: ${ordersFailed} ❌`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixAllOrders()
  .then(() => {
    console.log('\n✅ Scan and fix complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
