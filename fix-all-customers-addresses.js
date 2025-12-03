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

async function fixAllCustomerAddresses() {
  console.log('Starting bulk address fix for ALL customers...\n');
  
  let fixedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  try {
    // Get all customers
    const customersSnapshot = await db.collection('customers').get();
    
    console.log(`Found ${customersSnapshot.size} total customers\n`);
    
    for (const customerDoc of customersSnapshot.docs) {
      const customer = customerDoc.data();
      const customerId = customerDoc.id;
      
      try {
        // Check if customer has defaultAddress but it's not in savedAddresses
        const hasDefaultAddress = !!customer.defaultAddress;
        const savedAddresses = customer.savedAddresses || [];
        
        if (!hasDefaultAddress) {
          skippedCount++;
          continue;
        }
        
        // Check if defaultAddress already exists in savedAddresses
        const addressExists = savedAddresses.some(addr => 
          addr.street === customer.defaultAddress.street &&
          addr.city === customer.defaultAddress.city &&
          addr.state === customer.defaultAddress.state &&
          addr.zip === customer.defaultAddress.zip &&
          addr.country === customer.defaultAddress.country
        );
        
        if (addressExists) {
          skippedCount++;
          continue;
        }
        
        // Fix needed - add defaultAddress to savedAddresses
        console.log(`Fixing ${customerId} (${customer.name || 'N/A'}) - ${customer.phone}`);
        
        await customerDoc.ref.update({
          savedAddresses: [...savedAddresses, customer.defaultAddress],
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        fixedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing ${customerId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('Bulk Address Fix Complete!');
    console.log('='.repeat(80));
    console.log(`✅ Fixed: ${fixedCount} customers`);
    console.log(`⏭️  Skipped: ${skippedCount} customers (no fix needed)`);
    console.log(`❌ Errors: ${errorCount} customers`);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

fixAllCustomerAddresses()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
