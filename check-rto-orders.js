// Check for orders with RTO (Return to Origin) status

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./temp-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkRTOOrders() {
  console.log('🔍 Checking for RTO orders...\n');
  
  try {
    // Check 1: Orders with "return_initiated" internal status
    console.log('1️⃣ Checking for "return_initiated" status...');
    const returnInitiatedOrders = await db.collection('orders')
      .where('internalStatus', '==', 'return_initiated')
      .get();
    
    console.log(`   Found ${returnInitiatedOrders.size} orders with "return_initiated" status\n`);
    
    if (!returnInitiatedOrders.empty) {
      returnInitiatedOrders.forEach(doc => {
        const order = doc.data();
        console.log(`   📦 Order ${order.orderId}`);
        console.log(`      Status: ${order.internalStatus}`);
        console.log(`      Tracking: ${order.shipmentInfo?.currentTrackingStatus || 'N/A'}`);
        console.log(`      Location: ${order.shipmentInfo?.trackingLocation || 'N/A'}`);
        console.log('');
      });
    }
    
    // Check 2: Orders with "returned" internal status
    console.log('2️⃣ Checking for "returned" status...');
    const returnedOrders = await db.collection('orders')
      .where('internalStatus', '==', 'returned')
      .get();
    
    console.log(`   Found ${returnedOrders.size} orders with "returned" status\n`);
    
    if (!returnedOrders.empty) {
      returnedOrders.forEach(doc => {
        const order = doc.data();
        console.log(`   📦 Order ${order.orderId}`);
        console.log(`      Status: ${order.internalStatus}`);
        console.log(`      Tracking: ${order.shipmentInfo?.currentTrackingStatus || 'N/A'}`);
        console.log(`      Location: ${order.shipmentInfo?.trackingLocation || 'N/A'}`);
        console.log('');
      });
    }
    
    // Check 3: Orders with "RTO" in tracking status
    console.log('3️⃣ Checking for "RTO" in tracking status...');
    const rtoTrackingOrders = await db.collection('orders')
      .where('shipmentInfo.currentTrackingStatus', '>=', 'RTO')
      .where('shipmentInfo.currentTrackingStatus', '<=', 'RTO\uf8ff')
      .get();
    
    console.log(`   Found ${rtoTrackingOrders.size} orders with "RTO" in tracking status\n`);
    
    if (!rtoTrackingOrders.empty) {
      rtoTrackingOrders.forEach(doc => {
        const order = doc.data();
        console.log(`   📦 Order ${order.orderId}`);
        console.log(`      Internal Status: ${order.internalStatus}`);
        console.log(`      Tracking Status: ${order.shipmentInfo?.currentTrackingStatus}`);
        console.log(`      Location: ${order.shipmentInfo?.trackingLocation || 'N/A'}`);
        console.log(`      Last Tracked: ${order.shipmentInfo?.lastTrackedAt || 'N/A'}`);
        console.log(`      Needs Tracking: ${order.needsTracking}`);
        console.log('');
      });
    }
    
    // Check 4: All shipped orders to see their statuses
    console.log('4️⃣ Checking all shipped orders (last 20)...');
    const shippedOrders = await db.collection('orders')
      .where('shipmentInfo.courierPartner', '==', 'delhivery')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    
    console.log(`   Found ${shippedOrders.size} recent Delhivery orders\n`);
    
    const statusCounts = {};
    shippedOrders.forEach(doc => {
      const order = doc.data();
      const trackingStatus = order.shipmentInfo?.currentTrackingStatus || 'No tracking';
      statusCounts[trackingStatus] = (statusCounts[trackingStatus] || 0) + 1;
    });
    
    console.log('   Status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`      ${status}: ${count} orders`);
    });
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Return Initiated: ${returnInitiatedOrders.size} orders`);
    console.log(`   Returned: ${returnedOrders.size} orders`);
    console.log(`   RTO in Tracking: ${rtoTrackingOrders.size} orders`);
    
    const totalRTO = returnInitiatedOrders.size + returnedOrders.size;
    if (totalRTO === 0) {
      console.log('\n✅ No RTO orders found in your system');
    } else {
      console.log(`\n⚠️  Total RTO orders: ${totalRTO}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRTOOrders()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
