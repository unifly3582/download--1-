// Test with standard Facebook Graph API
require('dotenv').config({ path: '.env.local' });

async function testStandardAPI() {
  console.log('🧪 Testing with Standard Facebook Graph API...\n');

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  const payload = {
    "messaging_product": "whatsapp",
    "to": "919999968191",
    "type": "template",
    "template": {
      "name": "buggly_order_confirmation",
      "language": {
        "code": "en"
      },
      "components": [
        {
          "type": "body",
          "parameters": [
            {"type": "text", "text": "Test Customer"},
            {"type": "text", "text": "ORD_TEST_123"},
            {"type": "text", "text": "₹1299"},
            {"type": "text", "text": "Organic Honey, Pure Ghee"}
          ]
        }
      ]
    }
  };

  try {
    // Standard Facebook Graph API URL
    const apiUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    
    console.log(`🚀 Standard API URL: ${apiUrl}`);
    console.log('📄 Payload:', JSON.stringify(payload, null, 2));
    
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
      console.log('\n✅ Standard API works!');
    } else {
      console.log('\n❌ Standard API also failed');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testStandardAPI().catch(console.error);