// Test order creation with WhatsApp notification
require('dotenv').config({ path: '.env.local' });

async function createOrderWithWhatsApp() {
  console.log('🧪 Testing Order Creation with WhatsApp Notification...\n');

  // Test order data for chicken farmer - CORRECTED STRUCTURE
  const orderData = {
    orderSource: "admin_form",
    customerInfo: {
      name: "Rajesh Kumar",
      phone: "9999968191", // Your test WhatsApp number
      email: "rajesh.farmer@example.com"
      // customerId is optional - will be auto-generated
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
      method: "COD" // This will create order in pending status
    }
  };

  console.log('📋 Creating order for:');
  console.log(`👤 Customer: ${orderData.customerInfo.name}`);
  console.log(`📱 Phone: ${orderData.customerInfo.phone}`);
  console.log(`💳 Payment: ${orderData.paymentInfo.method}`);
  console.log(`📦 Items: ${orderData.items.length} products`);
  console.log(`💰 Total Value: ₹${orderData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)}`);

  try {
    // Use the provided API key directly
    const apiKey = "cbb7750d2371ea42ecacd25512d525da2c769dc9";

    console.log('\n🔑 Using machine authentication...');
    
    const response = await fetch('http://localhost:9006/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey // Machine authentication
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    console.log(`\n📊 API Response: ${response.status}`);
    console.log('📨 Response Data:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('\n✅ Order created successfully!');
      console.log(`📋 Order ID: ${result.orderId}`);
      console.log(`📊 Status: ${result.internalStatus}`);
      
      console.log('\n🎉 WhatsApp notification should be sent immediately!');
      console.log('📱 Check WhatsApp on 9999968191 for order confirmation');
      
      // Wait a moment for notification processing
      console.log('\n⏳ Waiting 5 seconds for WhatsApp notification...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('✅ If notification was sent, you should see it on WhatsApp now!');
      
      // Show what the notification should contain
      console.log('\n📱 Expected WhatsApp message content:');
      console.log(`Customer: ${orderData.customerInfo.name}`);
      console.log(`Order ID: ${result.orderId}`);
      console.log(`Amount: ₹${orderData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)}`);
      console.log(`Payment: ${orderData.paymentInfo.method}`);
      console.log(`Items: ${orderData.items.map(item => item.productName).join(', ')}`);
      console.log(`Address: ${orderData.shippingAddress.street}, ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zip}`);
      
    } else {
      console.log('\n❌ Order creation failed');
      console.log(`Error: ${result.error || 'Unknown error'}`);
      
      if (result.details) {
        console.log('Details:', JSON.stringify(result.details, null, 2));
      }
      
      // Common troubleshooting
      if (response.status === 401) {
        console.log('\n💡 Authentication failed. Check AI_AGENT_API_KEY');
      } else if (response.status === 400) {
        console.log('\n💡 Invalid order data. Check the order structure.');
      } else if (response.status === 500) {
        console.log('\n💡 Server error. Check server logs for details.');
      }
    }

  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure Next.js server is running: npm run dev');
    console.log('2. Check if localhost:9006 is accessible');
    console.log('3. Verify AI_AGENT_API_KEY is correct');
    console.log('4. Check server logs for any errors');
  }
}

// Additional function to check server status
async function checkServerStatus() {
  try {
    const response = await fetch('http://localhost:9006/api/orders', {
      method: 'GET',
      headers: {
        'X-API-Key': process.env.AI_AGENT_API_KEY
      }
    });
    
    console.log(`🌐 Server Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Server is running and API is accessible');
    } else {
      console.log('⚠️ Server responded but with non-200 status');
    }
  } catch (error) {
    console.log('❌ Server is not accessible');
    console.log('💡 Make sure to run: npm run dev');
  }
}

// Run the test
async function runTest() {
  console.log('🚀 Order Creation with WhatsApp Test\n');
  
  // First check if server is running
  await checkServerStatus();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Then create the order
  await createOrderWithWhatsApp();
}

runTest().catch(console.error);