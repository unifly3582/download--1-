// Fix order 5038 by adding totalPrice to items
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

async function fixOrder() {
  console.log('🔧 Fixing Order 5038 - Adding totalPrice to items...\n');

  try {
    const orderRef = db.collection('orders').doc('5038');
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      console.log('❌ Order not found!');
      return;
    }

    const orderData = orderDoc.data();
    
    console.log('📦 Current Order Items:');
    orderData.items.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.productName}`);
      console.log(`      Quantity: ${item.quantity}`);
      console.log(`      Unit Price: ₹${item.unitPrice}`);
      console.log(`      Total Price: ${item.totalPrice || 'MISSING ❌'}`);
    });

    // Fix items by adding totalPrice
    const fixedItems = orderData.items.map(item => ({
      ...item,
      totalPrice: item.totalPrice || (item.quantity * item.unitPrice)
    }));

    console.log('\n🔧 Fixed Items:');
    fixedItems.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.productName}`);
      console.log(`      Quantity: ${item.quantity}`);
      console.log(`      Unit Price: ₹${item.unitPrice}`);
      console.log(`      Total Price: ₹${item.totalPrice} ✅`);
    });

    // Update the order
    console.log('\n💾 Updating order...');
    await orderRef.update({
      items: fixedItems,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Order updated successfully!');

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const updatedDoc = await orderRef.get();
    const updatedData = updatedDoc.data();
    
    const allHaveTotalPrice = updatedData.items.every(item => item.totalPrice !== undefined);
    
    if (allHaveTotalPrice) {
      console.log('✅ Verification passed: All items now have totalPrice');
    } else {
      console.log('❌ Verification failed: Some items still missing totalPrice');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixOrder()
  .then(() => {
    console.log('\n✅ Fix complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
