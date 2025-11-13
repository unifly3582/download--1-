const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function checkAutoApprovalSettings() {
  try {
    console.log('🔍 Fetching auto-approval settings...\n');
    
    const settingsRef = db.collection('settings').doc('autoApproval');
    const settingsSnap = await settingsRef.get();
    
    if (!settingsSnap.exists) {
      console.log('❌ No auto-approval settings found!');
      console.log('   Settings need to be configured at: settings/autoApproval');
      return;
    }
    
    const settings = settingsSnap.data();
    
    console.log('✅ Current Auto-Approval Settings:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Max Auto-Approval Value: ₹${settings.maxAutoApprovalValue || 0}`);
    console.log(`📅 Min Customer Age: ${settings.minCustomerAgeDays || 0} days`);
    console.log(`👤 Allow New Customers: ${settings.allowNewCustomers ? '✅ YES' : '❌ NO'}`);
    console.log(`📦 Require Verified Dimensions: ${settings.requireVerifiedDimensions ? '✅ YES' : '❌ NO'}`);
    console.log(`🧠 Learning Mode: ${settings.enableLearningMode ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 Orders that WILL be auto-approved:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const conditions = [];
    
    // Customer conditions
    if (settings.allowNewCustomers) {
      conditions.push('✅ ANY customer (new or returning)');
    } else {
      conditions.push(`✅ Returning customers (account age > ${settings.minCustomerAgeDays} days)`);
      conditions.push('❌ New customers will be REJECTED');
    }
    
    // Dubious check
    conditions.push('✅ Customer is NOT flagged as dubious');
    
    // Order value
    if (settings.maxAutoApprovalValue > 0) {
      conditions.push(`✅ Order value ≤ ₹${settings.maxAutoApprovalValue}`);
    } else {
      conditions.push('❌ No orders will be approved (max value is ₹0)');
    }
    
    // Dimensions
    if (settings.requireVerifiedDimensions) {
      conditions.push('✅ Single-item orders OR verified combinations');
      conditions.push('⚠️  Multi-item orders need verified combinations (partially implemented)');
    } else {
      conditions.push('✅ Any item combination (dimensions not checked)');
    }
    
    conditions.forEach(condition => console.log(`   ${condition}`));
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Example scenarios
    console.log('💡 Example Scenarios:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (settings.maxAutoApprovalValue === 0) {
      console.log('   ⚠️  WARNING: Max approval value is ₹0');
      console.log('   → NO orders will be auto-approved!');
      console.log('   → All orders will require manual approval');
    } else {
      // Scenario 1
      const scenario1Value = Math.min(500, settings.maxAutoApprovalValue);
      console.log(`   1️⃣  Order: ₹${scenario1Value}, Customer: 60 days old, Not dubious`);
      if (settings.allowNewCustomers || 60 > settings.minCustomerAgeDays) {
        console.log('      → ✅ WILL BE AUTO-APPROVED');
      } else {
        console.log('      → ❌ REJECTED (customer too new)');
      }
      
      // Scenario 2
      const scenario2Value = settings.maxAutoApprovalValue + 100;
      console.log(`\n   2️⃣  Order: ₹${scenario2Value}, Customer: 60 days old, Not dubious`);
      console.log('      → ❌ REJECTED (exceeds max value)');
      
      // Scenario 3
      console.log(`\n   3️⃣  Order: ₹${scenario1Value}, Customer: 2 days old, Not dubious`);
      if (settings.allowNewCustomers) {
        console.log('      → ✅ WILL BE AUTO-APPROVED (new customers allowed)');
      } else if (2 > settings.minCustomerAgeDays) {
        console.log('      → ✅ WILL BE AUTO-APPROVED');
      } else {
        console.log('      → ❌ REJECTED (customer too new)');
      }
      
      // Scenario 4
      console.log(`\n   4️⃣  Order: ₹${scenario1Value}, Customer: 60 days old, Flagged as dubious`);
      console.log('      → ❌ REJECTED (dubious customer)');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Check for recent orders
    console.log('📦 Checking recent pending orders...\n');
    const ordersSnapshot = await db.collection('orders')
      .where('internalStatus', 'in', ['created_pending', 'needs_manual_verification'])
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    if (ordersSnapshot.empty) {
      console.log('   ℹ️  No pending orders found');
    } else {
      console.log(`   Found ${ordersSnapshot.size} pending order(s):\n`);
      
      for (const doc of ordersSnapshot.docs) {
        const order = doc.data();
        console.log(`   Order ID: ${order.orderId}`);
        console.log(`   Status: ${order.internalStatus}`);
        console.log(`   Value: ₹${order.pricingInfo?.grandTotal || 0}`);
        console.log(`   Customer: ${order.customerInfo?.phone}`);
        
        // Check if it would be approved
        const customerSnap = await db.collection('customers').doc(order.customerInfo?.phone).get();
        if (customerSnap.exists) {
          const customer = customerSnap.data();
          const customerAge = (Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          
          let wouldApprove = true;
          const reasons = [];
          
          if (customer.isDubious) {
            wouldApprove = false;
            reasons.push('❌ Customer is dubious');
          }
          
          if (!settings.allowNewCustomers && customerAge < settings.minCustomerAgeDays) {
            wouldApprove = false;
            reasons.push(`❌ Customer too new (${Math.floor(customerAge)} days < ${settings.minCustomerAgeDays} days)`);
          }
          
          if (order.pricingInfo?.grandTotal > settings.maxAutoApprovalValue) {
            wouldApprove = false;
            reasons.push(`❌ Exceeds max value (₹${order.pricingInfo.grandTotal} > ₹${settings.maxAutoApprovalValue})`);
          }
          
          if (wouldApprove) {
            console.log(`   → ✅ Would be AUTO-APPROVED`);
          } else {
            console.log(`   → ❌ Would be REJECTED:`);
            reasons.forEach(r => console.log(`      ${r}`));
          }
        } else {
          console.log(`   → ❌ Customer not found`);
        }
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkAutoApprovalSettings();
