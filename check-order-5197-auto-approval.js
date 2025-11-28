// Check Order 5197 Auto-Approval Status
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "buggly-adminpanel",
      clientEmail: "firebase-adminsdk-fbsvc@buggly-adminpanel.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCvkOIe6riSJWrA\njuYjY0IZboaoyBJlocpJdsltL8qNSm1YxFJIzRejSPL68KFkr5HijsJA5edd3oP8\nd8dl8XFnMsc9QDp2gCcaUiBk59v6Snz6MK8cZdpsBEM2rCd5S30MJN14XsYBVkM9\n1bwgR6bioFNwBeSuVeWCZSPwrktEaRA41RE0og2aVxqQfPujq0Csr0kLZLCs9fq0\nMcZ7xS/OUEcuxPrAWuufNDOzJmQc1N3/VSutHRWoma4hgAsw+YjPrv4/F02WxW+4\nRxRyZ2cLIWOU7hCHQDdNyDhki8f+bJxLQdEkgL8wDoNye1eW1bmgJ8ovSbAYqzqW\nT6LpObLjAgMBAAECggEABO1nYJVsh12EI3y0j3sHreMLkHfHsbvatjkelMaUmWaP\nWcBuIXDwIDsPPA++LS89mZgxciosViwalDQLD/IOIWasGiylTLzIBtXAkanC42wX\nxIXSmaoaI+dIDk7CmjA42uW7TteKGHDYA5zuDLyLaII2FUd1EEIvkNCkiOq7Xg4b\nj+xjiZw2OAJfm7Y1sCy7AsrXnoa7ZOhZQuZ2yZuUI0uDPyI/k5kIEYvabDHFrkIR\n+iscG38LwVu7TTDOf8mufahYL/LriH0RPxd38w2WNHp2falXCoWeRvE2rK9w1X6r\nj69fuouLlnf5ZUrxo/iT2xJjWpEmQVfrxWP5MWyWsQKBgQDgMYT/4ivc2OiIGolR\nU3OqncU/uUWIHEaJYFrNcM1OF9gsRMqDprL+Rj2VqS/u3wqXG/8D5AJcZluH13J8\nLkkEibRVoPOf6R2n1ESr/mnjXwfuUmXAiakNnBFI/0Uq5RbyTJjff4yKhnOwltYR\noqQNyFuukRjTDGxfoTKS0hENFwKBgQDIeUMnCNLQ4CekopuZ1iTFWnalA0vkmi93\nL1Hd2KBrMdUAqHK2H8m/heIdnV/htJes0/fYXj0Q+q6zkZOt6zBud7CLEg/k4FOR\nH8H2KM3syoiTNn5hFSjSBmhODXupfrow82UysxDbxTk6+XnPzRmp2bY+X31Maq2s\neV70D01gFQKBgQDbF8mv/yl6ZAeqqrQzY+iPfit7gOWwhGFyc1WJm4knninF6Vw3\nmDsoPyCEF5keSZ4h2lw3QyYDgoxEjon1TY5R/vjbDbXIOpqentSVeMWmTAKGJsQF\niwJIqJJD0iOYLdVk6PIkyJNh9M8ubdm51kWYqoreaDHoXiWytuejj+LV9QKBgCmY\nb4SD4ioQuGkCjEKJGiwQrxlh67dM/pg+K0BamD5loop2aQa85cFlaBs48hIExIvJ\nl10/gHArc2Ayzm+BoxTopKrWXpHgsbYk3rvSj5eYFmplHifKmiOpzK6VQZlTgBJ0\nDgVM/ix7aXqBFPM23SJO1+9tJLRcVhi5PihpnGZZAoGBAM9JLBVXvKpkd+GJublZ\nYEpUrgPpFRTMvWqTmEjp3DUOU19aW1nO2+U45z9PsjqRSG9O+EkFIhMMo2t90gT+\nsnmZhxWDP0POQL/Wlh/4ru+H3PjXEqtg/vjyJ29DKuKWsexf9GlG086JAG54aLPC\nomWfQhgsmRrhGc2QOoUL3wcv\n-----END PRIVATE KEY-----\n"
    })
  });
}

const db = admin.firestore();

