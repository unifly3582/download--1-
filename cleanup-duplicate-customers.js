/**
 * Clean up duplicate customer profiles
 * Keeps the newest profile with most complete data, deletes others
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

async function cleanupDuplicates() {
  console.log('🧹 Cleaning Up Duplicate Customer Profiles...');
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
        return;
      }
      
      if (!phoneGroups[phone]) {
        phoneGroups[phone] = [];
      }
      
      phoneGroups[phone].push({
        docId: doc.id,
        doc: doc,
        customer: customer
      });
    });
    
    // Find and clean duplicates
    const duplicates = Object.entries(phoneGroups).filter(([phone, customers]) => customers.length > 1);
    
    console.log(`🔍 Found ${duplicates.length} phone numbers with duplicates`);
    console.log('');
    
    let totalDeleted = 0;
    let totalKept = 0;
    
    for (const [phone, customers] of duplicates) {
      console.log(`📱 Processing: ${phone} (${customers.length} profiles)`);
      
      // Sort by priority:
      // 1. Has name and email (most complete)
      // 2. Has name only
      // 3. Has default address
      // 4. Newest (by createdAt)
      customers.sort((a, b) => {
        const aScore = (a.customer.name ? 2 : 0) + (a.customer.email ? 2 : 0) + (a.customer.defaultAddress ? 1 : 0);
        const bScore = (b.customer.name ? 2 : 0) + (b.customer.email ? 2 : 0) + (b.customer.defaultAddress ? 1 : 0);
        
        if (aScore !== bScore) {
          return bScore - aScore; // Higher score first
        }
        
        // If same score, prefer newer
        const aTime = a.customer.createdAt?.toDate?.() || new Date(0);
        const bTime = b.customer.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
      
      const keepCustomer = customers[0];
      const deleteCustomers = customers.slice(1);
      
      console.log(`  ✅ Keeping: ${keepCustomer.docId}`);
      console.log(`     Name: ${keepCustomer.customer.name || 'N/A'}`);
      console.log(`     Email: ${keepCustomer.customer.email || 'N/A'}`);
      console.log(`     Address: ${keepCustomer.customer.defaultAddress ? 'Yes' : 'No'}`);
      
      // Delete duplicates
      for (const duplicate of deleteCustomers) {
        console.log(`  ❌ Deleting: ${duplicate.docId}`);
        await db.collection('customers').doc(duplicate.docId).delete();
        totalDeleted++;
      }
      
      totalKept++;
      console.log('');
    }
    
    console.log('📊 CLEANUP SUMMARY');
    console.log('-'.repeat(60));
    console.log(`Profiles kept: ${totalKept}`);
    console.log(`Profiles deleted: ${totalDeleted}`);
    console.log('');
    console.log('✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

cleanupDuplicates()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
