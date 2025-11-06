// Test the buggly_order_shipped template
require('dotenv').config({ path: '.env.local' });

async function testShippedNotification() {
  console.log('🧪 Testing Order Shipped Notification...\n');

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  // Test message payload using your buggly_order_shipped template
  const payload = {
    "to": "919999968191",
    "recipient_type": "individual",
    "type": "template",
    "template": {
      "language": {
        "policy": "deterministic",
        "code": "en"
      },
      "name": "buggly_order_shipped",
      "components": [
        {
          "type": "body",
          "parameters": [
            {"type": "text", "text": "Rajesh Kumar"},           // Customer Name
            {"type": "text", "text": "ORD_2025_BF002"},         // Order ID
            {"type": "text", "text": "31232410020790"},         // AWB Number
            {"type": "text", "text": "2850"},                   // Amount
            {"type": "text", "text": "COD"}                     // Payment Method
          ]
        }
      ]
    }
  };

  console.log('📦 Testing Order Shipped notification');
  console.log('📄 Payload:', JSON.stringify(payload, null, 2));

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

    console.log(`\n📊 Response Status: ${response.status}`);
    console.log('📨 Response Data:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('\n✅ Order Shipped notification sent successfully!');
      console.log(`📨 Queue ID: ${responseData.message?.queue_id || 'Not provided'}`);
      console.log('\n📱 Check WhatsApp on 9999968191 for the shipped message!');
      
      console.log('\n📱 Expected message content:');
      console.log('Customer: Rajesh Kumar');
      console.log('Order: ORD_2025_BF002');
      console.log('AWB: 31232410020790');
      console.log('Amount: ₹2850');
      console.log('Payment: COD');
      console.log('Tracking: https://www.delhivery.com/track-v2/package/31232410020790');
    } else {
      console.log('\n❌ Message failed to send');
      console.log(`Error: ${responseData.error?.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('\n❌ Network/Connection Error:', error.message);
  }
}

// Run the test
testShippedNotification().catch(console.error);