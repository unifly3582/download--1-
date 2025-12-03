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

async function fixCustomerAddresses(phoneNumbers) {
  console.log('Starting address fix for customers...\n');
  
  for (const phone of phoneNumbers) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Processing: ${phone}`);
    console.log('='.repeat(80));
    
    try {
      // Find customer by phone
      const customersSnapshot = await db.collection('customers')
        .where('phone', '==', phone)
        .get();

      if (customersSnapshot.empty) {
        console.log(`❌ Customer not found: ${phone}`);
        continue;
      }

      const customerDoc = customersSnapshot.docs[0];
      const customer = customerDoc.data();
      
      console.log(`✓ Found customer: ${customerDoc.id}`);
      console.log(`  Name: ${customer.name}`);
      console.log(`  Phone: ${customer.phone}`);
      
      // Check current address status
      const hasDefaultAddress = !!customer.defaultAddress;
      const savedAddresses = customer.savedAddresses || [];
      
      console.log(`\n📍 Current Address Status:`);
      console.log(`  Has defaultAddress: ${hasDefaultAddress}`);
      console.log(`  savedAddresses count: ${savedAddresses.length}`);
      
      if (hasDefaultAddress) {
        console.log(`  defaultAddress:`, JSON.stringify(customer.defaultAddress, null, 4));
      }
      
      if (savedAddresses.length > 0) {
        console.log(`  savedAddresses:`, JSON.stringify(savedAddresses, null, 4));
      }
      
      // Fix: If defaultAddress exists but not in savedAddresses, add it
      if (hasDefaultAddress) {
        const addressExists = savedAddresses.some(addr => 
          addr.street === customer.defaultAddress.street &&
          addr.city === customer.defaultAddress.city &&
          addr.state === customer.defaultAddress.state &&
          addr.zip === customer.defaultAddress.zip &&
          addr.country === customer.defaultAddress.country
        );
        
        if (!addressExists) {
          console.log(`\n🔧 FIXING: Adding defaultAddress to savedAddresses...`);
          
          await customerDoc.ref.update({
            savedAddresses: [...savedAddresses, customer.defaultAddress],
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`✅ Fixed! Address added to savedAddresses`);
        } else {
          console.log(`\n✓ No fix needed - address already in savedAddresses`);
        }
      } else {
        console.log(`\n⚠️  No defaultAddress found - nothing to fix`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${phone}:`, error.message);
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('Address fix complete!');
  console.log('='.repeat(80));
}

// Run the fix
const phoneNumbers = [
  '+919999968191',
  '+919652132014',
  '+918847616279'
];

fixCustomerAddresses(phoneNumbers)
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
