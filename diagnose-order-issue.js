/**
 * Diagnose Order Creation Issue
 * Compare working vs failing phone numbers
 */

const admin = require('firebase-admin');
const serviceAccount = require('./temp-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const FAILING_PHONE = '8700925487';
const WORKING_PHONE = '9999968191';

async function diagnoseIssue() {
  console.log('=== Order Creation Issue Diagnosis ===\n');
  
  try {
    // 1. Compare Customers
    console.log('1. COMPARING CUSTOMER DATA\n');
    
    const failingCustomer = await getCustomer(FAILING_PHONE);
    const workingCustomer = await getCustomer(WORKING_PHONE);
    
    console.log('Failing Customer (8700925487):');
    console.log(JSON.stringify(failingCustomer, null, 2));
    
    console.log('\nWorking Customer (9999968191):');
    console.log(JSON.stringify(workingCustomer, null, 2));
    
    // 2. Compare Recent Orders
    console.log('\n\n2. COMPARING RECENT ORDERS\n');
    
    const failingOrders = await getRecentOrders(FAILING_PHONE, 3);
    const workingOrders = await getRecentOrders(WORKING_PHONE, 3);
    
    console.log(`Failing Customer Orders (${failingOrders.length}):`);
    failingOrders.forEach(order => {
      console.log(`  - ${order.orderId}: ${order.internalStatus}`);
      console.log(`    Items: ${order.items?.map(i => i.sku).join(', ')}`);
      console.log(`    Total: ₹${order.pricingInfo?.grandTotal}`);
      console.log(`    Created: ${order.createdAt?.toDate?.()?.toISOString()}`);
    });
    
    console.log(`\nWorking Customer Orders (${workingOrders.length}):`);
    workingOrders.forEach(order => {
      console.log(`  - ${order.orderId}: ${order.internalStatus}`);
      console.log(`    Items: ${order.items?.map(i => i.sku).join(', ')}`);
      console.log(`    Total: ₹${order.pricingInfo?.grandTotal}`);
      console.log(`    Created: ${order.createdAt?.toDate?.()?.toISOString()}`);
    });
    
    // 3. Check Products Used
    console.log('\n\n3. CHECKING PRODUCTS\n');
    
    if (workingOrders.length > 0) {
      const lastWorkingOrder = workingOrders[0];
      console.log('Products in last working order:');
      
      for (const item of lastWorkingOrder.items || []) {
        const product = await getProduct(item.productId);
        if (product) {
          console.log(`\n  Product: ${product.name} (${item.productId})`);
          console.log(`  SKU: ${item.sku}`);
          
          const variation = product.variations?.find(v => v.sku === item.sku);
          if (variation) {
            console.log(`  Variation: ${variation.name}`);
            console.log(`  Stock: ${variation.stock}`);
            console.log(`  Price: ₹${variation.salePrice || variation.price}`);
            console.log(`  Weight: ${variation.weight}g`);
            console.log(`  Dimensions: ${JSON.stringify(variation.dimensions)}`);
          } else {
            console.log(`  ❌ Variation not found for SKU: ${item.sku}`);
          }
        } else {
          console.log(`  ❌ Product not found: ${item.productId}`);
        }
      }
    }
    
    // 4. Check All Active Products
    console.log('\n\n4. ALL ACTIVE PRODUCTS\n');
    const allProducts = await db.collection('products')
      .where('isActive', '==', true)
      .get();
    
    console.log(`Total active products: ${allProducts.size}\n`);
    
    allProducts.forEach(doc => {
      const product = doc.data();
      console.log(`${product.name} (${doc.id})`);
      
      if (product.variations && product.variations.length > 0) {
        product.variations.forEach(v => {
          const stockStatus = v.stock > 0 ? '✅' : '❌';
          console.log(`  ${stockStatus} ${v.sku}: Stock ${v.stock}, ₹${v.salePrice || v.price}`);
        });
      } else {
        console.log('  ⚠️  No variations found');
      }
    });
    
    // 5. Check for Recent Failed Attempts
    console.log('\n\n5. RECENT FAILED ORDER ATTEMPTS\n');
    
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentAttempts = await db.collection('orders')
      .where('customerInfo.phone', '==', FAILING_PHONE)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(fiveMinAgo))
      .get();
    
    if (recentAttempts.empty) {
      console.log('❌ No orders found in last 5 minutes');
      console.log('   This means order creation failed BEFORE database save');
      console.log('   Possible causes:');
      console.log('   - Product not found');
      console.log('   - SKU mismatch');
      console.log('   - Insufficient stock');
      console.log('   - Invalid customer data');
      console.log('   - Schema validation failed');
    } else {
      console.log(`✅ Found ${recentAttempts.size} recent attempt(s):`);
      recentAttempts.forEach(doc => {
        const order = doc.data();
        console.log(`  Order ${order.orderId}:`);
        console.log(`    Status: ${order.internalStatus}`);
        console.log(`    Payment: ${order.paymentInfo?.method} - ${order.paymentInfo?.status}`);
        console.log(`    Items: ${order.items?.length}`);
      });
    }
    
    // 6. Summary
    console.log('\n\n=== DIAGNOSIS SUMMARY ===\n');
    
    if (!failingCustomer) {
      console.log('⚠️  Customer 8700925487 not found in database');
      console.log('   - Customer creation might be failing');
      console.log('   - Check customer data validation');
    }
    
    if (failingOrders.length === 0 && recentAttempts.empty) {
      console.log('⚠️  No orders found for 8700925487');
      console.log('   - Order creation failing before database save');
      console.log('   - Check Hostinger logs for exact error');
      console.log('   - Look for [CUSTOMER_ORDER] or [RAZORPAY_ORDER] logs');
    }
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Check Hostinger server logs for [CUSTOMER_ORDER] entries');
    console.log('2. Look for error with phone 8700925487');
    console.log('3. Identify which step failed (product, customer, validation, etc.)');
    console.log('4. Fix the specific issue found');
    
    console.log('\n💡 TO GET EXACT ERROR:');
    console.log('   SSH into Hostinger and run:');
    console.log('   tail -100 logs/error.log | grep "8700925487"');
    console.log('   OR');
    console.log('   pm2 logs | grep "CUSTOMER_ORDER"');
    
  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error);
    console.error('Stack:', error.stack);
  }
}

async function getCustomer(phone) {
  const snapshot = await db.collection('customers')
    .where('phone', '==', phone)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  
  const data = snapshot.docs[0].data();
  return {
    customerId: data.customerId,
    name: data.name,
    phone: data.phone,
    email: data.email,
    addresses: data.addresses?.length || 0
  };
}

async function getRecentOrders(phone, limit = 3) {
  const snapshot = await db.collection('orders')
    .where('customerInfo.phone', '==', phone)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => doc.data());
}

async function getProduct(productId) {
  const doc = await db.collection('products').doc(productId).get();
  if (!doc.exists) return null;
  return doc.data();
}

diagnoseIssue()
  .then(() => {
    console.log('\n✅ Diagnosis complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
