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

async function testPaymentPendingTab() {
  try {
    console.log('🧪 Testing Payment Pending Tab Query...\n');

    // Simulate the exact query that the API will use
    const query = db.collection('orders')
      .where('internalStatus', '==', 'payment_pending')
      .orderBy('createdAt', 'desc')
      .limit(50);

    const snapshot = await query.get();

    console.log(`✅ Query successful! Found ${snapshot.size} orders\n`);

    if (snapshot.empty) {
      console.log('❌ No orders found with payment_pending status');
      return;
    }

    console.log('📋 Orders that will appear in Payment Pending tab:\n');
    console.log('═'.repeat(80));

    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n${index + 1}. Order ${data.orderId} (Doc ID: ${doc.id})`);
      console.log(`   Customer: ${data.customerInfo?.name} (${data.customerInfo?.phone})`);
      console.log(`   Amount: ₹${data.pricingInfo?.grandTotal}`);
      console.log(`   Payment Method: ${data.paymentInfo?.method}`);
      console.log(`   Payment Status: ${data.paymentInfo?.status}`);
      console.log(`   Razorpay Order: ${data.paymentInfo?.razorpayOrderId || 'N/A'}`);
      console.log(`   Created: ${data.createdAt?.toDate?.() || data.createdAt}`);
      
      if (data.paymentInfo?.failureReason) {
        console.log(`   ⚠️  Failure Reason: ${data.paymentInfo.failureReason}`);
      }
      if (data.paymentInfo?.errorCode) {
        console.log(`   ⚠️  Error Code: ${data.paymentInfo.errorCode}`);
      }
    });

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Test Complete!');
    console.log(`\n💡 These ${snapshot.size} orders will appear in the "Payment Pending" tab`);
    console.log('   when you navigate to the Orders page in the admin panel.\n');

  } catch (error) {
    console.error('❌ Error testing query:', error);
  } finally {
    process.exit(0);
  }
}

testPaymentPendingTab();
