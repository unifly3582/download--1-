// Test customer order creation with numeric-only IDs
const http = require('http');

async function createCustomerOrder(orderNum) {
  return new Promise((resolve) => {
    const orderData = JSON.stringify({
      orderSource: "customer_app",
      customerInfo: {
        name: `Customer ${orderNum}`,
        phone: `987654321${orderNum}`,
        email: `customer${orderNum}@example.com`
      },
      shippingAddress: {
        street: `${orderNum} Customer Street`,
        city: "Mumbai",
        state: "Maharashtra", 
        zip: "400001",
        country: "India"
      },
      items: [{
        productId: "D2goAtuQSOB8WylrbOPe",
        variationId: null,
        productName: `Customer Product ${orderNum}`,
        quantity: 1,
        unitPrice: 100,
        sku: "CUST-SKU"
      }],
      paymentInfo: {
        method: "COD"
      }
    });

    const options = {
      hostname: 'localhost',
      port: 9006,
      path: '/api/customer/orders/create',
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(orderData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(data) });
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    req.write(orderData);
    req.end();
  });
}

async function main() {
  console.log('🧪 Testing customer order creation with numeric IDs...');
  console.log('');
  
  // Create 2 customer orders
  for (let i = 0; i < 2; i++) {
    console.log(`🛒 Creating customer order ${i + 1}...`);
    const result = await createCustomerOrder(i);
    
    if (result.error) {
      console.log(`❌ Connection error: ${result.error}`);
      console.log('💡 Make sure your dev server is running on port 9006');
      return;
    }
    
    if (result.status === 201 && result.body.success) {
      const orderId = result.body.orderId;
      console.log(`✅ Customer order created: ${orderId}`);
      
      // Validate it's numeric only
      const isNumericOnly = /^\d+$/.test(orderId);
      const orderNumber = parseInt(orderId, 10);
      
      if (isNumericOnly) {
        console.log(`   ✅ Format is correct! (Pure number: ${orderNumber})`);
      } else {
        console.log(`   ❌ Format is incorrect - should be numbers only, got: ${orderId}`);
      }
    } else {
      console.log(`   ❌ Failed: Status ${result.status}`);
      console.log(`   📄 Response:`, JSON.stringify(result.body, null, 2));
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('🎉 Customer order test completed!');
}

main().catch(console.error);