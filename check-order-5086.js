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

async function checkOrder5086() {
  try {
    console.log('🔍 Checking Order 5086...\n');

    // Query by orderId field
    const ordersSnapshot = await db.collection('orders')
      .where('orderId', '==', '5086')
      .get();

    if (ordersSnapshot.empty) {
      console.log('❌ Order 5086 not found in database');
      return;
    }

    const orderDoc = ordersSnapshot.docs[0];
    const orderData = orderDoc.data();

    console.log('✅ Order 5086 found!');
    console.log('Document ID:', orderDoc.id);
    console.log('\n📋 Order Details:\n');
    console.log('Order ID:', orderData.orderId);
    console.log('Internal Status:', orderData.internalStatus);
    console.log('Customer:', orderData.customerInfo?.name);
    console.log('Phone:', orderData.customerInfo?.phone);
    console.log('\n💳 Payment Info:');
    console.log('Method:', orderData.paymentInfo?.method);
    console.log('Status:', orderData.paymentInfo?.status);
    console.log('Transaction ID:', orderData.paymentInfo?.transactionId || 'N/A');
    console.log('Razorpay Order ID:', orderData.paymentInfo?.razorpayOrderId || 'N/A');
    console.log('Failure Reason:', orderData.paymentInfo?.failureReason || 'N/A');
    console.log('Error Code:', orderData.paymentInfo?.errorCode || 'N/A');
    console.log('Last Failed Payment ID:', orderData.paymentInfo?.lastFailedPaymentId || 'N/A');
    
    console.log('\n📊 Full Payment Info Object:');
    console.log(JSON.stringify(orderData.paymentInfo, null, 2));

    console.log('\n🔍 Payment Failed Tab Criteria Check:');
    console.log('-----------------------------------');
    const meetsInternalStatus = orderData.internalStatus === 'payment_pending';
    const meetsPaymentStatus = orderData.paymentInfo?.status === 'Failed';
    
    console.log(`✓ internalStatus === 'payment_pending': ${meetsInternalStatus ? '✅ YES' : '❌ NO'}`);
    console.log(`  Current value: "${orderData.internalStatus}"`);
    console.log(`✓ paymentInfo.status === 'Failed': ${meetsPaymentStatus ? '✅ YES' : '❌ NO'}`);
    console.log(`  Current value: "${orderData.paymentInfo?.status}"`);
    
    console.log('\n🎯 Should appear in Payment Failed tab:', 
      meetsInternalStatus && meetsPaymentStatus ? '✅ YES' : '❌ NO');

    if (!meetsInternalStatus || !meetsPaymentStatus) {
      console.log('\n⚠️  REASON NOT SHOWING:');
      if (!meetsInternalStatus) {
        console.log(`   - Internal status is "${orderData.internalStatus}" instead of "payment_pending"`);
      }
      if (!meetsPaymentStatus) {
        console.log(`   - Payment status is "${orderData.paymentInfo?.status}" instead of "Failed"`);
      }
    }

    console.log('\n📅 Timestamps:');
    console.log('Created At:', orderData.createdAt?.toDate?.() || orderData.createdAt);
    console.log('Updated At:', orderData.updatedAt?.toDate?.() || orderData.updatedAt);

    console.log('\n💰 Pricing Info:');
    console.log('Grand Total: ₹' + orderData.pricingInfo?.grandTotal);
    console.log('Subtotal: ₹' + orderData.pricingInfo?.subtotal);
    console.log('Discount: ₹' + (orderData.pricingInfo?.discount || 0));
    console.log('Shipping: ₹' + (orderData.pricingInfo?.shippingCharges || 0));
    console.log('COD Charges: ₹' + (orderData.pricingInfo?.codCharges || 0));

    console.log('\n📦 Order Source:', orderData.orderSource);
    
    if (orderData.trafficSource) {
      console.log('\n🌐 Traffic Source:');
      console.log('Source:', orderData.trafficSource.source);
      console.log('Campaign:', orderData.trafficSource.campaign || 'N/A');
    }

    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Error checking order:', error);
  } finally {
    process.exit(0);
  }
}

checkOrder5086();
