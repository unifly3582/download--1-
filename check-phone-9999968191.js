// Check orders for phone number 9999968191
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

async function checkPhone() {
  console.log('🔍 Checking orders for phone: +919999968191\n');

  try {
    // Find orders for this phone number
    const ordersQuery = await db.collection('orders')
      .where('customerInfo.phone', '==', '+919999968191')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    console.log(`📦 Found ${ordersQuery.size} orders\n`);

    if (ordersQuery.empty) {
      console.log('No orders found for this phone number');
      return;
    }

    ordersQuery.forEach(doc => {
      const order = doc.data();
      const createdDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      
      console.log(`Order: ${order.orderId}`);
      console.log(`  Created: ${createdDate.toLocaleString()}`);
      console.log(`  Status: ${order.internalStatus}`);
      console.log(`  Customer: ${order.customerInfo.name}`);
      console.log(`  Total: ₹${order.pricingInfo.grandTotal}`);
      console.log(`  Payment: ${order.paymentInfo.method}`);
      
      if (order.shipmentInfo?.awb) {
        console.log(`  AWB: ${order.shipmentInfo.awb}`);
        console.log(`  Courier: ${order.shipmentInfo.courierPartner}`);
      }
      
      console.log(`  Last Notification: ${order.customerNotifications?.lastNotificationSent || 'Never'}`);
      console.log('');
    });

    // Check notification logs for this phone
    console.log('📱 Checking notification logs...\n');
    
    const notificationLogs = await db.collection('notification_logs')
      .where('customerPhone', '==', '+919999968191')
      .limit(10)
      .get();
    
    if (notificationLogs.empty) {
      console.log('❌ No notification logs found for this phone number');
    } else {
      console.log(`Found ${notificationLogs.size} notifications:\n`);
      notificationLogs.forEach(doc => {
        const log = doc.data();
        const date = log.createdAt?.toDate?.() || new Date(log.sentAt);
        console.log(`  - ${log.notificationType} for Order ${log.orderId}`);
        console.log(`    Status: ${log.status}`);
        console.log(`    Date: ${date.toLocaleString()}`);
        if (log.error) {
          console.log(`    Error: ${log.error}`);
        }
        if (log.messageId) {
          console.log(`    Message ID: ${log.messageId}`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPhone()
  .then(() => {
    console.log('✅ Check complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
