// Send WhatsApp template message to specific number
require('dotenv').config({ path: '.env.local' });

async function sendTestMessage() {
  const baseUrl = 'https://crm.marketingravan.com/api/meta/v19.0';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  // Target phone number
  const targetPhone = "919999968191";
  
  // Test with order placed template
  const payload = {
    messaging_product: "whatsapp",
    to: targetPhone,
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
            { type: "text", text: "Test Customer" },           // Customer Name
            { type: "text", text: "ORD_2025_TEST001" },        // Order ID
            { type: "text", text: "₹1299" },                   // Amount
            { type: "text", text: "COD" },                     // Payment Method
            { type: "text", text: "Premium Product Bundle" },  // Items
            { type: "text", text: "123 Test Street, Mumbai, Maharashtra 400001" } // Address
          ]
        }
      ]
    }
  };

  console.log(`🚀 Sending WhatsApp message to ${targetPhone}...`);
  console.log('Template: buggly_order_placed');
  
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
      console.log('\n✅ Message sent successfully!');
      if (responseData.message?.queue_id) {
        console.log(`📋 Queue ID: ${responseData.message.queue_id}`);
      }
    } else {
      console.log('\n❌ Message failed to send');
      if (responseData.error) {
        console.log(`Error: ${responseData.error.message}`);
        console.log(`Code: ${responseData.error.code}`);
      }
    }
    
  } catch (error) {
    console.error('\n💥 Network error:', error.message);
  }
}

sendTestMessage();