async function checkOrder5197() {
  try {
    const orderId = '5197';
    
    console.log('🔍 Checking Order 5197 Auto-Approval Status...\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. Fetch the order
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      console.log('❌ Order 5197 not found in database');
      return;
    }
    
    const order = orderDoc.data();
    
    console.log('📦 ORDER DETAILS:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Order ID: ${order.orderId}`);
    console.log(`Order Source: ${order.orderSource}`);
    console.log(`Internal Status: ${order.internalStatus}`);
    console.log(`Approval Status: ${order.approval?.status || 'N/A'}`);
    console.log(`Grand Total: ₹${order.pricingInfo?.grandTotal || 0}`);
    console.log(`Customer Phone: ${order.customerInfo?.phone}`);
    console.log(`Customer ID: ${order.customerInfo?.customerId}`);
    console.log(`Items Count: ${order.items?.length || 0}`);
    console.log(`Created At: ${order.createdAt?.toDate?.() || order.createdAt}`);
    console.log('\n');
    
    // 2. Fetch auto-approval settings
    console.log('⚙️  AUTO-APPROVAL SETTINGS:');
    console.log('═══════════════════════════════════════════════════════════');
    const settingsRef = db.collection('settings').doc('autoApproval');
    const settingsDoc = await settingsRef.get();
    
    if (!settingsDoc.exists) {
      console.log('❌ Auto-approval settings not found');
      console.log('   → Auto-approval is NOT configured\n');
      return;
    }
    
    const settings = settingsDoc.data();
    console.log(`Max Auto-Approval Value: ₹${settings.maxAutoApprovalValue}`);
    console.log(`Min Customer Age: ${settings.minCustomerAgeDays} days`);
    console.log(`Allow New Customers: ${settings.allowNewCustomers ? 'YES' : 'NO'}`);
    console.log(`Require Verified Dimensions: ${settings.requireVerifiedDimensions ? 'YES' : 'NO'}`);
    console.log(`Learning Mode: ${settings.enableLearningMode ? 'ENABLED' : 'DISABLED'}`);
    console.log('\n');
    
    // 3. Fetch customer data
    console.log('👤 CUSTOMER DETAILS:');
    console.log('═══════════════════════════════════════════════════════════');
    const customerRef = db.collection('customers').doc(order.customerInfo.phone);
    const customerDoc = await customerRef.get();
    
    if (!customerDoc.exists) {
      console.log('❌ Customer not found in database');
      console.log(`   Phone: ${order.customerInfo.phone}`);
      console.log('   → This might be why auto-approval failed\n');
    } else {
      const customer = customerDoc.data();
      const customerAge = Date.now() - new Date(customer.createdAt?.toDate?.() || customer.createdAt).getTime();
      const customerAgeDays = Math.floor(customerAge / (1000 * 60 * 60 * 24));
      
      console.log(`Customer ID: ${customer.customerId}`);
      console.log(`Phone: ${customer.phone}`);
      console.log(`Name: ${customer.name}`);
      console.log(`Is Dubious: ${customer.isDubious ? '⚠️  YES' : '✅ NO'}`);
      console.log(`Created At: ${customer.createdAt?.toDate?.() || customer.createdAt}`);
      console.log(`Customer Age: ${customerAgeDays} days`);
      console.log(`Total Orders: ${customer.totalOrders || 0}`);
      console.log('\n');
    }
    
    // 4. Run auto-approval checks
    console.log('🔎 AUTO-APPROVAL ELIGIBILITY CHECK:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    let passedChecks = 0;
    let failedChecks = 0;
    const reasons = [];
    
    // Check 1: Customer exists
    if (!customerDoc.exists) {
      console.log('❌ CHECK 1: Customer Exists');
      console.log('   → FAILED: Customer not found in database\n');
      failedChecks++;
      reasons.push('Customer not found');
    } else {
      console.log('✅ CHECK 1: Customer Exists');
      console.log('   → PASSED: Customer found\n');
      passedChecks++;
      
      const customer = customerDoc.data();
      
      // Check 2: Not dubious
      if (customer.isDubious) {
        console.log('❌ CHECK 2: Customer Not Dubious');
        console.log('   → FAILED: Customer is flagged as dubious\n');
        failedChecks++;
        reasons.push('Customer flagged as dubious');
      } else {
        console.log('✅ CHECK 2: Customer Not Dubious');
        console.log('   → PASSED: Customer is not flagged\n');
        passedChecks++;
      }
      
      // Check 3: Customer age
      const customerAge = Date.now() - new Date(customer.createdAt?.toDate?.() || customer.createdAt).getTime();
      const customerAgeDays = Math.floor(customerAge / (1000 * 60 * 60 * 24));
      const isReturningCustomer = customerAgeDays >= settings.minCustomerAgeDays;
      
      if (!isReturningCustomer && !settings.allowNewCustomers) {
        console.log('❌ CHECK 3: Customer Age Requirement');
        console.log(`   → FAILED: Customer is ${customerAgeDays} days old`);
        console.log(`   → Required: ${settings.minCustomerAgeDays} days`);
        console.log(`   → New customers allowed: ${settings.allowNewCustomers ? 'YES' : 'NO'}\n`);
        failedChecks++;
        reasons.push(`Customer too new (${customerAgeDays} days, need ${settings.minCustomerAgeDays})`);
      } else {
        console.log('✅ CHECK 3: Customer Age Requirement');
        console.log(`   → PASSED: Customer is ${customerAgeDays} days old (required: ${settings.minCustomerAgeDays})\n`);
        passedChecks++;
      }
    }
    
    // Check 4: Order value
    const orderValue = order.pricingInfo?.grandTotal || 0;
    if (orderValue > settings.maxAutoApprovalValue) {
      console.log('❌ CHECK 4: Order Value Limit');
      console.log(`   → FAILED: Order value ₹${orderValue} exceeds limit ₹${settings.maxAutoApprovalValue}\n`);
      failedChecks++;
      reasons.push(`Order value ₹${orderValue} exceeds ₹${settings.maxAutoApprovalValue}`);
    } else {
      console.log('✅ CHECK 4: Order Value Limit');
      console.log(`   → PASSED: Order value ₹${orderValue} is within limit ₹${settings.maxAutoApprovalValue}\n`);
      passedChecks++;
    }
    
    // Check 5: Verified dimensions (if required)
    if (settings.requireVerifiedDimensions && order.items?.length > 1) {
      console.log('⚠️  CHECK 5: Verified Dimensions');
      console.log(`   → SKIPPED: Multi-item order (${order.items.length} items)`);
      console.log('   → This check is enabled but not fully implemented in code\n');
      // Not counting as pass or fail since it's not implemented
    } else {
      console.log('✅ CHECK 5: Verified Dimensions');
      console.log('   → PASSED: Single item order or check disabled\n');
      passedChecks++;
    }
    
    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`✅ Passed Checks: ${passedChecks}`);
    console.log(`❌ Failed Checks: ${failedChecks}\n`);
    
    if (failedChecks === 0) {
      console.log('🎉 ORDER SHOULD BE AUTO-APPROVED');
      console.log('   All checks passed!\n');
      
      if (order.approval?.status !== 'approved') {
        console.log('⚠️  BUT ORDER IS NOT APPROVED');
        console.log(`   Current approval status: ${order.approval?.status || 'pending'}`);
        console.log(`   Current internal status: ${order.internalStatus}\n`);
        console.log('🔍 POSSIBLE REASONS:');
        console.log('   1. Auto-approval function was not triggered during order creation');
        console.log('   2. There was an error in the auto-approval function');
        console.log('   3. Order was created before auto-approval was configured');
        console.log('   4. Order source bypasses auto-approval (e.g., Quick Ship)\n');
      } else {
        console.log('✅ Order is already approved!');
      }
    } else {
      console.log('❌ ORDER CANNOT BE AUTO-APPROVED');
      console.log('\n🚫 REASONS:');
      reasons.forEach((reason, index) => {
        console.log(`   ${index + 1}. ${reason}`);
      });
      console.log('\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n📋 RAW ORDER DATA:');
    console.log(JSON.stringify({
      orderId: order.orderId,
      orderSource: order.orderSource,
      internalStatus: order.internalStatus,
      approval: order.approval,
      pricingInfo: order.pricingInfo,
      customerInfo: order.customerInfo,
      items: order.items?.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    }, null, 2));
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkOrder5197();
