// Test order confirmation notification
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

async function testOrderConfirmation() {
  console.log('🧪 Testing Order Confirmation Notification...\n');

  try {
    // 1. Check WhatsApp configuration
    console.log('1️⃣ Checking WhatsApp Configuration...');
    const whatsappConfigured = !!(
      process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
    );
    
    console.log('   - Access Token:', process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
    console.log('   - Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅ Set' : '❌ Missing');
    console.log('   - Business Account ID:', process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ? '✅ Set' : '❌ Missing');
    
    if (!whatsappConfigured) {
      console.log('\n❌ WhatsApp not configured! Notifications will fail.');
      return;
    }
    console.log('   ✅ WhatsApp is configured\n');

    // 2. Check recent orders
    console.log('2️⃣ Checking Recent Orders...');
    const recentOrders = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    console.log(`   Found ${recentOrders.size} recent orders\n`);

    // 3. Check notification logs
    console.log('3️⃣ Checking Recent Notification Logs...');
    const notificationLogs = await db.collection('notification_logs')
      .where('notificationType', '==', 'order_placed')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    if (notificationLogs.empty) {
      console.log('   ❌ No order_placed notifications found in logs!\n');
    } else {
      console.log(`   Found ${notificationLogs.size} order_placed notifications:\n`);
      notificationLogs.forEach(doc => {
        const log = doc.data();
        const date = log.createdAt?.toDate?.() || new Date(log.sentAt);
        console.log(`   - Order ${log.orderId}:`);
        console.log(`     Status: ${log.status}`);
        console.log(`     Date: ${date.toLocaleString()}`);
        console.log(`     Phone: ${log.customerPhone}`);
        if (log.error) {
          console.log(`     Error: ${log.error}`);
        }
        if (log.messageId) {
          console.log(`     Message ID: ${log.messageId}`);
        }
        console.log('');
      });
    }

    // 4. Test with a recent order
    if (!recentOrders.empty) {
      const testOrder = recentOrders.docs[0];
      const orderData = testOrder.data();
      
      console.log('4️⃣ Testing with Most Recent Order...');
      console.log(`   Order ID: ${orderData.orderId}`);
      console.log(`   Customer: ${orderData.customerInfo.name}`);
      console.log(`   Phone: ${orderData.customerInfo.phone}`);
      console.log(`   Status: ${orderData.internalStatus}`);
      console.log('');

      // Import and test notification service
      const { createNotificationService } = await import('./src/lib/oms/notifications.ts');
      const notificationService = createNotificationService();

      // Prepare order data
      const orderForNotification = {
        ...orderData,
        createdAt: typeof orderData.createdAt === 'string' 
          ? orderData.createdAt 
          : orderData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('   📤 Sending test notification...');
      try {
        await notificationService.sendOrderPlacedNotification(orderForNotification);
        console.log('   ✅ Notification sent successfully!\n');
        
        // Check if it was logged
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        const newLog = await db.collection('notification_logs')
          .where('orderId', '==', orderData.orderId)
          .where('notificationType', '==', 'order_placed')
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
        
        if (!newLog.empty) {
          const log = newLog.docs[0].data();
          console.log('   📋 Notification Log:');
          console.log(`      Status: ${log.status}`);
          if (log.messageId) {
            console.log(`      Message ID: ${log.messageId}`);
          }
          if (log.error) {
            console.log(`      Error: ${log.error}`);
          }
        }
        
      } catch (error) {
        console.log('   ❌ Notification failed:', error.message);
        console.log('\n   Error details:', error);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testOrderConfirmation()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
