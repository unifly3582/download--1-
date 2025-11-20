// Check order 5096 for source data using the API
const https = require('https');

async function checkOrder() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/orders/5096',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const order = JSON.parse(data);
          console.log('=== ORDER 5096 SOURCE DATA ===\n');
          console.log('Order ID:', order.orderId);
          console.log('Order Source:', order.orderSource);
          console.log('\n=== TRAFFIC SOURCE DATA ===');
          if (order.trafficSource) {
            console.log('✅ Traffic Source exists:');
            console.log(JSON.stringify(order.trafficSource, null, 2));
          } else {
            console.log('❌ No traffic source data found');
          }
          console.log('\n=== FULL ORDER DATA ===');
          console.log(JSON.stringify(order, null, 2));
          resolve(order);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

checkOrder().catch(console.error);
