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

async function checkFailingOrders() {
  const targetPhone = '+919789653272';
  const suspectOrders = ['ORD_CSV_3113', 'ORD_2025_6D6FD7E3'];
  
  console.log('\n=== CHECKING FAILING ORDERS ===\n');

  for (const orderId of suspectOrders) {
    console.log(`\n--- ORDER: ${orderId} ---\n`);
    
    try {
      const orderDoc = await db.collection('orders').doc(orderId).get();
      
      if (!orderDoc.exists) {
        console.log('❌ Order not found');
        continue;
      }
      
      const orderData = orderDoc.data();
      
      console.log('RAW ORDER DATA:');
      console.log(JSON.stringify(orderData, null, 2));
      console.log('\n');
      
      // Check required fields
      console.log('FIELD VALIDATION:');
      console.log('orderId:', orderData.orderId, typeof orderData.orderId);
      console.log('orderSource:', orderData.orderSource, typeof orderData.orderSource);
      console.log('customerFacingStatus:', orderData.customerFacingStatus, typeof orderData.customerFacingStatus);
      console.log('internalStatus:', orderData.internalStatus, typeof orderData.internalStatus);
      console.log('');
      
      console.log('customerInfo:', orderData.customerInfo ? '✅' : '❌');
      if (orderData.customerInfo) {
        console.log('  - customerId:', orderData.customerInfo.customerId);
        console.log('  - name:', orderData.customerInfo.name);
        console.log('  - phone:', orderData.customerInfo.phone);
      }
      console.log('');
      
      console.log('shippingAddress:', orderData.shippingAddress ? '✅' : '❌');
      if (orderData.shippingAddress) {
        console.log('  - street:', orderData.shippingAddress.street);
        console.log('  - city:', orderData.shippingAddress.city);
        console.log('  - state:', orderData.shippingAddress.state);
        console.log('  - zip:', orderData.shippingAddress.zip);
      }
      console.log('');
      
      console.log('items:', orderData.items ? `✅ (${orderData.items.length})` : '❌');
      if (orderData.items && orderData.items.length > 0) {
        orderData.items.forEach((item, i) => {
          console.log(`  Item ${i + 1}:`);
          console.log('    - productId:', item.productId);
          console.log('    - productName:', item.productName);
          console.log('    - sku:', item.sku);
          console.log('    - quantity:', item.quantity);
          console.log('    - unitPrice:', item.unitPrice);
        });
      }
      console.log('');
      
      console.log('pricingInfo:', orderData.pricingInfo ? '✅' : '❌');
      if (orderData.pricingInfo) {
        console.log('  - subtotal:', orderData.pricingInfo.subtotal);
        console.log('  - discount:', orderData.pricingInfo.discount);
        console.log('  - grandTotal:', orderData.pricingInfo.grandTotal);
      }
      console.log('');
      
      console.log('paymentInfo:', orderData.paymentInfo ? '✅' : '❌');
      if (orderData.paymentInfo) {
        console.log('  - method:', orderData.paymentInfo.method);
        console.log('  - status:', orderData.paymentInfo.status);
      }
      console.log('');
      
      console.log('approval:', orderData.approval ? '✅' : '❌');
      if (orderData.approval) {
        console.log('  - status:', orderData.approval.status);
      }
      console.log('');
      
      // Check for missing required fields
      console.log('MISSING FIELDS:');
      const missingFields = [];
      
      if (!orderData.orderId) missingFields.push('orderId');
      if (!orderData.orderSource) missingFields.push('orderSource');
      if (!orderData.customerFacingStatus) missingFields.push('customerFacingStatus');
      if (!orderData.internalStatus) missingFields.push('internalStatus');
      if (!orderData.customerInfo) missingFields.push('customerInfo');
      if (!orderData.shippingAddress) missingFields.push('shippingAddress');
      if (!orderData.items || orderData.items.length === 0) missingFields.push('items');
      if (!orderData.pricingInfo) missingFields.push('pricingInfo');
      if (!orderData.paymentInfo) missingFields.push('paymentInfo');
      if (!orderData.approval) missingFields.push('approval');
      
      if (missingFields.length > 0) {
        console.log('❌', missingFields.join(', '));
      } else {
        console.log('✅ All required fields present');
      }
      console.log('');
      
      // Check for invalid values
      console.log('INVALID VALUES:');
      const invalidValues = [];
      
      if (orderData.customerFacingStatus === undefined || orderData.customerFacingStatus === null) {
        invalidValues.push('customerFacingStatus is undefined/null');
      }
      if (orderData.internalStatus === undefined || orderData.internalStatus === null) {
        invalidValues.push('internalStatus is undefined/null');
      }
      
      if (invalidValues.length > 0) {
        console.log('❌', invalidValues.join(', '));
      } else {
        console.log('✅ No invalid values detected');
      }
      
    } catch (error) {
      console.error('Error checking order:', error.message);
    }
  }
  
  console.log('\n=== RECOMMENDATIONS ===\n');
  console.log('Based on the investigation:');
  console.log('1. Fix missing/invalid fields in the orders');
  console.log('2. Or make schema more lenient (use .optional() or .nullable())');
  console.log('3. Or add default values when transforming data');
  console.log('');

  process.exit(0);
}

checkFailingOrders();
