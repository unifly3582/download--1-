// Test script to diagnose tracking sync issues
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

async function testTrackingSync() {
  console.log('🔍 Testing Tracking Sync Configuration...\n');

  try {
    // 1. Check Delhivery settings
    console.log('1️⃣ Checking Delhivery Settings...');
    const delhiverySettings = await db.collection('courierIntegrations').doc('delhivery').get();
    
    if (!delhiverySettings.exists) {
      console.log('❌ Delhivery settings not found!');
      return;
    }
    
    const settings = delhiverySettings.data();
    console.log('✅ Delhivery settings found');
    console.log('   - API Key:', settings.api?.authKey ? '✅ Configured' : '❌ Missing');
    console.log('   - Pickup Location:', settings.pickupLocationName || '❌ Missing');
    console.log('   - Active:', settings.isActive ? '✅ Yes' : '❌ No');
    console.log('');

    // 2. Check orders that need tracking
    console.log('2️⃣ Checking Orders Needing Tracking...');
    const ordersQuery = await db.collection('orders')
      .where('needsTracking', '==', true)
      .where('shipmentInfo.courierPartner', '==', 'delhivery')
      .limit(10)
      .get();
    
    console.log(`   Found ${ordersQuery.size} orders needing tracking\n`);
    
    if (ordersQuery.empty) {
      console.log('⚠️  No orders found that need tracking');
      console.log('   This could mean:');
      console.log('   - No orders have been shipped yet');
      console.log('   - needsTracking flag is not set correctly');
      console.log('   - Orders are using a different courier\n');
      
      // Check for any shipped orders
      const shippedOrders = await db.collection('orders')
        .where('internalStatus', '==', 'shipped')
        .limit(5)
        .get();
      
      console.log(`   Found ${shippedOrders.size} shipped orders (any courier)`);
      
      if (!shippedOrders.empty) {
        console.log('\n   Sample shipped orders:');
        shippedOrders.forEach(doc => {
          const order = doc.data();
          console.log(`   - ${order.orderId}:`);
          console.log(`     Courier: ${order.shipmentInfo?.courierPartner || 'Not set'}`);
          console.log(`     AWB: ${order.shipmentInfo?.awb || 'Not set'}`);
          console.log(`     needsTracking: ${order.needsTracking}`);
          console.log(`     Status: ${order.internalStatus}`);
        });
      }
      return;
    }

    // 3. Analyze orders needing tracking
    console.log('3️⃣ Analyzing Orders:');
    ordersQuery.forEach(doc => {
      const order = doc.data();
      console.log(`\n   📦 Order: ${order.orderId}`);
      console.log(`      Status: ${order.internalStatus}`);
      console.log(`      AWB: ${order.shipmentInfo?.awb || '❌ Missing'}`);
      console.log(`      Courier: ${order.shipmentInfo?.courierPartner}`);
      console.log(`      Customer: ${order.customerInfo?.name} (${order.customerInfo?.phone})`);
      console.log(`      Last Tracked: ${order.shipmentInfo?.lastTrackedAt || 'Never'}`);
      console.log(`      Current Status: ${order.shipmentInfo?.currentTrackingStatus || 'None'}`);
      console.log(`      Notification History:`);
      console.log(`        - Last Notified: ${order.notificationHistory?.lastNotifiedStatus || 'None'}`);
      console.log(`        - Last Notified At: ${order.notificationHistory?.lastNotifiedAt || 'Never'}`);
      console.log(`      WhatsApp Opt-in: ${order.customerNotifications?.notificationPreferences?.whatsapp !== false ? '✅ Yes' : '❌ No'}`);
    });

    // 4. Check WhatsApp configuration
    console.log('\n\n4️⃣ Checking WhatsApp Configuration...');
    const whatsappConfigured = !!(
      process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
    );
    
    console.log('   - Access Token:', process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
    console.log('   - Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅ Set' : '❌ Missing');
    console.log('   - Business Account ID:', process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ? '✅ Set' : '❌ Missing');
    
    if (!whatsappConfigured) {
      console.log('\n   ⚠️  WhatsApp not fully configured - notifications will fail!');
    }

    // 5. Check notification logs
    console.log('\n\n5️⃣ Checking Recent Notification Logs...');
    const notificationLogs = await db.collection('notification_logs')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    if (notificationLogs.empty) {
      console.log('   No notification logs found');
    } else {
      console.log(`   Found ${notificationLogs.size} recent notifications:\n`);
      notificationLogs.forEach(doc => {
        const log = doc.data();
        console.log(`   - ${log.notificationType} for ${log.orderId}`);
        console.log(`     Status: ${log.status}`);
        console.log(`     Channel: ${log.channel}`);
        if (log.error) {
          console.log(`     Error: ${log.error}`);
        }
        if (log.messageId) {
          console.log(`     Message ID: ${log.messageId}`);
        }
        console.log('');
      });
    }

    console.log('\n✅ Diagnostic complete!\n');

  } catch (error) {
    console.error('❌ Error during diagnostic:', error);
  }
}

// Run the test
testTrackingSync()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
