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

async function fixCustomerStats() {
  console.log('=== Fixing Customer Stats for Delivered Orders ===\n');

  try {
    // Get all customers
    const customersSnapshot = await db.collection('customers').get();
    console.log(`Found ${customersSnapshot.size} customers\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const customerDoc of customersSnapshot.docs) {
      const customer = customerDoc.data();
      const customerPhone = customer.phone;
      
      if (!customerPhone) {
        console.log(`⚠️  Skipping customer ${customerDoc.id} - no phone`);
        skippedCount++;
        continue;
      }

      // Get all delivered orders for this customer
      const deliveredOrders = await db.collection('orders')
        .where('customerInfo.phone', '==', customerPhone)
        .where('internalStatus', '==', 'delivered')
        .get();

      const actualDeliveredCount = deliveredOrders.size;
      let actualTotalSpent = 0;
      let latestDeliveredDate = null;

      deliveredOrders.forEach(doc => {
        const order = doc.data();
        const orderTotal = order.grandTotal || order.pricingInfo?.grandTotal || 0;
        actualTotalSpent += orderTotal;

        const deliveredAt = order.shipment?.deliveredAt || order.updatedAt;
        if (deliveredAt) {
          const deliveredDate = deliveredAt.toDate ? deliveredAt.toDate() : new Date(deliveredAt);
          if (!latestDeliveredDate || deliveredDate > latestDeliveredDate) {
            latestDeliveredDate = deliveredDate;
          }
        }
      });

      // Check if customer stats need updating
      const needsUpdate = 
        customer.totalOrders !== actualDeliveredCount ||
        customer.totalSpent !== actualTotalSpent ||
        (latestDeliveredDate && (!customer.lastOrderAt || 
          customer.lastOrderAt.toDate().getTime() !== latestDeliveredDate.getTime()));

      if (needsUpdate) {
        console.log(`\n🔧 Fixing customer: ${customer.name} (${customerPhone})`);
        console.log(`   Current: ${customer.totalOrders} orders, ₹${customer.totalSpent}`);
        console.log(`   Correct: ${actualDeliveredCount} orders, ₹${actualTotalSpent}`);

        // Calculate loyalty tier
        let loyaltyTier = 'new';
        if (actualDeliveredCount >= 26) loyaltyTier = 'platinum';
        else if (actualDeliveredCount >= 11) loyaltyTier = 'gold';
        else if (actualDeliveredCount >= 3) loyaltyTier = 'repeat';

        const updateData = {
          totalOrders: actualDeliveredCount,
          totalSpent: actualTotalSpent,
          avgOrderValue: actualDeliveredCount > 0 ? actualTotalSpent / actualDeliveredCount : 0,
          loyaltyTier: loyaltyTier,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (latestDeliveredDate) {
          updateData.lastOrderAt = admin.firestore.Timestamp.fromDate(latestDeliveredDate);
        }

        await customerDoc.ref.update(updateData);
        console.log(`   ✅ Updated to: ${actualDeliveredCount} orders, ₹${actualTotalSpent}, tier: ${loyaltyTier}`);
        fixedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\n\n=== Summary ===`);
    console.log(`Total customers: ${customersSnapshot.size}`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Already correct: ${skippedCount}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

fixCustomerStats().then(() => {
  console.log('\n✅ Fix complete');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
