// Test WhatsApp message sending
require('dotenv').config({ path: '.env.local' });

const baseUrl = 'https://crm.marketingravan.com/api/meta/v19.0';

async function testWhatsAppSend() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  // Test with a sample order placed template
  const payload = {
    messaging_product: "whatsapp",
    to: "919876543210", // Test phone number
    type: "template",
    template: {
      name: "buggly_order_placed",
      language: {
        code: "en"
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "Test Customer" },      // Customer Name
            { type: "text", text: "ORD_2025_TEST123" },   // Order ID
            { type: "text", text: "₹999" },               // Amount
            { type: "text", text: "COD" },                // Payment Method
            { type: "text", text: "Test Product" },       // Items
            { type: "text", text: "Test Address" }        // Address
          ]
        }
      ]
    }
  };

  console.log('=== WhatsApp Send Test ===');
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
    
    console.log('\n=== Response ===');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('✅ WhatsApp message sent successfully!');
    } else {
      console.log('❌ WhatsApp message failed');
      console.log('Error:', responseData.error?.message || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testWhatsAppSend();