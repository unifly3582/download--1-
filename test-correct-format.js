// Test the correct WhatsApp format for order creation
require('dotenv').config({ path: '.env.local' });

async function testCorrectFormat() {
  const baseUrl = 'https://crm.marketingravan.com/api/meta/v19.0';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  // Using the EXACT format you specified
  const payload = {
    "to": "919999968191",
    "recipient_type": "individual",
    "type": "template",
    "template": {
      "language": {
        "policy": "deterministic",
        "code": "en"
      },
      "name": "buggly_order_confirmation",
      "components": [
        {
          "type": "body",
          "parameters": [
            {"type": "text", "text": "John Doe"},           // Customer Name
            {"type": "text", "text": "ORD_2025_ADMIN001"},  // Order ID  
            {"type": "text", "text": "₹2,499"},             // Order Amount
            {"type": "text", "text": "Skincare Bundle"}     // Product Name
          ]
        }
      ]
    }
  };

  console.log('🎯 Testing EXACT format for order creation...');
  console.log('Using your specified template structure');
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(
      `${baseUrl}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );

    const responseData = await response.json();
    
    console.log('\n📱 Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Order creation notification format is CORRECT!');
      console.log('🚀 Admin panel should now send notifications properly!');
    } else {
      console.log('\n❌ Format issue detected...');
      if (responseData.error) {
        console.log(`Error: ${responseData.error.message}`);
        console.log(`Code: ${responseData.error.code}`);
      }
    }
    
  } catch (error) {
    console.error('\n💥 Error:', error.message);
  }
}

testCorrectFormat();