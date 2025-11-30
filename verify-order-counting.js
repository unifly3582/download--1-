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

async function verifyOrderCounting() {
  console.log('=== Verifying Order Counting ===\n');

  try {
    // Get all orders
    const ordersSnapshot = await db.collection('orders').get();
    console.log(`Total orders in database: ${ordersSnapshot.size}\n`);

    // Count orders by status
    const statusCounts = {};
    const ordersByCustomer = {};
    let totalRevenue = 0;

    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      const status = order.internalStatus || 'unknown';
      
      // Count by status
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Track delivered orders by customer
      if (status === 'delivered') {
        const phone = order.customerInfo?.phone;
        if (phone) {
          if (!ordersByCustomer[phone]) {
            ordersByCustomer[phone] = {
              name: order.customerInfo?.name || 'Unknown',
              orders: [],
              totalSpent: 0
            };
          }
          
          const orderTotal = order.grandTotal || order.pricingInfo?.grandTotal || 0;
          ordersByCustomer[phone].orders.push({
            orderId: order.orderId,
            total: orderTotal,
            createdAt: order.createdAt?.toDate?.() || new Date(order.createdAt)
          });
          ordersByCustomer[phone].totalSpent += orderTotal;
          totalRevenue += orderTotal;
        }
      }
    });

    // Display order status breakdown
    console.log('📊 Orders by Status:\n');
    Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`   ${status}: ${count} orders`);
      });

    const deliveredCount = statusCounts['delivered'] || 0;
    console.log(`\n✅ Total DELIVERED orders: ${deliveredCount}`);
    console.log(`💰 Total revenue from delivered orders: ₹${totalRevenue.toLocaleString()}\n`);

    // Get customer stats from database
    const customersSnapshot = await db.collection('customers').get();
    
    let totalCustomerOrders = 0;
    let totalCustomerSpent = 0;
    let customersWithOrders = 0;

    customersSnapshot.forEach(doc => {
      const customer = doc.data();
      totalCustomerOrders += customer.totalOrders || 0;
      totalCustomerSpent += customer.totalSpent || 0;
      if ((customer.totalOrders || 0) > 0) {
        customersWithOrders++;
      }
    });

    console.log('📈 Customer Stats Summary:\n');
    console.log(`   Total orders in customer records: ${totalCustomerOrders}`);
    console.log(`   Total spent in customer records: ₹${totalCustomerSpent.toLocaleString()}`);
    console.log(`   Customers with orders: ${customersWithOrders}\n`);

    // Verify match
    console.log('🔍 Verification:\n');
    
    const orderCountMatch = deliveredCount === totalCustomerOrders;
    const revenueMatch = Math.abs(totalRevenue - totalCustomerSpent) < 10; // Allow small rounding differences
    
    console.log(`   Delivered orders (${deliveredCount}) vs Customer total orders (${totalCustomerOrders}): ${orderCountMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`   Delivered revenue (₹${totalRevenue}) vs Customer total spent (₹${totalCustomerSpent}): ${revenueMatch ? '✅ MATCH' : '❌ MISMATCH'}`);

    if (!orderCountMatch || !revenueMatch) {
      console.log('\n⚠️  DISCREPANCY DETECTED!\n');
      
      const diff = deliveredCount - totalCustomerOrders;
      console.log(`   Order count difference: ${diff} orders`);
      console.log(`   Revenue difference: ₹${(totalRevenue - totalCustomerSpent).toLocaleString()}`);
    } else {
      console.log('\n✅ All orders accounted for correctly!\n');
    }

    // Show customers with most orders
    console.log('\n🏆 Top 10 Customers by Order Count:\n');
    
    const topCustomers = Object.entries(ordersByCustomer)
      .map(([phone, data]) => ({
        phone,
        name: data.name,
        orderCount: data.orders.length,
        totalSpent: data.totalSpent
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 10);

    topCustomers.forEach((customer, i) => {
      console.log(`   ${i + 1}. ${customer.name} (${customer.phone})`);
      console.log(`      ${customer.orderCount} orders, ₹${customer.totalSpent.toLocaleString()}`);
    });

    // Check for any customers with mismatched data
    console.log('\n\n🔎 Checking for data mismatches...\n');
    
    let mismatchCount = 0;
    const mismatches = [];

    for (const [phone, orderData] of Object.entries(ordersByCustomer)) {
      const customerSnapshot = await db.collection('customers')
        .where('phone', '==', phone)
        .limit(1)
        .get();

      if (!customerSnapshot.empty) {
        const customer = customerSnapshot.docs[0].data();
        const actualOrders = orderData.orders.length;
        const recordedOrders = customer.totalOrders || 0;
        const actualSpent = orderData.totalSpent;
        const recordedSpent = customer.totalSpent || 0;

        if (actualOrders !== recordedOrders || Math.abs(actualSpent - recordedSpent) > 1) {
          mismatchCount++;
          mismatches.push({
            name: customer.name,
            phone: phone,
            actualOrders,
            recordedOrders,
            actualSpent,
            recordedSpent
          });
        }
      }
    }

    if (mismatchCount > 0) {
      console.log(`❌ Found ${mismatchCount} customers with mismatched data:\n`);
      mismatches.slice(0, 10).forEach(m => {
        console.log(`   ${m.name} (${m.phone})`);
        console.log(`      Actual: ${m.actualOrders} orders, ₹${m.actualSpent}`);
        console.log(`      Recorded: ${m.recordedOrders} orders, ₹${m.recordedSpent}`);
        console.log('');
      });
      
      if (mismatches.length > 10) {
        console.log(`   ... and ${mismatches.length - 10} more\n`);
      }
    } else {
      console.log('✅ No mismatches found! All customer data is accurate.\n');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

verifyOrderCounting().then(() => {
  console.log('\n✅ Verification complete');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
