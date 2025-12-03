/**
 * Check customer 9999968191 profile and addresses
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

async function checkCustomer() {
  const phone = '+919999968191';
  
  console.log('🔍 Checking Customer:', phone);
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Method 1: Query by phone
    console.log('📱 Searching by phone field...');
    const querySnapshot = await db.collection('customers')
      .where('phone', '==', phone)
      .get();
    
    if (!querySnapshot.empty) {
      console.log(`✅ Found ${querySnapshot.size} customer(s) with phone ${phone}`);
      console.log('');
      
      querySnapshot.forEach((doc, index) => {
        const customer = doc.data();
        
        console.log(`👤 CUSTOMER #${index + 1}`);
        console.log('-'.repeat(60));
        console.log('Document ID:', doc.id);
        console.log('Customer ID:', customer.customerId || 'N/A');
        console.log('Name:', customer.name || 'N/A');
        console.log('Phone:', customer.phone || 'N/A');
        console.log('Email:', customer.email || 'N/A');
        console.log('');
        
        console.log('📊 STATS');
        console.log('-'.repeat(60));
        console.log('Total Orders:', customer.totalOrders || 0);
        console.log('Total Spent:', '₹' + (customer.totalSpent || 0));
        console.log('Loyalty Tier:', customer.loyaltyTier || 'N/A');
        console.log('Trust Score:', customer.trustScore || 'N/A');
        console.log('');
        
        console.log('📍 DEFAULT ADDRESS');
        console.log('-'.repeat(60));
        if (customer.defaultAddress) {
          console.log('Street:', customer.defaultAddress.street || 'N/A');
          console.log('City:', customer.defaultAddress.city || 'N/A');
          console.log('State:', customer.defaultAddress.state || 'N/A');
          console.log('ZIP:', customer.defaultAddress.zip || 'N/A');
          console.log('Country:', customer.defaultAddress.country || 'N/A');
        } else {
          console.log('❌ No default address');
        }
        console.log('');
        
        console.log('📚 SAVED ADDRESSES');
        console.log('-'.repeat(60));
        if (customer.savedAddresses && customer.savedAddresses.length > 0) {
          console.log(`Found ${customer.savedAddresses.length} saved address(es):`);
          customer.savedAddresses.forEach((addr, i) => {
            console.log(`\n${i + 1}. ${addr.street || 'N/A'}`);
            console.log(`   ${addr.city}, ${addr.state} ${addr.zip}`);
            console.log(`   ${addr.country}`);
          });
        } else {
          console.log('❌ No saved addresses (savedAddresses is empty)');
        }
        console.log('');
        
        console.log('📅 TIMESTAMPS');
        console.log('-'.repeat(60));
        console.log('Created At:', customer.createdAt?.toDate?.() || 'N/A');
        console.log('Updated At:', customer.updatedAt?.toDate?.() || 'N/A');
        console.log('');
        
        console.log('📄 FULL CUSTOMER DATA (JSON)');
        console.log('-'.repeat(60));
        console.log(JSON.stringify(customer, null, 2));
        console.log('');
        console.log('='.repeat(60));
        console.log('');
      });
    } else {
      console.log('❌ No customer found with phone:', phone);
    }
    
    // Method 2: Also check without +91 prefix
    const phoneWithout91 = '9999968191';
    console.log('');
    console.log('📱 Also checking without +91 prefix:', phoneWithout91);
    const querySnapshot2 = await db.collection('customers')
      .where('phone', '==', phoneWithout91)
      .get();
    
    if (!querySnapshot2.empty) {
      console.log(`✅ Found ${querySnapshot2.size} customer(s) with phone ${phoneWithout91}`);
    } else {
      console.log('❌ No customer found with phone:', phoneWithout91);
    }
    
    // Method 3: Check if stored by phone as document ID (legacy)
    console.log('');
    console.log('📱 Checking legacy storage (phone as doc ID)...');
    const phoneDoc = await db.collection('customers').doc(phone).get();
    if (phoneDoc.exists) {
      console.log('✅ Found customer stored with phone as document ID');
      const customer = phoneDoc.data();
      console.log('Customer ID:', customer.customerId || 'N/A');
      console.log('Name:', customer.name || 'N/A');
    } else {
      console.log('❌ No customer found with phone as document ID');
    }
    
    // Get all orders for this customer
    console.log('');
    console.log('📦 ORDERS FOR THIS CUSTOMER');
    console.log('-'.repeat(60));
    const ordersSnapshot = await db.collection('orders')
      .where('customerInfo.phone', '==', phone)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    if (!ordersSnapshot.empty) {
      console.log(`Found ${ordersSnapshot.size} order(s):`);
      ordersSnapshot.forEach((doc) => {
        const order = doc.data();
        console.log(`\n- Order ${order.orderId}`);
        console.log(`  Customer ID in order: ${order.customerInfo?.customerId}`);
        console.log(`  Status: ${order.internalStatus}`);
        console.log(`  Created: ${order.createdAt?.toDate?.()}`);
        console.log(`  Address: ${order.shippingAddress?.street?.substring(0, 50)}...`);
      });
    } else {
      console.log('❌ No orders found for this customer');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCustomer()
  .then(() => {
    console.log('');
    console.log('✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
