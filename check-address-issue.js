const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('./temp-service-account.json'))
  });
}

const db = admin.firestore();

async function checkCustomerAddress(phoneNumber) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Checking customer: ${phoneNumber}`);
  console.log('='.repeat(80));

  try {
    // Find customer by phone
    const customersSnapshot = await db.collection('customers')
      .where('phone', '==', phoneNumber)
      .get();

    if (customersSnapshot.empty) {
      console.log('❌ Customer not found');
      return;
    }

    const customerDoc = customersSnapshot.docs[0];
    const customer = customerDoc.data();
    
    console.log('\n📋 Customer Profile:');
    console.log('Customer ID:', customerDoc.id);
    console.log('Name:', customer.name);
    console.log('Phone:', customer.phone);
    console.log('Email:', customer.email || 'N/A');
    console.log('Created At:', customer.createdAt?.toDate?.() || customer.createdAt);
    
    console.log('\n📍 Address Information:');
    if (customer.address) {
      console.log('Address Object:', JSON.stringify(customer.address, null, 2));
    } else {
      console.log('❌ NO ADDRESS SAVED IN PROFILE');
    }

    // Check recent orders
    console.log('\n📦 Recent Orders:');
    const ordersSnapshot = await db.collection('orders')
      .where('customerId', '==', customerDoc.id)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    if (ordersSnapshot.empty) {
      console.log('No orders found');
    } else {
      ordersSnapshot.forEach((orderDoc, index) => {
        const order = orderDoc.data();
        console.log(`\nOrder ${index + 1} (ID: ${orderDoc.id}):`);
        console.log('  Order Number:', order.orderNumber);
        console.log('  Created:', order.createdAt?.toDate?.() || order.createdAt);
        console.log('  Status:', order.status);
        
        if (order.shippingAddress) {
          console.log('  Shipping Address:', JSON.stringify(order.shippingAddress, null, 4));
        } else {
          console.log('  ❌ NO SHIPPING ADDRESS IN ORDER');
        }
      });
    }

  } catch (error) {
    console.error('Error checking customer:', error);
  }
}

async function main() {
  const phoneNumbers = [
    '+919999968191',
    '+919652132014',
    '+918847616279'
  ];

  for (const phone of phoneNumbers) {
    await checkCustomerAddress(phone);
  }

  console.log('\n' + '='.repeat(80));
  console.log('Analysis complete');
  console.log('='.repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
