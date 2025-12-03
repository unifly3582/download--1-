/**
 * Find all duplicate customer profiles
 */

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

async function findDuplicates() {
  console.log('🔍 Finding Duplicate Customer Profiles...');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Get all customers
    const customersSnapshot = await db.collection('customers').get();
    
    console.log(`📊 Total customer documents: ${customersSnapshot.size}`);
    console.log('');
    
    // Group by phone number
    const phoneGroups = {};
    
    customersSnapshot.forEach((doc) => {
      const customer = doc.data();
      const phone = customer.phone;
      
      if (!phone) {
        console.log(`⚠️  Customer ${doc.id} has no phone number`);
        return;
      }
      
      if (!phoneGroups[phone]) {
        phoneGroups[phone] = [];
      }
      
      phoneGroups[phone].push({
        docId: doc.id,
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        totalOrders: customer.totalOrders || 0,
        totalSpent: customer.totalSpent || 0,
        hasDefaultAddress: !!customer.defaultAddress,
        savedAddressesCount: customer.savedAddresses?.length || 0,
        createdAt: customer.createdAt?.toDate?.() || null
      });
    });
    
    // Find duplicates
    const duplicates = Object.entries(phoneGroups).filter(([phone, customers]) => customers.length > 1);
    
    console.log('📈 SUMMARY');
    console.log('-'.repeat(60));
    console.log(`Unique phone numbers: ${Object.keys(phoneGroups).length}`);
    console.log(`Phone numbers with duplicates: ${duplicates.length}`);
    console.log(`Total duplicate profiles: ${duplicates.reduce((sum, [_, customers]) => sum + customers.length - 1, 0)}`);
    console.log('');
    
    if (duplicates.length > 0) {
      console.log('🚨 DUPLICATE CUSTOMERS');
      console.log('-'.repeat(60));
      
      duplicates.forEach(([phone, customers]) => {
        console.log(`\n📱 Phone: ${phone} (${customers.length} profiles)`);
        customers.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        customers.forEach((customer, index) => {
          console.log(`  ${index + 1}. ${customer.docId}`);
          console.log(`     Name: ${customer.name || 'N/A'}`);
          console.log(`     Email: ${customer.email || 'N/A'}`);
          console.log(`     Orders: ${customer.totalOrders}, Spent: ₹${customer.totalSpent}`);
          console.log(`     Address: ${customer.hasDefaultAddress ? 'Yes' : 'No'}, Saved: ${customer.savedAddressesCount}`);
          console.log(`     Created: ${customer.createdAt || 'N/A'}`);
        });
      });
      
      console.log('');
      console.log('💡 RECOMMENDATION');
      console.log('-'.repeat(60));
      console.log('These duplicates should be merged. The newest profile with');
      console.log('the most complete data should be kept, and others deleted.');
    } else {
      console.log('✅ No duplicate customers found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findDuplicates()
  .then(() => {
    console.log('');
    console.log('✅ Analysis completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
