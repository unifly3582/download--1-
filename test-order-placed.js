// Test the new buggly_order_placed template
require('dotenv').config({ path: '.env.local' });

async function testOrderPlacedTemplate() {
  console.log('🧪 Testing buggly_order_placed template...\n');

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  // Test message payload using your buggly_order_placed template
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
            {"type": "text", "text": "Rajesh Kumar"},           // Customer Name
            {"type": "text", "text": "ORD_2024_BF001"},         // Order ID
            {"type": "text", "text": "₹2,450"},                 // Amount
            {"type": "text", "text": "COD"},                     // Payment Method
            {"type": "text", "text": "Broiler Feed 25kg, Vitamin Supplement"}, // Items
            {"type": "text", "text": "Village Rampur, Haryana 125001"}         // Delivery Address
          ]
        }
      ]
    }
  };

  console.log('📋 Testing Order Placed notification');
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
      console.log('\n✅ Order Placed notification sent successfully!');
      console.log(`📨 Queue ID: ${responseData.message?.queue_id || 'Not provided'}`);
      console.log('\n📱 Check WhatsApp on 9999968191 for the order placed message!');
    } else {
      console.log('\n❌ Message failed to send');
      console.log(`Error: ${responseData.error?.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('\n❌ Network/Connection Error:', error.message);
  }
}

// Run the test
testOrderPlacedTemplate().catch(console.error);