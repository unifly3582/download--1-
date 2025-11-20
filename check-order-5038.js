// Check order 5038 details
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

async function checkOrder() {
  console.log('🔍 Checking Order 5038...\n');

  try {
    // Check in orders collection
    console.log('1️⃣ Checking orders collection...');
    const orderDoc = await db.collection('orders').doc('5038').get();
    
    if (!orderDoc.exists) {
      console.log('❌ Order 5038 NOT FOUND in orders collection!\n');
      
      // Search by orderId field
      console.log('2️⃣ Searching by orderId field...');
      const orderQuery = await db.collection('orders')
        .where('orderId', '==', '5038')
        .limit(1)
        .get();
      
      if (orderQuery.empty) {
        console.log('❌ Order 5038 not found by orderId field either!\n');
        
        // Search for similar order IDs
        console.log('3️⃣ Searching for similar order IDs...');
        const similarOrders = await db.collection('orders')
          .where('orderId', '>=', '5030')
          .where('orderId', '<=', '5040')
          .get();
        
        console.log(`Found ${similarOrders.size} orders between 5030-5040:\n`);
        similarOrders.forEach(doc => {
          const order = doc.data();
          console.log(`   - Document ID: ${doc.id}`);
          console.log(`     Order ID: ${order.orderId}`);
          console.log(`     Customer: ${order.customerInfo?.name}`);
          console.log(`     Status: ${order.internalStatus}`);
          console.log('');
        });
        
      } else {
        const foundDoc = orderQuery.docs[0];
        console.log(`✅ Found order with orderId='5038' but document ID is: ${foundDoc.id}\n`);
        console.log('Order Data:');
        console.log(JSON.stringify(foundDoc.data(), null, 2));
      }
      
    } else {
      console.log('✅ Order 5038 found!\n');
      const orderData = orderDoc.data();
      
      console.log('📦 Order Details:');
      console.log('   Document ID:', orderDoc.id);
      console.log('   Order ID:', orderData.orderId);
      console.log('   Customer:', orderData.customerInfo?.name);
      console.log('   Phone:', orderData.customerInfo?.phone);
      console.log('   Email:', orderData.customerInfo?.email);
      console.log('   Status:', orderData.internalStatus);
      console.log('   Customer Facing Status:', orderData.customerFacingStatus);
      console.log('');
      
      console.log('📍 Shipping Info:');
      console.log('   Courier:', orderData.shipmentInfo?.courierPartner);
      console.log('   AWB:', orderData.shipmentInfo?.awb);
      console.log('   Tracking Status:', orderData.shipmentInfo?.currentTrackingStatus);
      console.log('   Last Tracked:', orderData.shipmentInfo?.lastTrackedAt);
      console.log('   Needs Tracking:', orderData.needsTracking);
      console.log('');
      
      console.log('💰 Pricing:');
      console.log('   Subtotal:', orderData.pricingInfo?.subtotal);
      console.log('   Shipping:', orderData.pricingInfo?.shippingCharges);
      console.log('   Grand Total:', orderData.pricingInfo?.grandTotal);
      console.log('');
      
      console.log('📦 Items:');
      orderData.items?.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.productName} x ${item.quantity} = ₹${item.totalPrice}`);
      });
      console.log('');
      
      console.log('🏠 Shipping Address:');
      console.log('   Street:', orderData.shippingAddress?.street);
      console.log('   City:', orderData.shippingAddress?.city);
      console.log('   State:', orderData.shippingAddress?.state);
      console.log('   ZIP:', orderData.shippingAddress?.zip);
      console.log('');
      
      console.log('📅 Timestamps:');
      console.log('   Created:', orderData.createdAt);
      console.log('   Updated:', orderData.updatedAt);
      console.log('');
      
      // Check customer orders collection
      console.log('4️⃣ Checking customer orders collection...');
      const customerId = orderData.customerInfo?.customerId;
      if (customerId) {
        const customerOrderDoc = await db.collection('customers')
          .doc(customerId)
          .collection('orders')
          .doc('5038')
          .get();
        
        if (customerOrderDoc.exists) {
          console.log('   ✅ Found in customer orders collection');
        } else {
          console.log('   ❌ NOT found in customer orders collection');
        }
      } else {
        console.log('   ⚠️  No customerId found in order');
      }
      
      // Full data dump
      console.log('\n📄 Full Order Data:');
      console.log(JSON.stringify(orderData, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkOrder()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
