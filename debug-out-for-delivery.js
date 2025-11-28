// Debug script to check why "out for delivery" notifications aren't sending

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./temp-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugOutForDelivery() {
  console.log('🔍 Checking orders with "Out for Delivery" status...\n');
  
  try {
    // Find orders that need tracking
    const ordersSnapshot = await db.collection('orders')
      .where('needsTracking', '==', true)
      .where('shipmentInfo.courierPartner', '==', 'delhivery')
      .limit(20)
      .get();
    
    console.log(`Found ${ordersSnapshot.size} orders being tracked\n`);
    
    for (const doc of ordersSnapshot.docs) {
      const order = doc.data();
      const orderId = order.orderId;
      const awb = order.shipmentInfo?.awb;
      const currentStatus = order.shipmentInfo?.currentTrackingStatus;
      const lastNotified = order.notificationHistory?.lastNotifiedStatus;
      const lastNotifiedAt = order.notificationHistory?.lastNotifiedAt;
      
      console.log(`📦 Order ${orderId} (AWB: ${awb})`);
      console.log(`   Current Tracking Status: "${currentStatus}"`);
      console.log(`   Last Notified Status: "${lastNotified || 'NONE'}"`);
      if (lastNotifiedAt) {
        console.log(`   Last Notified At: ${lastNotifiedAt}`);
      }
      
      // Check if status matches "out for delivery"
      const statusLower = (currentStatus || '').toLowerCase();
      const isOutForDelivery = statusLower.includes('out for delivery') || 
                               statusLower.includes('out-for-delivery');
      
      console.log(`   Is "Out for Delivery"? ${isOutForDelivery ? '✅ YES' : '❌ NO'}`);
      
      if (isOutForDelivery) {
        const shouldSend = lastNotified !== 'out_for_delivery';
        console.log(`   Should Send Notification? ${shouldSend ? '✅ YES' : '❌ NO (already sent)'}`);
        
        if (!shouldSend) {
          console.log(`   ⚠️  Notification already sent on ${lastNotifiedAt}`);
        }
      }
      
      console.log('');
    }
    
    // Also check for any orders with "out for delivery" in tracking status
    console.log('\n🔍 Searching for orders with "out" in tracking status...\n');
    
    const outForDeliveryOrders = await db.collection('orders')
      .where('shipmentInfo.currentTrackingStatus', '>=', 'Out')
      .where('shipmentInfo.currentTrackingStatus', '<=', 'Out\uf8ff')
      .limit(10)
      .get();
    
    console.log(`Found ${outForDeliveryOrders.size} orders with "Out" in status\n`);
    
    outForDeliveryOrders.forEach(doc => {
      const order = doc.data();
      console.log(`📦 ${order.orderId}: "${order.shipmentInfo?.currentTrackingStatus}"`);
      console.log(`   Last Notified: ${order.notificationHistory?.lastNotifiedStatus || 'NONE'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugOutForDelivery()
  .then(() => {
    console.log('✅ Debug complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
