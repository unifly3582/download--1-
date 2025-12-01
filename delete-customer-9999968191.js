const admin = require('firebase-admin');

// Initialize Firebase Admin with credentials from .env.local
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: 'buggly-adminpanel',
      clientEmail: 'firebase-adminsdk-fbsvc@buggly-adminpanel.iam.gserviceaccount.com',
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCvkOIe6riSJWrA\njuYjY0IZboaoyBJlocpJdsltL8qNSm1YxFJIzRejSPL68KFkr5HijsJA5edd3oP8\nd8dl8XFnMsc9QDp2gCcaUiBk59v6Snz6MK8cZdpsBEM2rCd5S30MJN14XsYBVkM9\n1bwgR6bioFNwBeSuVeWCZSPwrktEaRA41RE0og2aVxqQfPujq0Csr0kLZLCs9fq0\nMcZ7xS/OUEcuxPrAWuufNDOzJmQc1N3/VSutHRWoma4hgAsw+YjPrv4/F02WxW+4\nRxRyZ2cLIWOU7hCHQDdNyDhki8f+bJxLQdEkgL8wDoNye1eW1bmgJ8ovSbAYqzqW\nT6LpObLjAgMBAAECggEABO1nYJVsh12EI3y0j3sHreMLkHfHsbvatjkelMaUmWaP\nWcBuIXDwIDsPPA++LS89mZgxciosViwalDQLD/IOIWasGiylTLzIBtXAkanC42wX\nxIXSmaoaI+dIDk7CmjA42uW7TteKGHDYA5zuDLyLaII2FUd1EEIvkNCkiOq7Xg4b\nj+xjiZw2OAJfm7Y1sCy7AsrXnoa7ZOhZQuZ2yZuUI0uDPyI/k5kIEYvabDHFrkIR\n+iscG38LwVu7TTDOf8mufahYL/LriH0RPxd38w2WNHp2falXCoWeRvE2rK9w1X6r\nj69fuouLlnf5ZUrxo/iT2xJjWpEmQVfrxWP5MWyWsQKBgQDgMYT/4ivc2OiIGolR\nU3OqncU/uUWIHEaJYFrNcM1OF9gsRMqDprL+Rj2VqS/u3wqXG/8D5AJcZluH13J8\nLkkEibRVoPOf6R2n1ESr/mnjXwfuUmXAiakNnBFI/0Uq5RbyTJjff4yKhnOwltYR\noqQNyFuukRjTDGxfoTKS0hENFwKBgQDIeUMnCNLQ4CekopuZ1iTFWnalA0vkmi93\nL1Hd2KBrMdUAqHK2H8m/heIdnV/htJes0/fYXj0Q+q6zkZOt6zBud7CLEg/k4FOR\nH8H2KM3syoiTNn5hFSjSBmhODXupfrow82UysxDbxTk6+XnPzRmp2bY+X31Maq2s\neV70D01gFQKBgQDbF8mv/yl6ZAeqqrQzY+iPfit7gOWwhGFyc1WJm4knninF6Vw3\nmDsoPyCEF5keSZ4h2lw3QyYDgoxEjon1TY5R/vjbDbXIOpqentSVeMWmTAKGJsQF\niwJIqJJD0iOYLdVk6PIkyJNh9M8ubdm51kWYqoreaDHoXiWytuejj+LV9QKBgCmY\nb4SD4ioQuGkCjEKJGiwQrxlh67dM/pg+K0BamD5loop2aQa85cFlaBs48hIExIvJ\nl10/gHArc2Ayzm+BoxTopKrWXpHgsbYk3rvSj5eYFmplHifKmiOpzK6VQZlTgBJ0\nDgVM/ix7aXqBFPM23SJO1+9tJLRcVhi5PihpnGZZAoGBAM9JLBVXvKpkd+GJublZ\nYEpUrgPpFRTMvWqTmEjp3DUOU19aW1nO2+U45z9PsjqRSG9O+EkFIhMMo2t90gT+\nsnmZhxWDP0POQL/Wlh/4ru+H3PjXEqtg/vjyJ29DKuKWsexf9GlG086JAG54aLPC\nomWfQhgsmRrhGc2QOoUL3wcv\n-----END PRIVATE KEY-----\n"
    })
  });
}

