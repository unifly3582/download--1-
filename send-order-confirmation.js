// Send WhatsApp order confirmation template
require('dotenv').config({ path: '.env.local' });

async function sendOrderConfirmation() {
  const baseUrl = 'https://crm.marketingravan.com/api/meta/v19.0';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  // Target phone number
  const targetPhone = "919999968191";
  
  // Using the buggly_order_confirmation template format you provided
  const payload = {
    messaging_product: "whatsapp",
    to: targetPhone,
    recipient_type: "individual",
    type: "template",
    template: {
      language: {
        policy: "deterministic",
        code: "en"
      },
      name: "buggly_order_confirmation",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "John Doe" },              // Customer Name
            { type: "text", text: "ORD_2025_ABC123" },       // Order ID
            { type: "text", text: "₹1,299" },                // Order Amount
            { type: "text", text: "Premium Skincare Kit" }   // Product Name
          ]
        }
      ]
    }
  };

  console.log(`🚀 Sending Order Confirmation to ${targetPhone}...`);
  console.log('Template: buggly_order_confirmation');
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
      console.log('\n✅ Order confirmation sent successfully!');
      if (responseData.message?.queue_id) {
        console.log(`📋 Queue ID: ${responseData.message.queue_id}`);
      }
    } else {
      console.log('\n❌ Message failed to send');
      if (responseData.error) {
        console.log(`Error: ${responseData.error.message}`);
        console.log(`Code: ${responseData.error.code}`);
        console.log(`Details:`, responseData.error.error_data || 'No additional details');
      }
    }
    
  } catch (error) {
    console.error('\n💥 Network error:', error.message);
  }
}

sendOrderConfirmation();