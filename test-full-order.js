// Test full order placement with WhatsApp notification
require('dotenv').config({ path: '.env.local' });

async function placeOrderWithNotification() {
  console.log('🧪 Testing Full Order Placement with WhatsApp...\n');

  // Test order data for chicken farmer
  const orderData = {
    orderSource: "admin_form",
    customerInfo: {
      name: "Rajesh Kumar",
      phone: "9999968191",
      email: "rajesh.farmer@example.com"
    },
    shippingAddress: {
      street: "Village Rampur, Near Poultry Farm",
      city: "Sonipat",
      state: "Haryana", 
      zip: "131001",
      country: "India"
    },
    items: [
      {
        productId: "PROD001",
        productName: "Broiler Feed Premium 25kg",
        quantity: 2,
        unitPrice: 1200,
        sku: "BF-PREM-25",
        hsnCode: "2309",
        weight: 25
      },
      {
        productId: "PROD002",
        productName: "Vitamin B-Complex Supplement 500ml",
        quantity: 1,
        unitPrice: 450,
        sku: "VIT-BCOMP-500",
        hsnCode: "3003",
        weight: 0.5
      }
    ],
    paymentInfo: {
      method: "Prepaid" // This should auto-approve and trigger notification
    }
  };

  console.log('📋 Placing order for chicken farmer:');
  console.log(`👤 Customer: ${orderData.customerInfo.name}`);
  console.log(`📱 Phone: ${orderData.customerInfo.phone}`);
  console.log(`💳 Payment: ${orderData.paymentInfo.method}`);
  console.log(`📦 Items: ${orderData.items.length} products`);

  try {
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Note: Your API might need authentication
        // Add auth header if required
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    console.log(`\n📊 API Response: ${response.status}`);
    
    if (response.ok && result.success) {
      console.log('✅ Order placed successfully!');
      console.log(`📋 Order ID: ${result.orderId}`);
      console.log(`📊 Status: ${result.internalStatus}`);
      
      if (result.internalStatus === 'approved') {
        console.log('\n🎉 Order auto-approved (Prepaid)!');
        console.log('📱 WhatsApp notification should be sent automatically');
        console.log('📱 Check WhatsApp on 9999968191');
        
        // Wait a moment and check if notification was sent
        console.log('\n⏳ Waiting 3 seconds for notification...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ If notification was sent, you should see it on WhatsApp now!');
      } else {
        console.log(`\n⏳ Order status: ${result.internalStatus}`);
        console.log('💡 Notification will be sent when order is approved');
      }
      
    } else {
      console.log('❌ Order placement failed');
      console.log(`Error: ${result.error || 'Unknown error'}`);
      
      if (result.details) {
        console.log('Details:', JSON.stringify(result.details, null, 2));
      }
      
      // Common issues and solutions
      if (response.status === 401) {
        console.log('\n💡 Authentication required. The API might need admin login.');
        console.log('💡 Try logging into your admin dashboard first.');
      } else if (response.status === 400) {
        console.log('\n💡 Invalid order data. Check the order structure.');
      }
    }

  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure Next.js server is running: npm run dev');
    console.log('2. Check if localhost:3000 is accessible');
    console.log('3. Verify API endpoint exists');
  }
}

// Run the test
placeOrderWithNotification().catch(console.error);