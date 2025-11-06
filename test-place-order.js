// Test script to place an order and trigger WhatsApp notification
require('dotenv').config({ path: '.env.local' });

async function placeTestOrder() {
  console.log('🧪 Testing Order Placement with WhatsApp Notification...\n');

  // Test order data for a chicken farmer
  const orderData = {
    orderSource: "admin_form",
    customerInfo: {
      name: "Rajesh Kumar",
      phone: "9999968191", // Your test number
      email: "rajesh@example.com"
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
        hsnCode: "2309"
      },
      {
        productId: "PROD002", 
        productName: "Vitamin B-Complex Supplement",
        quantity: 1,
        unitPrice: 450,
        sku: "VIT-BCOMP-500",
        hsnCode: "3003"
      }
    ],
    paymentInfo: {
      method: "COD"
    }
  };

  console.log('📋 Order Data:');
  console.log(JSON.stringify(orderData, null, 2));

  try {
    // Place the order via your API
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication header if needed
        'Authorization': 'Bearer your_admin_token_here'
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    console.log(`\n📊 Order API Response Status: ${response.status}`);
    console.log('📨 Response Data:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('\n✅ Order placed successfully!');
      console.log(`📋 Order ID: ${result.orderId}`);
      console.log(`📊 Status: ${result.internalStatus}`);
      
      if (result.internalStatus === 'approved') {
        console.log('\n🎉 Order was auto-approved!');
        console.log('📱 WhatsApp notification should be sent automatically');
        console.log('📱 Check WhatsApp on 9999968191 for order confirmation');
      } else {
        console.log('\n⏳ Order needs approval');
        console.log('💡 WhatsApp notification will be sent after approval');
      }
    } else {
      console.log('\n❌ Order placement failed');
      console.log(`Error: ${result.error || 'Unknown error'}`);
      
      if (result.details) {
        console.log('Details:', JSON.stringify(result.details, null, 2));
      }
    }

  } catch (error) {
    console.error('\n❌ Network/Connection Error:', error.message);
    console.log('\n💡 Make sure your Next.js server is running on localhost:3000');
    console.log('💡 Run: npm run dev');
  }
}

// Alternative: Test with manual notification trigger
async function testManualNotification() {
  console.log('\n🔄 Testing Manual WhatsApp Notification...\n');
  
  // Simulate order data for notification
  const mockOrder = {
    orderId: "ORD_2024_TEST_" + Date.now(),
    customerInfo: {
      name: "Rajesh Kumar",
      phone: "9999968191"
    },
    pricingInfo: {
      grandTotal: 2850
    },
    paymentInfo: {
      method: "COD"
    },
    items: [
      { productName: "Broiler Feed Premium 25kg" },
      { productName: "Vitamin B-Complex Supplement" }
    ],
    shippingAddress: {
      street: "Village Rampur, Near Poultry Farm",
      city: "Sonipat", 
      state: "Haryana",
      zip: "131001"
    }
  };

  // Build notification data
  const notificationData = {
    customerName: mockOrder.customerInfo.name,
    orderId: mockOrder.orderId,
    orderAmount: mockOrder.pricingInfo.grandTotal,
    paymentMethod: mockOrder.paymentInfo.method,
    items: mockOrder.items.map(item => item.productName).join(', '),
    deliveryAddress: `${mockOrder.shippingAddress.street}, ${mockOrder.shippingAddress.city}, ${mockOrder.shippingAddress.state} ${mockOrder.shippingAddress.zip}`
  };

  // Send WhatsApp notification directly
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const payload = {
    "to": "919999968191",
    "recipient_type": "individual",
    "type": "template",
    "template": {
      "language": {
        "policy": "deterministic",
        "code": "en"
      },
      "name": "buggly_order_placed",
      "components": [
        {
          "type": "body",
          "parameters": [
            {"type": "text", "text": notificationData.customerName},
            {"type": "text", "text": notificationData.orderId},
            {"type": "text", "text": `₹${notificationData.orderAmount}`},
            {"type": "text", "text": notificationData.paymentMethod},
            {"type": "text", "text": notificationData.items},
            {"type": "text", "text": notificationData.deliveryAddress}
          ]
        }
      ]
    }
  };

  try {
    const apiUrl = `https://crm.marketingravan.com/api/meta/v19.0/${phoneNumberId}/messages`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log('✅ Manual WhatsApp notification sent!');
      console.log(`📨 Queue ID: ${responseData.message?.queue_id}`);
    } else {
      console.log('❌ Manual notification failed');
      console.log('Error:', responseData);
    }
  } catch (error) {
    console.error('❌ Manual notification error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Order Placement Tests\n');
  console.log('Choose test method:');
  console.log('1. Full order placement via API (requires server running)');
  console.log('2. Manual WhatsApp notification only\n');

  // For now, let's run the manual notification test
  await testManualNotification();
  
  console.log('\n' + '='.repeat(50));
  console.log('To test full order placement:');
  console.log('1. Start your Next.js server: npm run dev');
  console.log('2. Uncomment the placeTestOrder() call below');
  console.log('3. Run this script again');
}

runTests().catch(console.error);

// Uncomment to test full order placement (requires server running)
// placeTestOrder().catch(console.error);