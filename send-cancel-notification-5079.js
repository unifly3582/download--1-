// Manually send cancellation notification for order 5079
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

async function sendCancellationNotification() {
  console.log('📤 Sending cancellation notification for order 5079\n');

  try {
    // Get order details
    const orderDoc = await db.collection('orders').doc('5079').get();
    
    if (!orderDoc.exists) {
      console.error('❌ Order 5079 not found');
      return;
    }

    const order = orderDoc.data();
    console.log('📦 Order Details:');
    console.log(`   Order ID: ${order.orderId}`);
    console.log(`   Customer: ${order.customerInfo.name}`);
    console.log(`   Phone: ${order.customerInfo.phone}`);
    console.log(`   Status: ${order.internalStatus}`);
    console.log('');

    // Send WhatsApp notification
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      console.error('❌ Missing WhatsApp credentials');
      return;
    }

    // Clean phone number
    const phone = order.customerInfo.phone.replace(/[\s+\-()]/g, '');

    const payload = {
      to: phone,
      recipient_type: "individual",
      type: "template",
      template: {
        language: {
          policy: "deterministic",
          code: "en"
        },
        name: "order_cancelled",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: order.customerInfo.name },
              { type: "text", text: order.orderId }
            ]
          }
        ]
      }
    };

    console.log('📤 Sending WhatsApp message...');
    console.log(`   To: ${phone}`);
    console.log(`   Template: order_cancelled`);
    console.log('');

    const response = await fetch(
      `https://crm.marketingravan.com/api/meta/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );

    const responseData = await response.json();

    console.log(`📊 Response Status: ${response.status}`);
    console.log('📊 Response:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('');

    if (response.ok) {
      console.log('✅ Cancellation notification sent successfully!');
      
      // Update order with notification timestamp
      await db.collection('orders').doc('5079').update({
        'customerNotifications.lastNotificationSent': new Date().toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Order updated with notification timestamp');
    } else {
      console.log('❌ Failed to send notification');
      console.log(`   Error: ${responseData.error?.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

sendCancellationNotification()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
