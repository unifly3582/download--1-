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

async function findFailedPayments() {
  try {
    console.log('🔍 Searching for orders with failed/pending payments...\n');

    // Get all orders with payment_pending status
    const pendingSnapshot = await db.collection('orders')
      .where('internalStatus', '==', 'payment_pending')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    console.log(`Found ${pendingSnapshot.size} orders with payment_pending status\n`);

    const results = {
      pending: [],
      failed: [],
      completed: [],
      other: []
    };

    pendingSnapshot.forEach(doc => {
      const data = doc.data();
      const paymentStatus = data.paymentInfo?.status;
      
      const orderInfo = {
        orderId: data.orderId,
        docId: doc.id,
        internalStatus: data.internalStatus,
        paymentStatus: paymentStatus,
        paymentMethod: data.paymentInfo?.method,
        razorpayOrderId: data.paymentInfo?.razorpayOrderId,
        failureReason: data.paymentInfo?.failureReason,
        errorCode: data.paymentInfo?.errorCode,
        customer: data.customerInfo?.name,
        phone: data.customerInfo?.phone,
        amount: data.pricingInfo?.grandTotal,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      };

      if (paymentStatus === 'Pending') {
        results.pending.push(orderInfo);
      } else if (paymentStatus === 'Failed') {
        results.failed.push(orderInfo);
      } else if (paymentStatus === 'Completed') {
        results.completed.push(orderInfo);
      } else {
        results.other.push(orderInfo);
      }
    });

    console.log('📊 BREAKDOWN BY PAYMENT STATUS:\n');
    console.log(`✅ Completed: ${results.completed.length}`);
    console.log(`⏳ Pending: ${results.pending.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`❓ Other: ${results.other.length}\n`);

    if (results.failed.length > 0) {
      console.log('❌ FAILED PAYMENTS (Will show in Payment Failed tab):\n');
      results.failed.forEach(order => {
        console.log(`Order ${order.orderId}:`);
        console.log(`  Customer: ${order.customer} (${order.phone})`);
        console.log(`  Amount: ₹${order.amount}`);
        console.log(`  Payment Method: ${order.paymentMethod}`);
        console.log(`  Failure Reason: ${order.failureReason || 'N/A'}`);
        console.log(`  Error Code: ${order.errorCode || 'N/A'}`);
        console.log(`  Created: ${order.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ NO FAILED PAYMENTS FOUND\n');
    }

    if (results.pending.length > 0) {
      console.log('⏳ PENDING PAYMENTS (Not yet failed, won\'t show in Payment Failed tab):\n');
      results.pending.slice(0, 5).forEach(order => {
        console.log(`Order ${order.orderId}:`);
        console.log(`  Customer: ${order.customer} (${order.phone})`);
        console.log(`  Amount: ₹${order.amount}`);
        console.log(`  Payment Method: ${order.paymentMethod}`);
        console.log(`  Razorpay Order ID: ${order.razorpayOrderId || 'N/A'}`);
        console.log(`  Created: ${order.createdAt}`);
        console.log('');
      });
      if (results.pending.length > 5) {
        console.log(`... and ${results.pending.length - 5} more pending orders\n`);
      }
    }

    console.log('\n💡 EXPLANATION:');
    console.log('================');
    console.log('The "Payment Failed" tab shows orders where:');
    console.log('  1. internalStatus = "payment_pending"');
    console.log('  2. paymentInfo.status = "Failed"');
    console.log('');
    console.log('Orders with status "Pending" are still waiting for payment.');
    console.log('They will only appear in the tab once the payment actually fails.');
    console.log('');
    console.log('This typically happens when:');
    console.log('  - Customer closes the payment window');
    console.log('  - Payment gateway rejects the transaction');
    console.log('  - Card/UPI payment fails');
    console.log('  - Razorpay webhook updates the status to "Failed"');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

findFailedPayments();
