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

async function fixCustomer(phone) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`FIXING: ${phone}`);
  console.log('='.repeat(80));

  // Try different phone formats
  const phoneVariants = [
    phone,
    phone.startsWith('+91') ? phone : `+91${phone}`,
    phone.startsWith('+91') ? phone.substring(3) : phone
  ];

  let foundDoc = null;
  let foundCustomer = null;

  // Try each variant
  for (const variant of phoneVariants) {
    try {
      const snapshot = await db.collection('customers')
        .where('phone', '==', variant)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        foundDoc = snapshot.docs[0];
        foundCustomer = foundDoc.data();
        console.log(`✅ Found customer: ${foundDoc.id} (${foundCustomer.name})`);
        break;
      }
    } catch (error) {
      // Continue to next variant
    }
  }

  if (!foundCustomer) {
    console.log('❌ Customer not found');
    return;
  }

  // Check current status
  const hasDefaultAddress = !!foundCustomer.defaultAddress;
  const savedAddresses = foundCustomer.savedAddresses || [];

  console.log(`\nCurrent status:`);
  console.log(`  defaultAddress: ${hasDefaultAddress ? 'YES' : 'NO'}`);
  console.log(`  savedAddresses: ${savedAddresses.length} address(es)`);

  if (!hasDefaultAddress) {
    console.log('\n⚠️  No defaultAddress - checking recent orders for address...');
    
    try {
      const ordersSnapshot = await db.collection('orders')
        .where('customerInfo.phone', '==', foundCustomer.phone)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (!ordersSnapshot.empty) {
        const latestOrder = ordersSnapshot.docs[0].data();
        if (latestOrder.shippingAddress) {
          console.log('✅ Found address in latest order');
          console.log('  ', latestOrder.shippingAddress.street);
          console.log('  ', `${latestOrder.shippingAddress.city}, ${latestOrder.shippingAddress.state} ${latestOrder.shippingAddress.zip}`);
          
          console.log('\n🔧 Updating customer with address from order...');
          await foundDoc.ref.update({
            defaultAddress: latestOrder.shippingAddress,
            savedAddresses: [latestOrder.shippingAddress],
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log('✅ FIXED: Added address from order to customer profile');
          return;
        }
      }
      
      console.log('❌ No orders with shipping address found');
      return;
    } catch (error) {
      console.log('❌ Error fetching orders:', error.message);
      return;
    }
  }

  // Has defaultAddress but not in savedAddresses
  const addressExists = savedAddresses.some(addr => 
    addr.street === foundCustomer.defaultAddress.street &&
    addr.city === foundCustomer.defaultAddress.city &&
    addr.state === foundCustomer.defaultAddress.state &&
    addr.zip === foundCustomer.defaultAddress.zip &&
    addr.country === foundCustomer.defaultAddress.country
  );

  if (addressExists) {
    console.log('\n✅ No fix needed - address already in savedAddresses');
    return;
  }

  console.log('\n🔧 FIXING: Adding defaultAddress to savedAddresses...');
  
  await foundDoc.ref.update({
    savedAddresses: [...savedAddresses, foundCustomer.defaultAddress],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('✅ FIXED: Address added to savedAddresses');
}

async function main() {
  const phoneNumbers = [
    '9819080113',
    '9680790855',
    '9999968191'
  ];

  for (const phone of phoneNumbers) {
    await fixCustomer(phone);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('ALL FIXES COMPLETE');
  console.log('='.repeat(80));
}

main()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
