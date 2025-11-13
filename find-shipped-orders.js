/**
 * Find all orders with shipment information
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

async function findShippedOrders() {
  console.log('🔍 Searching for orders with shipment information...\n');

  try {
    // Get ALL orders (no filters)
    console.log('Fetching all orders...');
    const allOrders = await db.collection('orders').get();
    console.log(`Total orders in database: ${allOrders.size}\n`);

    const ordersWithShipment = [];
    const ordersByStatus = {};

    allOrders.forEach(doc => {
      const data = doc.data();
      const status = data.internalStatus || 'unknown';
      
      // Count by status
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;

      // Check if has shipment info
      if (data.shipmentInfo) {
        ordersWithShipment.push({
          id: doc.id,
          status: status,
          courier: data.shipmentInfo.courierPartner,
          awb: data.shipmentInfo.awb,
          needsTracking: data.needsTracking,
          trackingStatus: data.shipmentInfo.currentTrackingStatus,
          lastTracked: data.shipmentInfo.lastTrackedAt,
          createdAt: data.createdAt
        });
      }
    });

    console.log('📊 Orders by Status:');
    Object.entries(ordersByStatus).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log('');

    console.log(`📦 Orders with shipment info: ${ordersWithShipment.length}\n`);

    if (ordersWithShipment.length === 0) {
      console.log('❌ No orders with shipment information found');
      return;
    }

    // Group by courier
    const byCourier = {};
    ordersWithShipment.forEach(order => {
      const courier = order.courier || 'unknown';
      if (!byCourier[courier]) {
        byCourier[courier] = [];
      }
      byCourier[courier].push(order);
    });

    console.log('📦 Orders by Courier:');
    Object.entries(byCourier).forEach(([courier, orders]) => {
      console.log(`\n${courier} (${orders.length} orders):`);
      orders.slice(0, 5).forEach(order => {
        console.log(`   ${order.id}:`);
        console.log(`      Status: ${order.status}`);
        console.log(`      AWB: ${order.awb || 'N/A'}`);
        console.log(`      Needs Tracking: ${order.needsTracking || false}`);
        console.log(`      Tracking Status: ${order.trackingStatus || 'N/A'}`);
        console.log(`      Last Tracked: ${order.lastTracked || 'Never'}`);
      });
      if (orders.length > 5) {
        console.log(`   ... and ${orders.length - 5} more`);
      }
    });

    // Find Delhivery orders specifically
    const delhiveryOrders = ordersWithShipment.filter(o => 
      o.courier && o.courier.toLowerCase().includes('delhivery')
    );

    console.log(`\n\n🚚 Delhivery Orders: ${delhiveryOrders.length}`);
    
    if (delhiveryOrders.length > 0) {
      console.log('\nDelhivery orders with AWB:');
      const withAwb = delhiveryOrders.filter(o => o.awb);
      console.log(`   Total: ${withAwb.length}`);
      
      if (withAwb.length > 0) {
        console.log('\n   Sample orders:');
        withAwb.slice(0, 10).forEach(order => {
          console.log(`   - ${order.id}: AWB ${order.awb}, Status: ${order.status}, Needs Tracking: ${order.needsTracking}`);
        });

        console.log('\n✅ Found Delhivery orders that can be tracked!');
        console.log(`\n💡 To enable tracking for an order, run:`);
        console.log(`   node enable-tracking.js ${withAwb[0].id}`);
      }
    } else {
      console.log('\n⚠️  No Delhivery orders found');
      console.log('Available couriers:', Object.keys(byCourier).join(', '));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

findShippedOrders()
  .then(() => {
    console.log('\n✅ Search completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
