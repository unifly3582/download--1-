const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin using environment variables
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

const db = admin.firestore();

async function verifyCustomerAddress(phone) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Verifying Address for: ${phone}`);
  console.log('='.repeat(80));

  try {
    // Find customer by phone
    const customersSnapshot = await db.collection('customers')
      .where('phone', '==', phone)
      .get();

    if (customersSnapshot.empty) {
      console.log('❌ Customer not found');
      return;
    }

    const customerDoc = customersSnapshot.docs[0];
    const customer = customerDoc.data();
    
    console.log('\n✅ Customer Found:');
    console.log('  Customer ID:', customerDoc.id);
    console.log('  Name:', customer.name);
    console.log('  Phone:', customer.phone);
    console.log('  Email:', customer.email || 'N/A');
    
    console.log('\n📍 DEFAULT ADDRESS:');
    if (customer.defaultAddress) {
      console.log(JSON.stringify(customer.defaultAddress, null, 2));
    } else {
      console.log('  ❌ No default address');
    }
    
    console.log('\n📚 SAVED ADDRESSES (Address Book):');
    const savedAddresses = customer.savedAddresses || [];
    if (savedAddresses.length > 0) {
      console.log(`  Total: ${savedAddresses.length} address(es)`);
      savedAddresses.forEach((addr, index) => {
        console.log(`\n  Address ${index + 1}:`);
        console.log(JSON.stringify(addr, null, 2));
      });
    } else {
      console.log('  ❌ No saved addresses');
    }
    
    // Check if defaultAddress is in savedAddresses
    if (customer.defaultAddress && savedAddresses.length > 0) {
      const isInSaved = savedAddresses.some(addr => 
        addr.street === customer.defaultAddress.street &&
        addr.city === customer.defaultAddress.city &&
        addr.state === customer.defaultAddress.state &&
        addr.zip === customer.defaultAddress.zip &&
        addr.country === customer.defaultAddress.country
      );
      
      console.log('\n✅ VERIFICATION:');
      if (isInSaved) {
        console.log('  ✅ Default address IS in saved addresses - CORRECT!');
      } else {
        console.log('  ❌ Default address NOT in saved addresses - NEEDS FIX!');
      }
    }
    
    // Check recent orders
    console.log('\n📦 RECENT ORDERS:');
    const ordersSnapshot = await db.collection('orders')
      .where('customerInfo.customerId', '==', customerDoc.id)
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();

    if (ordersSnapshot.empty) {
      console.log('  No orders found');
    } else {
      console.log(`  Total: ${ordersSnapshot.size} recent order(s)`);
      ordersSnapshot.forEach((orderDoc, index) => {
        const order = orderDoc.data();
        console.log(`\n  Order ${index + 1}:`);
        console.log('    Order ID:', order.orderId);
        console.log('    Created:', order.createdAt?.toDate?.() || order.createdAt);
        console.log('    Status:', order.customerFacingStatus || order.internalStatus);
        
        if (order.shippingAddress) {
          console.log('    Shipping Address:');
          console.log('      ', order.shippingAddress.street);
          console.log('      ', `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
  
  console.log('\n' + '='.repeat(80));
}

// Verify the customer
verifyCustomerAddress('+919999968191')
  .then(() => {
    console.log('\n✅ Verification complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
