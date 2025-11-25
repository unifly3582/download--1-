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

async function checkOrder5055() {
  try {
    console.log('\n=== CHECKING ORDER 5055 ===\n');
    
    const orderRef = db.collection('orders').doc('5055');
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      console.log('❌ Order 5055 not found in orders collection');
      return;
    }
    
    const orderData = orderDoc.data();
    
    console.log('✅ Order found!\n');
    console.log('=== BASIC INFO ===');
    console.log('Order ID:', orderDoc.id);
    console.log('Order Source:', orderData.orderSource);
    console.log('Status:', orderData.customerFacingStatus);
    console.log('Internal Status:', orderData.internalStatus);
    console.log('Created:', orderData.createdAt?.toDate?.()?.toISOString() || orderData.createdAt);
    
    console.log('\n=== CUSTOMER INFO ===');
    console.log('Customer ID:', orderData.customerInfo?.customerId);
    console.log('Name:', orderData.customerInfo?.name);
    console.log('Phone:', orderData.customerInfo?.phone);
    console.log('Email:', orderData.customerInfo?.email);
    
    console.log('\n=== PRICING INFO ===');
    console.log('Subtotal:', orderData.pricingInfo?.subtotal);
    console.log('Discount:', orderData.pricingInfo?.discount);
    console.log('Shipping:', orderData.pricingInfo?.shippingCharges);
    console.log('Grand Total:', orderData.pricingInfo?.grandTotal);
    
    console.log('\n=== PAYMENT INFO ===');
    console.log('Method:', orderData.paymentInfo?.method);
    console.log('Status:', orderData.paymentInfo?.status);
    
    console.log('\n=== ITEMS ===');
    if (orderData.items && orderData.items.length > 0) {
      orderData.items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.productName}`);
        console.log(`   SKU: ${item.sku}`);
        console.log(`   Quantity: ${item.quantity}`);
        console.log(`   Price: ₹${item.unitPrice}`);
      });
    }
    
    console.log('\n=== PHONE NUMBER ANALYSIS ===');
    const phone = orderData.customerInfo?.phone;
    console.log('Stored phone:', phone);
    console.log('Phone type:', typeof phone);
    console.log('Phone length:', phone?.length);
    
    // Check what format it's in
    if (phone) {
      if (phone.startsWith('+91')) {
        console.log('✅ Format: +91XXXXXXXXXX (standard)');
      } else if (phone.startsWith('91')) {
        console.log('⚠️  Format: 91XXXXXXXXXX (missing +)');
      } else if (phone.length === 10) {
        console.log('⚠️  Format: XXXXXXXXXX (no country code)');
      } else {
        console.log('❓ Format: Unknown');
      }
      
      // Extract digits
      const digits = phone.replace(/[^0-9]/g, '');
      console.log('Digits only:', digits);
      console.log('Last 10 digits:', digits.slice(-10));
    }
    
    console.log('\n=== CHECKING IF PHONE MATCHES 9789653272 ===');
    const targetPhone = '9789653272';
    if (phone && phone.includes(targetPhone)) {
      console.log('✅ YES! This order belongs to phone', targetPhone);
      console.log('   But stored as:', phone);
    } else {
      console.log('❌ NO! This order belongs to a different phone number');
      console.log('   Order phone:', phone);
      console.log('   Target phone:', targetPhone);
    }
    
    console.log('\n=== WHY API MIGHT NOT FIND IT ===');
    if (phone) {
      const apiSearchesFor = phone.startsWith('+91') ? phone : `+91${phone.replace(/[^0-9]/g, '').slice(-10)}`;
      console.log('When you search for:', targetPhone);
      console.log('API converts to:', `+91${targetPhone}`);
      console.log('Order stored as:', phone);
      console.log('Match?', phone === `+91${targetPhone}` ? '✅ YES' : '❌ NO');
      
      if (phone !== `+91${targetPhone}`) {
        console.log('\n⚠️  MISMATCH DETECTED!');
        console.log('This is why the order is not showing up in the API results.');
        console.log('\nSOLUTION:');
        console.log('1. Search by customer ID instead:', orderData.customerInfo?.customerId);
        console.log('2. Or update API to search multiple phone formats');
      }
    }
    
  } catch (error) {
    console.error('Error checking order:', error.message);
  } finally {
    process.exit(0);
  }
}

checkOrder5055();
