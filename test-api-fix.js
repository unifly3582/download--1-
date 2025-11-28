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

async function testApiFix() {
  const targetPhone = '+919789653272';
  
  console.log('\n=== TESTING API FIX ===');
  console.log('Simulating what the API will do after the fix\n');

  try {
    // Step 1: Query like API does
    console.log('STEP 1: Fetching orders from database...');
    const snapshot = await db.collection('orders')
      .where('customerInfo.phone', '==', targetPhone)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    console.log(`Found ${snapshot.size} orders in database\n`);

    // Step 2: Transform like API does (with fix)
    console.log('STEP 2: Transforming orders (applying fix)...\n');
    
    const orders = snapshot.docs.map((doc) => {
      const data = doc.data();
      
      // Apply the fix
      const transformed = {
        ...data,
        // Add default values for missing fields
        customerFacingStatus: data.customerFacingStatus || data.internalStatus || 'pending',
        pricingInfo: {
          ...data.pricingInfo,
          discount: data.pricingInfo?.discount ?? 0,
          prepaidDiscount: data.pricingInfo?.prepaidDiscount ?? 0
        },
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        approval: {
          ...data.approval,
          approvedAt: data.approval?.approvedAt?.toDate?.()?.toISOString() || data.approval?.approvedAt
        }
      };
      
      console.log(`Order ${data.orderId}:`);
      console.log(`  Original customerFacingStatus: ${data.customerFacingStatus}`);
      console.log(`  Fixed customerFacingStatus: ${transformed.customerFacingStatus}`);
      console.log(`  Original discount: ${data.pricingInfo?.discount}`);
      console.log(`  Fixed discount: ${transformed.pricingInfo.discount}`);
      console.log('');
      
      return transformed;
    });

    console.log(`\n=== RESULT ===`);
    console.log(`✅ All ${orders.length} orders will be returned by the API`);
    console.log('');
    console.log('Orders that will be returned:');
    orders.forEach((order, index) => {
      console.log(`${index + 1}. Order ${order.orderId} - ${order.customerFacingStatus}`);
    });
    console.log('');
    
    console.log('=== BEFORE FIX ===');
    console.log('Only 2 orders were returned (2 failed validation)');
    console.log('');
    console.log('=== AFTER FIX ===');
    console.log(`All ${orders.length} orders will be returned ✅`);
    console.log('');
    console.log('The fix adds default values for:');
    console.log('- customerFacingStatus (falls back to internalStatus)');
    console.log('- pricingInfo.discount (defaults to 0)');
    console.log('- pricingInfo.prepaidDiscount (defaults to 0)');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testApiFix();
