// Test sending a notification to a single order
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

async function testNotification(orderId) {
  console.log(`🧪 Testing notification for order: ${orderId}\n`);

  try {
    // Get order
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      console.log('❌ Order not found!');
      return;
    }

    const order = orderDoc.data();
    
    console.log('📦 Order Details:');
    console.log(`   Order ID: ${order.orderId}`);
    console.log(`   Customer: ${order.customerInfo.name}`);
    console.log(`   Phone: ${order.customerInfo.phone}`);
    console.log(`   Status: ${order.internalStatus}`);
    console.log(`   AWB: ${order.shipmentInfo?.awb || 'Not set'}`);
    console.log(`   Courier: ${order.shipmentInfo?.courierPartner || 'Not set'}`);
    console.log(`   Last Notified: ${order.notificationHistory?.lastNotifiedStatus || 'Never'}\n`);

    // Import notification service
    const { createNotificationService } = await import('./src/lib/oms/notifications.ts');
    const notificationService = createNotificationService();

    // Prepare order data with timestamps
    const orderForNotification = {
      ...order,
      createdAt: typeof order.createdAt === 'string' 
        ? order.createdAt 
        : order.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Test shipped notification
    console.log('📤 Sending "shipped" notification...');
    try {
      await notificationService.sendOrderShippedNotification(orderForNotification);
      console.log('✅ Notification sent successfully!\n');
      
      // Check notification log
      const logs = await db.collection('notification_logs')
        .where('orderId', '==', orderId)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      if (!logs.empty) {
        const log = logs.docs[0].data();
        console.log('📋 Notification Log:');
        console.log(`   Type: ${log.notificationType}`);
        console.log(`   Status: ${log.status}`);
        console.log(`   Channel: ${log.channel}`);
        if (log.messageId) {
          console.log(`   Message ID: ${log.messageId}`);
        }
        if (log.error) {
          console.log(`   Error: ${log.error}`);
        }
      }
      
    } catch (error) {
      console.log('❌ Notification failed:', error.message);
      console.log('\nError details:', error);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Get order ID from command line or use default
const orderId = process.argv[2] || '5024';

testNotification(orderId)
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
