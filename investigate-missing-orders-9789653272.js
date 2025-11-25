const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: 'buggly-adminpanel',
    clientEmail: 'firebase-adminsdk-fbsvc@buggly-adminpanel.iam.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCvkOIe6riSJWrA\njuYjY0IZboaoyBJlocpJdsltL8qNSm1YxFJIzRejSPL68KFkr5HijsJA5edd3oP8\nd8dl8XFnMsc9QDp2gCcaUiBk59v6Snz6MK8cZdpsBEM2rCd5S30MJN14XsYBVkM9\n1bwgR6bioFNwBeSuVeWCZSPwrktEaRA41RE0og2aVxqQfPujq0Csr0kLZLCs9fq0\nMcZ7xS/OUEcuxPrAWuufNDOzJmQc1N3/VSutHRWoma4hgAsw+YjPrv4/F02WxW+4\nRxRyZ2cLIWOU7hCHQDdNyDhki8f+bJxLQdEkgL8wDoNye1eW1bmgJ8ovSbAYqzqW\nT6LpObLjAgMBAAECggEABO1nYJVsh12EI3y0j3sHreMLkHfHsbvatjkelMaUmWaP\nWcBuIXDwIDsPPA++LS89mZgxciosViwalDQLD/IOIWasGiylTLzIBtXAkanC42wX\nxIXSmaoaI+dIDk7CmjA42uW7TteKGHDYA5zuDLyLaII2FUd1EEIvkNCkiOq7Xg4b\nj+xjiZw2OAJfm7Y1sCy7AsrXnoa7ZOhZQuZ2yZuUI0uDPyI/k5kIEYvabDHFrkIR\n+iscG38LwVu7TTDOf8mufahYL/LriH0RPxd38w2WNHp2falXCoWeRvE2rK9w1X6r\nj69fuouLlnf5ZUrxo/iT2xJjWpEmQVfrxWP5MWyWsQKBgQDgMYT/4ivc2OiIGolR\nU3OqncU/uUWIHEaJYFrNcM1OF9gsRMqDprL+Rj2VqS/u3wqXG/8D5AJcZluH13J8\nLkkEibRVoPOf6R2n1ESr/mnjXwfuUmXAiakNnBFI/0Uq5RbyTJjff4yKhnOwltYR\noqQNyFuukRjTDGxfoTKS0hENFwKBgQDIeUMnCNLQ4CekopuZ1iTFWnalA0vkmi93\nL1Hd2KBrMdUAqHK2H8m/heIdnV/htJes0/fYXj0Q+q6zkZOt6zBud7CLEg/k4FOR\nH8H2KM3syoiTNn5hFSjSBmhODXupfrow82UysxDbxTk6+XnPzRmp2bY+X31Maq2s\neV70D01gFQKBgQDbF8mv/yl6ZAeqqrQzY+iPfit7gOWwhGFyc1WJm4knninF6Vw3\nmDsoPyCEF5keSZ4h2lw3QyYDgoxEjon1TY5R/vjbDbXIOpqentSVeMWmTAKGJsQF\niwJIqJJD0iOYLdVk6PIkyJNh9M8ubdm51kWYqoreaDHoXiWytuejj+LV9QKBgCmY\nb4SD4ioQuGkCjEKJGiwQrxlh67dM/pg+K0BamD5loop2aQa85cFlaBs48hIExIvJ\nl10/gHArc2Ayzm+BoxTopKrWXpHgsbYk3rvSj5eYFmplHifKmiOpzK6VQZlTgBJ0\nDgVM/ix7aXqBFPM23SJO1+9tJLRcVhi5PihpnGZZAoGBAM9JLBVXvKpkd+GJublZ\nYEpUrgPpFRTMvWqTmEjp3DUOU19aW1nO2+U45z9PsjqRSG9O+EkFIhMMo2t90gT+\nsnmZhxWDP0POQL/Wlh/4ru+H3PjXEqtg/vjyJ29DKuKWsexf9GlG086JAG54aLPC\nomWfQhgsmRrhGc2QOoUL3wcv\n-----END PRIVATE KEY-----\n'
  };
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function investigateMissingOrders() {
  const targetPhone = '+919789653272';
  const targetDigits = '9789653272';
  
  console.log('\n=== INVESTIGATING MISSING ORDERS ===');
  console.log('Target phone:', targetPhone);
  console.log('Target digits:', targetDigits);
  console.log('');

  try {
    // Step 1: Query exactly like the API does
    console.log('STEP 1: Query exactly like API (with +91 prefix)');
    console.log('Query: customerInfo.phone == ' + targetPhone);
    
    const apiQuery = await db.collection('orders')
      .where('customerInfo.phone', '==', targetPhone)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    console.log(`Found: ${apiQuery.size} orders`);
    console.log('');
    
    if (!apiQuery.empty) {
      console.log('Orders found by API query:');
      apiQuery.docs.forEach((doc, index) => {
        const order = doc.data();
        console.log(`  ${index + 1}. Order ${order.orderId} - ${order.customerFacingStatus} - Created: ${order.createdAt?.toDate?.()?.toISOString()}`);
      });
      console.log('');
    }

    // Step 2: Get ALL orders for this customer (no limit)
    console.log('STEP 2: Get ALL orders (no limit)');
    
    const allOrdersQuery = await db.collection('orders')
      .where('customerInfo.phone', '==', targetPhone)
      .orderBy('createdAt', 'desc')
      .get();
    
    console.log(`Total orders in database: ${allOrdersQuery.size}`);
    console.log('');
    
    if (allOrdersQuery.size > apiQuery.size) {
      console.log(`⚠️  DISCREPANCY: Database has ${allOrdersQuery.size} orders but API query returned ${apiQuery.size}`);
      console.log('This should not happen with limit=50!');
      console.log('');
    }

    // Step 3: List ALL orders with details
    console.log('STEP 3: All orders for this customer:');
    console.log('');
    
    const allOrders = [];
    allOrdersQuery.docs.forEach((doc) => {
      const order = doc.data();
      allOrders.push({
        orderId: order.orderId,
        phone: order.customerInfo?.phone,
        customerId: order.customerInfo?.customerId,
        status: order.customerFacingStatus,
        internalStatus: order.internalStatus,
        created: order.createdAt?.toDate?.()?.toISOString() || order.createdAt,
        hasCreatedAt: !!order.createdAt,
        createdAtType: typeof order.createdAt
      });
    });

    allOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order ${order.orderId}`);
      console.log(`   Phone: ${order.phone}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${order.created}`);
      console.log(`   Has createdAt: ${order.hasCreatedAt}`);
      console.log('');
    });

    // Step 4: Check for orders without createdAt (can't be sorted)
    console.log('STEP 4: Checking for data issues');
    
    const ordersWithoutCreatedAt = allOrders.filter(o => !o.hasCreatedAt);
    if (ordersWithoutCreatedAt.length > 0) {
      console.log(`⚠️  ${ordersWithoutCreatedAt.length} orders missing createdAt field!`);
      console.log('These orders cannot be sorted and may not appear in API results:');
      ordersWithoutCreatedAt.forEach(o => {
        console.log(`  - Order ${o.orderId}`);
      });
      console.log('');
    } else {
      console.log('✅ All orders have createdAt field');
      console.log('');
    }

    // Step 5: Try query without orderBy to see if that's the issue
    console.log('STEP 5: Query WITHOUT orderBy (to test if sorting is the issue)');
    
    const noSortQuery = await db.collection('orders')
      .where('customerInfo.phone', '==', targetPhone)
      .limit(50)
      .get();
    
    console.log(`Found: ${noSortQuery.size} orders (without sorting)`);
    console.log('');
    
    if (noSortQuery.size !== apiQuery.size) {
      console.log('⚠️  ISSUE FOUND: orderBy is filtering out orders!');
      console.log('Some orders are missing createdAt or have invalid createdAt values.');
      console.log('');
    }

    // Step 6: Check customer ID query
    console.log('STEP 6: Query by customer ID');
    console.log('Query: customerInfo.customerId == ' + targetPhone);
    
    const customerIdQuery = await db.collection('orders')
      .where('customerInfo.customerId', '==', targetPhone)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    console.log(`Found: ${customerIdQuery.size} orders`);
    console.log('');

    // Step 7: Check for phone format variations
    console.log('STEP 7: Checking for phone format variations');
    
    const phoneFormats = [
      targetDigits,           // 9789653272
      `91${targetDigits}`,    // 919789653272
      `+91 ${targetDigits}`,  // +91 9789653272
    ];
    
    for (const format of phoneFormats) {
      const variantQuery = await db.collection('orders')
        .where('customerInfo.phone', '==', format)
        .get();
      
      if (variantQuery.size > 0) {
        console.log(`Found ${variantQuery.size} orders with format: "${format}"`);
        variantQuery.docs.forEach(doc => {
          const order = doc.data();
          console.log(`  - Order ${order.orderId}`);
        });
      }
    }
    console.log('');

    // Step 8: Summary and diagnosis
    console.log('=== DIAGNOSIS ===');
    console.log('');
    console.log(`Total orders in database: ${allOrdersQuery.size}`);
    console.log(`Orders returned by API query: ${apiQuery.size}`);
    console.log(`Orders without sorting: ${noSortQuery.size}`);
    console.log('');
    
    if (apiQuery.size < allOrdersQuery.size) {
      console.log('❌ PROBLEM IDENTIFIED:');
      console.log('');
      
      if (noSortQuery.size === allOrdersQuery.size && apiQuery.size < noSortQuery.size) {
        console.log('CAUSE: orderBy(createdAt) is filtering out orders');
        console.log('REASON: Some orders have missing or invalid createdAt timestamps');
        console.log('');
        console.log('SOLUTION:');
        console.log('1. Fix orders with missing createdAt timestamps');
        console.log('2. Or remove orderBy from the query (not recommended)');
        console.log('3. Or handle missing timestamps in the query');
      } else {
        console.log('CAUSE: Unknown - needs further investigation');
        console.log('Check Firestore indexes and query constraints');
      }
    } else {
      console.log('✅ All orders are being returned correctly');
      console.log('');
      console.log('If you\'re seeing only 2 orders in the API response:');
      console.log('1. Check if schema validation is filtering them out');
      console.log('2. Check if toCustomerView is filtering them');
      console.log('3. Check server logs for validation errors');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

investigateMissingOrders();
