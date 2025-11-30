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

async function countCustomersByTier() {
  console.log('=== Customer Loyalty Tier Analysis ===\n');

  try {
    // Get all customers
    const customersSnapshot = await db.collection('customers').get();
    console.log(`Total customers: ${customersSnapshot.size}\n`);

    // Count by tier
    const tierCounts = {
      new: 0,
      repeat: 0,
      gold: 0,
      platinum: 0,
      undefined: 0
    };

    const tierDetails = {
      new: [],
      repeat: [],
      gold: [],
      platinum: []
    };

    let totalRevenue = 0;
    let totalOrders = 0;

    customersSnapshot.forEach(doc => {
      const customer = doc.data();
      const tier = customer.loyaltyTier || 'undefined';
      
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
      
      // Track revenue and orders
      totalRevenue += customer.totalSpent || 0;
      totalOrders += customer.totalOrders || 0;

      // Store details for repeat and above
      if (tier === 'repeat' || tier === 'gold' || tier === 'platinum') {
        tierDetails[tier].push({
          name: customer.name,
          phone: customer.phone,
          orders: customer.totalOrders || 0,
          spent: customer.totalSpent || 0
        });
      }
    });

    // Display counts
    console.log('📊 Customer Distribution by Tier:\n');
    console.log(`🆕 New (0-2 orders):        ${tierCounts.new.toLocaleString()} customers`);
    console.log(`🔁 Repeat (3-10 orders):    ${tierCounts.repeat.toLocaleString()} customers`);
    console.log(`🥇 Gold (11-25 orders):     ${tierCounts.gold.toLocaleString()} customers`);
    console.log(`💎 Platinum (26+ orders):   ${tierCounts.platinum.toLocaleString()} customers`);
    if (tierCounts.undefined > 0) {
      console.log(`❓ Undefined:               ${tierCounts.undefined.toLocaleString()} customers`);
    }

    // Calculate repeat and above
    const repeatAndAbove = tierCounts.repeat + tierCounts.gold + tierCounts.platinum;
    const repeatPercentage = ((repeatAndAbove / customersSnapshot.size) * 100).toFixed(1);

    console.log('\n' + '='.repeat(50));
    console.log(`\n✨ REPEAT & ABOVE (3+ orders): ${repeatAndAbove.toLocaleString()} customers (${repeatPercentage}%)\n`);
    console.log('='.repeat(50));

    // Revenue analysis
    console.log('\n💰 Revenue Analysis:\n');
    console.log(`Total Revenue:     ₹${totalRevenue.toLocaleString()}`);
    console.log(`Total Orders:      ${totalOrders.toLocaleString()}`);
    console.log(`Avg Order Value:   ₹${totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0}`);

    // Top customers in each tier
    console.log('\n\n🏆 Top Customers by Tier:\n');

    if (tierDetails.platinum.length > 0) {
      console.log('💎 PLATINUM TIER (26+ orders):');
      tierDetails.platinum
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 10)
        .forEach((c, i) => {
          console.log(`   ${i + 1}. ${c.name} - ${c.orders} orders, ₹${c.spent.toLocaleString()}`);
        });
      console.log('');
    }

    if (tierDetails.gold.length > 0) {
      console.log('🥇 GOLD TIER (11-25 orders):');
      tierDetails.gold
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 10)
        .forEach((c, i) => {
          console.log(`   ${i + 1}. ${c.name} - ${c.orders} orders, ₹${c.spent.toLocaleString()}`);
        });
      console.log('');
    }

    if (tierDetails.repeat.length > 0) {
      console.log('🔁 REPEAT TIER (3-10 orders):');
      tierDetails.repeat
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 10)
        .forEach((c, i) => {
          console.log(`   ${i + 1}. ${c.name} - ${c.orders} orders, ₹${c.spent.toLocaleString()}`);
        });
    }

    // Revenue contribution by tier
    console.log('\n\n💵 Revenue Contribution by Tier:\n');
    
    let newRevenue = 0, repeatRevenue = 0, goldRevenue = 0, platinumRevenue = 0;
    
    customersSnapshot.forEach(doc => {
      const customer = doc.data();
      const tier = customer.loyaltyTier || 'new';
      const spent = customer.totalSpent || 0;
      
      if (tier === 'new') newRevenue += spent;
      else if (tier === 'repeat') repeatRevenue += spent;
      else if (tier === 'gold') goldRevenue += spent;
      else if (tier === 'platinum') platinumRevenue += spent;
    });

    console.log(`New:      ₹${newRevenue.toLocaleString()} (${((newRevenue / totalRevenue) * 100).toFixed(1)}%)`);
    console.log(`Repeat:   ₹${repeatRevenue.toLocaleString()} (${((repeatRevenue / totalRevenue) * 100).toFixed(1)}%)`);
    console.log(`Gold:     ₹${goldRevenue.toLocaleString()} (${((goldRevenue / totalRevenue) * 100).toFixed(1)}%)`);
    console.log(`Platinum: ₹${platinumRevenue.toLocaleString()} (${((platinumRevenue / totalRevenue) * 100).toFixed(1)}%)`);

    const repeatAndAboveRevenue = repeatRevenue + goldRevenue + platinumRevenue;
    console.log(`\n🎯 Repeat & Above Revenue: ₹${repeatAndAboveRevenue.toLocaleString()} (${((repeatAndAboveRevenue / totalRevenue) * 100).toFixed(1)}%)`);

  } catch (error) {
    console.error('Error:', error);
  }
}

countCustomersByTier().then(() => {
  console.log('\n✅ Analysis complete');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
