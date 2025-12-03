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

async function diagnoseCustomer(phone) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`DIAGNOSING: ${phone}`);
  console.log('='.repeat(80));

  // Try different phone formats
  const phoneVariants = [
    phone,
    phone.startsWith('+91') ? phone : `+91${phone}`,
    phone.startsWith('+91') ? phone.substring(3) : phone
  ];
  
  console.log('\n🔍 Trying phone variants:', phoneVariants);

  let foundCustomer = null;
  let foundDoc = null;

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
        console.log(`\n✅ Found with phone variant: ${variant}`);
        break;
      }
    } catch (error) {
      console.log(`  ❌ Error with variant ${variant}:`, error.message);
    }
  }

  if (!foundCustomer) {
    console.log('\n❌ Customer NOT FOUND with any phone variant');
    
    // Try to find by partial match
    console.log('\n🔍 Searching for partial matches...');
    try {
      const allCustomers = await db.collection('customers').get();
      const matches = [];
      
      allCustomers.forEach(doc => {
        const data = doc.data();
        if (data.phone && (
          data.phone.includes(phone) || 
          phone.includes(data.phone.replace('+91', ''))
        )) {
          matches.push({ id: doc.id, phone: data.phone, name: data.name });
        }
      });
      
      if (matches.length > 0) {
        console.log(`\n📋 Found ${matches.length} partial match(es):`);
        matches.forEach(m => {
          console.log(`  - ${m.phone} (${m.name}) [ID: ${m.id}]`);
        });
      } else {
        console.log('  No partial matches found');
      }
    } catch (error) {
      console.log('  Error searching:', error.message);
    }
    
    return;
  }

  // Customer found - show details
  console.log('\n📋 CUSTOMER DETAILS:');
  console.log('  Customer ID:', foundDoc.id);
  console.log('  Name:', foundCustomer.name || 'N/A');
  console.log('  Phone:', foundCustomer.phone);
  console.log('  Email:', foundCustomer.email || 'N/A');
  console.log('  Created:', foundCustomer.createdAt?.toDate?.() || foundCustomer.createdAt || 'N/A');
  console.log('  Total Orders:', foundCustomer.totalOrders || 0);
  console.log('  Loyalty Tier:', foundCustomer.loyaltyTier || 'N/A');

  // Check addresses
  console.log('\n📍 ADDRESS STATUS:');
  
  const hasDefaultAddress = !!foundCustomer.defaultAddress;
  const savedAddresses = foundCustomer.savedAddresses || [];
  
  console.log(`  Has defaultAddress: ${hasDefaultAddress ? '✅ YES' : '❌ NO'}`);
  console.log(`  savedAddresses count: ${savedAddresses.length}`);
  
  if (hasDefaultAddress) {
    console.log('\n  📍 DEFAULT ADDRESS:');
    console.log('    ', foundCustomer.defaultAddress.street);
    console.log('    ', `${foundCustomer.defaultAddress.city}, ${foundCustomer.defaultAddress.state} ${foundCustomer.defaultAddress.zip}`);
    console.log('    ', foundCustomer.defaultAddress.country);
  }
  
  if (savedAddresses.length > 0) {
    console.log('\n  📚 SAVED ADDRESSES:');
    savedAddresses.forEach((addr, index) => {
      console.log(`\n    Address ${index + 1}:`);
      console.log('      ', addr.street);
      console.log('      ', `${addr.city}, ${addr.state} ${addr.zip}`);
      console.log('      ', addr.country);
    });
  } else {
    console.log('\n  ❌ NO SAVED ADDRESSES');
  }
  
  // Check if defaultAddress is in savedAddresses
  if (hasDefaultAddress) {
    const isInSaved = savedAddresses.some(addr => 
      addr.street === foundCustomer.defaultAddress.street &&
      addr.city === foundCustomer.defaultAddress.city &&
      addr.state === foundCustomer.defaultAddress.state &&
      addr.zip === foundCustomer.defaultAddress.zip &&
      addr.country === foundCustomer.defaultAddress.country
    );
    
    console.log('\n  🔍 VERIFICATION:');
    if (isInSaved) {
      console.log('    ✅ Default address IS in savedAddresses');
    } else if (savedAddresses.length === 0) {
      console.log('    ⚠️  Default address exists but savedAddresses is EMPTY');
      console.log('    🔧 NEEDS FIX: Should add defaultAddress to savedAddresses');
    } else {
      console.log('    ⚠️  Default address NOT in savedAddresses');
      console.log('    🔧 NEEDS FIX: Should add defaultAddress to savedAddresses');
    }
  }
  
  // Check recent orders
  console.log('\n📦 CHECKING RECENT ORDERS:');
  try {
    const ordersSnapshot = await db.collection('orders')
      .where('customerInfo.phone', '==', foundCustomer.phone)
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();

    if (ordersSnapshot.empty) {
      console.log('  No orders found');
    } else {
      console.log(`  Found ${ordersSnapshot.size} recent order(s):`);
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
        } else {
          console.log('    ❌ NO SHIPPING ADDRESS IN ORDER');
        }
      });
    }
  } catch (error) {
    console.log('  ⚠️  Could not fetch orders:', error.message);
  }
}

async function main() {
  const phoneNumbers = [
    '9819080113',
    '9680790855',
    '9999968191'
  ];

  for (const phone of phoneNumbers) {
    await diagnoseCustomer(phone);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('DIAGNOSIS COMPLETE');
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
