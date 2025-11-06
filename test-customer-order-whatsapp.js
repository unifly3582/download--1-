// Test customer order creation with WhatsApp notification
require('dotenv').config({ path: '.env.local' });

async function testCustomerOrderWithWhatsApp() {
  console.log('🧪 Testing Customer Order Creation with WhatsApp Notification...\n');

  // Test customer order data
  const orderData = {
    orderSource: "customer_app",
    customerInfo: {
      name: "Priya Sharma",
      phone: "9999968191", // Your test WhatsApp number
      email: "priya.customer@example.com"
    },
    shippingAddress: {
      street: "123 MG Road, Near Metro Station",
      city: "Bangalore",
      state: "Karnataka",
      zip: "560001",
      country: "India"
    },
    items: [
      {
        productId: "PROD001",
        variationId: "VAR001",
        sku: "ORG-HONEY-500",
        quantity: 2
      },
      {
        productId: "PROD002", 
        variationId: "VAR002",
        sku: "PURE-GHEE-1KG",
        quantity: 1
      }
    ],
    paymentInfo: {
      method: "COD"
    },
    trafficSource: {
      source: "direct",
      medium: "organic",
      landingPage: "https://example.com/products"
    }
  };

  console.log('📋 Creating customer order:');
  console.log(`👤 Customer: ${orderData.customerInfo.name}`);
  console.log(`📱 Phone: ${orderData.customerInfo.phone}`);
  console.log(`💳 Payment: ${orderData.paymentInfo.method}`);
  console.log(`📦 Items: ${orderData.items.length} products`);

  try {
    console.log('\n🚀 Calling customer order creation API...');
    
    const response = await fetch('http://localhost:9006/api/customer/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    console.log(`\n📊 API Response: ${response.status}`);
    console.log('📨 Response Data:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('\n✅ Customer order created successfully!');
      console.log(`📋 Order ID: ${result.orderId}`);
      console.log(`💰 Total Amount: ₹${result.orderDetails.totalAmount}`);
      
      console.log('\n🎉 WhatsApp notification should be sent automatically!');
      console.log('📱 Check WhatsApp on 9999968191 for order confirmation');
      
      // Wait a moment for notification processing
      console.log('\n⏳ Waiting 5 seconds for WhatsApp notification...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('✅ If notification was sent, you should see it on WhatsApp now!');
      
      console.log('\n📱 Expected WhatsApp message should contain:');
      console.log(`- Customer: ${orderData.customerInfo.name}`);
      console.log(`- Order ID: ${result.orderId}`);
      console.log(`- Amount: ₹${result.orderDetails.totalAmount}`);
      console.log(`- Payment: ${orderData.paymentInfo.method}`);
      console.log(`- Address: ${orderData.shippingAddress.street}, ${orderData.shippingAddress.city}`);
      
    } else {
      console.log('\n❌ Customer order creation failed');
      console.log(`Error: ${result.error || 'Unknown error'}`);
      
      if (result.details) {
        console.log('Details:', JSON.stringify(result.details, null, 2));
      }
    }

  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure Next.js server is running: npm run dev');
    console.log('2. Check if localhost:9006 is accessible');
    console.log('3. Check server logs for any errors');
  }
}

// Run the test
testCustomerOrderWithWhatsApp().catch(console.error);