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

async function diagnoseOrder5115() {
  console.log('=== Diagnosing Order 5115 ===\n');

  try {
    // Get order details
    const orderDoc = await db.collection('orders').doc('5115').get();
    
    if (!orderDoc.exists) {
      console.log('❌ Order 5115 not found!');
      return;
    }

    const orderData = orderDoc.data();
    console.log('📦 Order 5115 Details:');
    console.log('  Order ID:', orderData.orderId);
    console.log('  Internal Status:', orderData.internalStatus);
    console.log('  Customer Phone:', orderData.customerInfo?.phone);
    console.log('  Customer ID:', orderData.customerInfo?.customerId);
    console.log('  Created At:', orderData.createdAt?.toDate());
    console.log('  Grand Total:', orderData.grandTotal);
    console.log('  Shipment Status:', orderData.shipment?.status);
    console.log('  Delivered At:', orderData.shipment?.deliveredAt?.toDate());
    console.log('\n');

    // Get customer details
    const customerPhone = orderData.customerInfo?.phone;
    if (!customerPhone) {
      console.log('❌ No customer phone found in order!');
      return;
    }

    // Try to find customer by phone
    const customersSnapshot = await db.collection('customers')
      .where('phone', '==', customerPhone)
      .limit(1)
      .get();

    if (customersSnapshot.empty) {
      console.log('❌ Customer not found with phone:', customerPhone);
      return;
    }

    const customerDoc = customersSnapshot.docs[0];
    const customerData = customerDoc.data();
    
    console.log('👤 Customer Details:');
    console.log('  Customer ID:', customerDoc.id);
    console.log('  Name:', customerData.name);
    console.log('  Phone:', customerData.phone);
    console.log('  Total Orders:', customerData.totalOrders);
    console.log('  Total Spent:', customerData.totalSpent);
    console.log('  Last Order At:', customerData.lastOrderAt?.toDate());
    console.log('  Loyalty Tier:', customerData.loyaltyTier);
    console.log('  Customer Segment:', customerData.customerSegment);
    console.log('\n');

    // Get all orders for this customer
    const allOrdersSnapshot = await db.collection('orders')
      .where('customerInfo.phone', '==', customerPhone)
      .orderBy('createdAt', 'desc')
      .get();

    console.log('📊 All Orders for Customer:');
    console.log('  Total orders in database:', allOrdersSnapshot.size);
    
    let deliveredCount = 0;
    let totalSpent = 0;
    let latestDeliveredDate = null;

    allOrdersSnapshot.forEach(doc => {
      const order = doc.data();
      console.log(`  - Order ${order.orderId}: ${order.internalStatus}, ₹${order.grandTotal}, Created: ${order.createdAt?.toDate()}`);
      
      if (order.internalStatus === 'delivered') {
        deliveredCount++;
        totalSpent += order.grandTotal || 0;
        
        const deliveredAt = order.shipment?.deliveredAt || order.updatedAt;
        if (deliveredAt && (!latestDeliveredDate || deliveredAt.toDate() > latestDeliveredDate)) {
          latestDeliveredDate = deliveredAt.toDate();
        }
      }
    });

    console.log('\n📈 Calculated Stats:');
    console.log('  Delivered Orders:', deliveredCount);
    console.log('  Total Spent (delivered):', totalSpent);
    console.log('  Latest Delivered Date:', latestDeliveredDate);
    console.log('\n');

    console.log('⚠️  Discrepancy Analysis:');
    console.log('  Customer totalOrders:', customerData.totalOrders, '| Should be:', deliveredCount);
    console.log('  Customer totalSpent:', customerData.totalSpent, '| Should be:', totalSpent);
    console.log('  Customer lastOrderAt:', customerData.lastOrderAt?.toDate(), '| Should be:', latestDeliveredDate);
    
    if (customerData.totalOrders !== deliveredCount) {
      console.log('  ❌ Total orders mismatch!');
    }
    if (customerData.totalSpent !== totalSpent) {
      console.log('  ❌ Total spent mismatch!');
    }
    if (!customerData.lastOrderAt || customerData.lastOrderAt.toDate().getTime() !== latestDeliveredDate?.getTime()) {
      console.log('  ❌ Last order date mismatch!');
    }

    // Check action logs for this order
    console.log('\n📝 Checking Action Logs:');
    const actionLogsSnapshot = await db.collection('actionLogs')
      .where('orderId', '==', '5115')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    if (actionLogsSnapshot.empty) {
      console.log('  No action logs found for order 5115');
    } else {
      actionLogsSnapshot.forEach(doc => {
        const log = doc.data();
        console.log(`  - ${log.timestamp?.toDate()}: ${log.action} by ${log.performedBy}`);
        if (log.details) {
          console.log(`    Details:`, log.details);
        }
      });
    }

  } catch (error) {
    console.error('Error diagnosing order:', error);
  }
}

diagnoseOrder5115().then(() => {
  console.log('\n✅ Diagnosis complete');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
