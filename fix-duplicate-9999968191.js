/**
 * Fix duplicate customers for phone 9999968191
 * Keep the one with complete data, delete the empty ones
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

async function fixDuplicates() {
  const phone = '+919999968191';
  
  console.log('🔍 Finding duplicate customers for:', phone);
  console.log('='.repeat(60));
  
  try {
    // Get all customers with this phone
    const querySnapshot = await db.collection('customers')
      .where('phone', '==', phone)
      .get();
    
    console.log(`Found ${querySnapshot.size} customer(s)\n`);
    
    const customers = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      customers.push({
        id: doc.id,
        customerId: data.customerId,
        name: data.name || 'N/A',
        email: data.email || 'N/A',
        hasAddress: !!data.defaultAddress,
        addressCount: data.savedAddresses?.length || 0,
        totalOrders: data.totalOrders || 0,
        createdAt: data.createdAt?.toDate?.() || 'N/A'
      });
    });
    
    // Sort by completeness (name, address, orders)
    customers.sort((a, b) => {
      // Prioritize customers with name
      if (a.name !== 'N/A' && b.name === 'N/A') return -1;
      if (a.name === 'N/A' && b.name !== 'N/A') return 1;
      
      // Then by address
      if (a.hasAddress && !b.hasAddress) return -1;
      if (!a.hasAddress && b.hasAddress) return 1;
      
      // Then by orders
      if (a.totalOrders > b.totalOrders) return -1;
      if (a.totalOrders < b.totalOrders) return 1;
      
      // Finally by creation date (older first)
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    console.log('📋 Customers sorted by completeness:\n');
    customers.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.id}`);
      console.log(`   Name: ${c.name}`);
      console.log(`   Email: ${c.email}`);
      console.log(`   Has Address: ${c.hasAddress ? '✓' : '❌'}`);
      console.log(`   Saved Addresses: ${c.addressCount}`);
      console.log(`   Total Orders: ${c.totalOrders}`);
      console.log(`   Created: ${c.createdAt}`);
      console.log('');
    });
    
    if (customers.length <= 1) {
      console.log('✅ No duplicates to clean up');
      return;
    }
    
    // Keep the first one (most complete), delete the rest
    const keepCustomer = customers[0];
    const deleteCustomers = customers.slice(1);
    
    console.log('='.repeat(60));
    console.log('📌 PLAN:');
    console.log(`✓ KEEP: ${keepCustomer.id} (${keepCustomer.name})`);
    console.log(`❌ DELETE: ${deleteCustomers.length} duplicate(s):`);
    deleteCustomers.forEach(c => {
      console.log(`   - ${c.id} (${c.name})`);
    });
    console.log('='.repeat(60));
    console.log('');
    
    // Ask for confirmation
    console.log('⚠️  This will permanently delete the duplicate customers!');
    console.log('');
    console.log('To proceed, run this script with --confirm flag:');
    console.log('node fix-duplicate-9999968191.js --confirm');
    console.log('');
    
    if (process.argv.includes('--confirm')) {
      console.log('🗑️  Deleting duplicates...\n');
      
      for (const customer of deleteCustomers) {
        console.log(`Deleting ${customer.id}...`);
        await db.collection('customers').doc(customer.id).delete();
        console.log(`✓ Deleted ${customer.id}`);
      }
      
      console.log('');
      console.log('✅ Cleanup complete!');
      console.log(`Kept customer: ${keepCustomer.id} (${keepCustomer.name})`);
    } else {
      console.log('ℹ️  Dry run complete. No changes made.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

fixDuplicates()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
