/**
 * Enable tracking for Delhivery orders
 */

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

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

async function enableTracking() {
  const orderId = process.argv[2];

  if (orderId) {
    // Enable tracking for specific order
    console.log(`🔧 Enabling tracking for order: ${orderId}\n`);
    
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      console.log('❌ Order not found');
      return;
    }

    const data = orderDoc.data();
    console.log('Current order details:');
    console.log(`   Status: ${data.internalStatus}`);
    console.log(`   Courier: ${data.shipmentInfo?.courierPartner || 'N/A'}`);
    console.log(`   AWB: ${data.shipmentInfo?.awb || 'N/A'}`);
    console.log(`   Needs Tracking: ${data.needsTracking || false}\n`);

    await orderRef.update({
      needsTracking: true
    });

    console.log('✅ Tracking enabled for this order');
    
  } else {
    // Enable tracking for all shipped Delhivery orders
    console.log('🔧 Enabling tracking for all shipped Delhivery orders...\n');

    const ordersSnapshot = await db.collection('orders').get();
    
    let enabledCount = 0;
    const batch = db.batch();
    
    ordersSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Enable tracking for shipped/in_transit Delhivery orders with AWB
      if (
        data.shipmentInfo?.courierPartner === 'delhivery' &&
        data.shipmentInfo?.awb &&
        ['shipped', 'in_transit', 'pending'].includes(data.internalStatus)
      ) {
        batch.update(doc.ref, { needsTracking: true });
        enabledCount++;
        console.log(`   ✓ ${doc.id}: AWB ${data.shipmentInfo.awb}`);
      }
    });

    if (enabledCount > 0) {
      await batch.commit();
      console.log(`\n✅ Enabled tracking for ${enabledCount} orders`);
    } else {
      console.log('⚠️  No eligible orders found');
      console.log('\nOrders must be:');
      console.log('   - Courier: delhivery');
      console.log('   - Status: shipped, in_transit, or pending');
      console.log('   - Have an AWB number');
    }
  }
}

enableTracking()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
