/**
 * Check Recent Order Creation Attempts
 * Looks for recent order creation logs and errors
 */

const admin = require('firebase-admin');
const serviceAccount = require('./temp-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const PHONE = '8700925487';
const NORMALIZED_PHONE = '+918700925487';

async function checkRecentOrderAttempts() {
  console.log('=== Checking Recent Order Creation Attempts ===\n');
  
  try {
    // Check for recent orders in last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    console.log('1. Checking for recent orders from', PHONE);
    console.log('   Looking for orders created after:', tenMinutesAgo.toISOString());
    console.log('');
    
    // Try with both phone formats
    const phoneFormats = [PHONE, NORMALIZED_PHONE];
    
    for (const phoneFormat of phoneFormats) {
      console.log(`   Searching with phone: ${phoneFormat}`);
      
      const ordersSnapshot = await db.collection('orders')
        .where('customerInfo.phone', '==', phoneFormat)
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(tenMinutesAgo))
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
      
      if (!ordersSnapshot.empty) {
        console.log(`   ✅ Found ${ordersSnapshot.size} recent order(s):\n`);
        
        ordersSnapshot.forEach(doc => {
          const order = doc.data();
          console.log(`   Order ID: ${order.orderId}`);
          console.log(`   Status: ${order.internalStatus}`);
          console.log(`   Payment: ${order.paymentInfo?.method} - ${order.paymentInfo?.status}`);
          console.log(`   Customer ID: ${order.customerInfo?.customerId}`);
          console.log(`   Items: ${order.items?.length}`);
          console.log(`   Total: ₹${order.pricingInfo?.grandTotal}`);
          console.log(`   Created: ${order.createdAt?.toDate?.()?.toISOString()}`);
          console.log('');
        });
      } else {
        console.log(`   ❌ No recent orders found with phone: ${phoneFormat}\n`);
      }
    }
    
    // Check customer data
    console.log('\n2. Checking customer data');
    
    const customerSnapshot = await db.collection('customers')
      .where('phone', '==', NORMALIZED_PHONE)
      .limit(1)
      .get();
    
    if (!customerSnapshot.empty) {
      const customer = customerSnapshot.docs[0].data();
      console.log('   ✅ Customer found:');
      console.log(`   Customer ID: ${customer.customerId}`);
      console.log(`   Name: ${customer.name}`);
      console.log(`   Phone: ${customer.phone}`);
      console.log(`   Email: ${customer.email || 'N/A'}`);
      console.log(`   Total Orders: ${customer.totalOrders || 0}`);
      console.log(`   Default Address: ${customer.defaultAddress ? 'Yes' : 'No'}`);
      if (customer.defaultAddress) {
        console.log(`     Street: ${customer.defaultAddress.street}`);
        console.log(`     City: ${customer.defaultAddress.city}`);
        console.log(`     State: ${customer.defaultAddress.state}`);
        console.log(`     ZIP: ${customer.defaultAddress.zip}`);
      }
    } else {
      console.log('   ❌ Customer not found');
    }
    
    // Check for payment pending orders
    console.log('\n3. Checking for payment pending orders');
    
    const pendingSnapshot = await db.collection('orders')
      .where('customerInfo.phone', 'in', [PHONE, NORMALIZED_PHONE])
      .where('internalStatus', '==', 'payment_pending')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    if (!pendingSnapshot.empty) {
      console.log(`   ⚠️  Found ${pendingSnapshot.size} payment pending order(s):\n`);
      
      pendingSnapshot.forEach(doc => {
        const order = doc.data();
        console.log(`   Order ID: ${order.orderId}`);
        console.log(`   Razorpay Order ID: ${order.paymentInfo?.razorpayOrderId}`);
        console.log(`   Amount: ₹${order.pricingInfo?.grandTotal}`);
        console.log(`   Created: ${order.createdAt?.toDate?.()?.toISOString()}`);
        console.log('');
      });
    } else {
      console.log('   ✅ No payment pending orders');
    }
    
    // Summary
    console.log('\n=== SUMMARY ===\n');
    console.log('If no recent orders found:');
    console.log('  → Order creation failed BEFORE database save');
    console.log('  → Check your local server logs for errors');
    console.log('  → Look for [CUSTOMER_ORDER] or [RAZORPAY_ORDER] entries');
    console.log('');
    console.log('Common errors to look for:');
    console.log('  1. Schema validation failed');
    console.log('  2. Product not found');
    console.log('  3. Variation/SKU not found');
    console.log('  4. Insufficient stock');
    console.log('  5. Customer data validation failed');
    console.log('  6. Cannot use "undefined" as Firestore value');
    console.log('');
    console.log('To see detailed logs, check your terminal where the dev server is running');
    console.log('Or check production logs with:');
    console.log('  pm2 logs');
    console.log('  tail -f /path/to/logs/error.log');
    
  } catch (error) {
    console.error('\n❌ Error checking orders:', error);
    console.error('Stack:', error.stack);
  }
}

checkRecentOrderAttempts()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
