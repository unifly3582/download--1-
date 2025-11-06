// Test complete order shipping flow with WhatsApp notification
require('dotenv').config({ path: '.env.local' });

async function testShipOrderFlow() {
  console.log('🚢 Testing Complete Order Shipping Flow...\n');

  // Use the provided API key directly
  const apiKey = "cbb7750d2371ea42ecacd25512d525da2c769dc9";

  try {
    // Step 1: Get orders that can be shipped (approved status)
    console.log('📋 Step 1: Fetching orders ready to ship...');
    
    const ordersResponse = await fetch('http://localhost:9006/api/orders?status=to-ship', {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey
      }
    });

    if (!ordersResponse.ok) {
      console.log('❌ Failed to fetch orders:', ordersResponse.status);
      return;
    }

    const ordersResult = await ordersResponse.json();
    
    if (!ordersResult.success || !ordersResult.data || ordersResult.data.length === 0) {
      console.log('❌ No orders ready to ship found');
      console.log('💡 Create an order first or approve an existing order');
      return;
    }

    // Get the first order ready to ship
    const orderToShip = ordersResult.data[0];
    console.log(`✅ Found order ready to ship: ${orderToShip.orderId}`);
    console.log(`👤 Customer: ${orderToShip.customerInfo.name}`);
    console.log(`📱 Phone: ${orderToShip.customerInfo.phone}`);
    console.log(`💰 Amount: ₹${orderToShip.pricingInfo.grandTotal}`);
    console.log(`💳 Payment: ${orderToShip.paymentInfo.method}`);

    // Step 2: Ship the order via Delhivery
    console.log(`\n📦 Step 2: Shipping order ${orderToShip.orderId} via Delhivery...`);
    
    const shipmentPayload = {
      courier: "delhivery"
    };

    const shipResponse = await fetch(`http://localhost:9006/api/orders/${orderToShip.orderId}/ship`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(shipmentPayload)
    });

    const shipResult = await shipResponse.json();

    console.log(`\n📊 Shipping API Response: ${shipResponse.status}`);
    console.log('📨 Response Data:', JSON.stringify(shipResult, null, 2));

    if (shipResponse.ok && shipResult.success) {
      console.log('\n🎉 Order shipped successfully!');
      console.log(`📋 AWB Number: ${shipResult.awb}`);
      console.log(`🔗 Tracking URL: ${shipResult.trackingUrl}`);
      
      console.log('\n📱 WhatsApp notification should be sent automatically!');
      console.log(`📱 Check WhatsApp on ${orderToShip.customerInfo.phone} for shipped notification`);
      
      // Wait for notification processing
      console.log('\n⏳ Waiting 5 seconds for WhatsApp notification...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('\n📱 Expected WhatsApp message content:');
      console.log(`Customer: ${orderToShip.customerInfo.name}`);
      console.log(`Order: ${orderToShip.orderId}`);
      console.log(`AWB: ${shipResult.awb}`);
      console.log(`Amount: ₹${orderToShip.pricingInfo.grandTotal}`);
      console.log(`Payment: ${orderToShip.paymentInfo.method}`);
      console.log(`Tracking: https://www.delhivery.com/track-v2/package/${shipResult.awb}`);
      
    } else {
      console.log('\n❌ Order shipping failed');
      console.log(`Error: ${shipResult.error || 'Unknown error'}`);
      
      if (shipResult.details) {
        console.log('Details:', JSON.stringify(shipResult.details, null, 2));
      }
      
      // Common troubleshooting
      if (shipResponse.status === 422) {
        console.log('\n💡 Possible issues:');
        console.log('- Order payment not completed (for Prepaid orders)');
        console.log('- Order missing weight/dimensions');
        console.log('- Delhivery API configuration issues');
        console.log('- Invalid address or pincode');
      }
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure Next.js server is running: npm run dev');
    console.log('2. Check Delhivery settings are configured');
    console.log('3. Verify orders exist and are ready to ship');
  }
}

// Alternative: Ship a specific order by ID
async function shipSpecificOrder(orderId) {
  console.log(`🚢 Shipping specific order: ${orderId}\n`);
  
  const apiKey = "cbb7750d2371ea42ecacd25512d525da2c769dc9";
  
  try {
    const shipmentPayload = {
      courier: "delhivery"
    };

    const response = await fetch(`http://localhost:9006/api/orders/${orderId}/ship`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(shipmentPayload)
    });

    const result = await response.json();
    
    console.log(`📊 Response: ${response.status}`);
    console.log('📨 Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Order shipped successfully!');
      console.log('📱 WhatsApp notification should be sent!');
    } else {
      console.log('\n❌ Shipping failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
async function runTest() {
  console.log('🚀 Order Shipping Flow Test\n');
  
  // Check if specific order ID provided as argument
  const specificOrderId = process.argv[2];
  
  if (specificOrderId) {
    await shipSpecificOrder(specificOrderId);
  } else {
    await testShipOrderFlow();
  }
}

runTest().catch(console.error);

// Usage:
// node test-ship-order-flow.js                    // Ship first available order
// node test-ship-order-flow.js ORD_2025_ABC123   // Ship specific order