const db = admin.firestore();

async function deleteCustomerData() {
  const phoneNumber = '9999968191';
  const formattedPhone = `+91${phoneNumber}`;
  
  console.log(`=== Deleting All Data for Customer ${phoneNumber} ===\n`);

  try {
    // Step 1: Find and display customer info
    console.log('🔍 Step 1: Finding customer...\n');
    
    const customerSnapshot = await db.collection('customers')
      .where('phone', '==', formattedPhone)
      .limit(1)
      .get();

    if (customerSnapshot.empty) {
      console.log(`❌ No customer found with phone ${formattedPhone}`);
      console.log('   Trying without +91 prefix...\n');
      
      const altSnapshot = await db.collection('customers')
        .where('phone', '==', phoneNumber)
        .limit(1)
        .get();
      
      if (altSnapshot.empty) {
        console.log(`❌ No customer found with phone ${phoneNumber} either`);
        return;
      }
      
      customerSnapshot.docs = altSnapshot.docs;
    }

    const customerDoc = customerSnapshot.docs[0];
    const customerData = customerDoc.data();
    
    console.log('✅ Found customer:');
    console.log(`   ID: ${customerDoc.id}`);
    console.log(`   Name: ${customerData.name}`);
    console.log(`   Phone: ${customerData.phone}`);
    console.log(`   Total Orders: ${customerData.totalOrders || 0}`);
    console.log(`   Total Spent: ₹${customerData.totalSpent || 0}`);
    console.log('');

    // Step 2: Find and delete all orders
    console.log('🔍 Step 2: Finding orders...\n');
    
    const ordersSnapshot = await db.collection('orders')
      .where('customerInfo.phone', '==', customerData.phone)
      .get();

    console.log(`   Found ${ordersSnapshot.size} orders\n`);

    if (ordersSnapshot.size > 0) {
      console.log('📦 Orders to be deleted:');
      ordersSnapshot.forEach(doc => {
        const order = doc.data();
        console.log(`   - Order ${order.orderId}: ${order.internalStatus}, ₹${order.grandTotal || order.pricingInfo?.grandTotal || 0}`);
      });
      console.log('');

      console.log('🗑️  Deleting orders...');
      const batch = db.batch();
      ordersSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ Deleted ${ordersSnapshot.size} orders\n`);
    }

    // Step 3: Delete customer record
    console.log('🗑️  Step 3: Deleting customer record...\n');
    await customerDoc.ref.delete();
    console.log('✅ Customer record deleted\n');

    // Step 4: Check for any related data
    console.log('🔍 Step 4: Checking for related data...\n');

    // Check for action logs
    const actionLogsSnapshot = await db.collection('actionLogs')
      .where('customerPhone', '==', customerData.phone)
      .limit(5)
      .get();

    if (!actionLogsSnapshot.empty) {
      console.log(`   Found ${actionLogsSnapshot.size} action logs (not deleting - for audit trail)`);
    }

    // Check for coupon usage
    const couponUsageSnapshot = await db.collection('couponUsage')
      .where('customerPhone', '==', customerData.phone)
      .limit(5)
      .get();

    if (!couponUsageSnapshot.empty) {
      console.log(`   Found ${couponUsageSnapshot.size} coupon usage records (not deleting - for audit trail)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ DELETION COMPLETE\n');
    console.log('Summary:');
    console.log(`   Customer: ${customerData.name} (${customerData.phone})`);
    console.log(`   Orders deleted: ${ordersSnapshot.size}`);
    console.log(`   Customer record: Deleted`);
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error during deletion:', error);
    throw error;
  }
}

// Confirmation prompt
console.log('\n⚠️  WARNING: This will permanently delete all data for customer 9999968191');
console.log('   - Customer record');
console.log('   - All orders');
console.log('   - This action CANNOT be undone!\n');

deleteCustomerData().then(() => {
  console.log('\n✅ Script complete');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
