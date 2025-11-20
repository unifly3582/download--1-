// Test WhatsApp notification for phone 9999968191
require('dotenv').config({ path: '.env.local' });

async function testWhatsApp() {
  console.log('🧪 Testing WhatsApp Notification for +919999968191\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`  WHATSAPP_ACCESS_TOKEN: ${process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`  WHATSAPP_PHONE_NUMBER_ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID || '❌ Missing'}`);
  console.log(`  WHATSAPP_BUSINESS_ACCOUNT_ID: ${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log('');

  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.error('❌ Missing required WhatsApp environment variables');
    return;
  }

  // Test data
  const testData = {
    customerName: "Rohit Verma",
    orderId: "TEST-001",
    orderAmount: 350,
    items: "Organic Honey 500g, Natural Ghee 250g",
    paymentMethod: "COD",
    deliveryAddress: "123 Test Street, Delhi, Delhi 110001"
  };

  // Build template
  const template = {
    name: "orderreceivedbuggly",
    language: "en",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: testData.customerName },
          { type: "text", text: testData.orderId },
          { type: "text", text: testData.items },
          { type: "text", text: testData.orderAmount.toString() },
          { type: "text", text: testData.deliveryAddress },
          { type: "text", text: testData.paymentMethod }
        ]
      }
    ]
  };

  console.log('📤 Sending WhatsApp message...');
  console.log(`   To: +919999968191`);
  console.log(`   Template: ${template.name}`);
  console.log('');

  // Send message
  const payload = {
    to: "919999968191",
    recipient_type: "individual",
    type: "template",
    template: {
      language: {
        policy: "deterministic",
        code: template.language
      },
      name: template.name,
      components: template.components
    }
  };

  console.log('📋 Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');

  try {
    const response = await fetch(
      `https://crm.marketingravan.com/api/meta/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );

    const responseData = await response.json();

    console.log(`📊 Response Status: ${response.status}`);
    console.log('📊 Response Data:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('');

    if (response.ok) {
      console.log('✅ WhatsApp message sent successfully!');
      console.log(`   Message ID: ${responseData.messages?.[0]?.id}`);
    } else {
      console.log('❌ WhatsApp API Error:');
      console.log(`   Error: ${responseData.error?.message || 'Unknown error'}`);
      console.log(`   Code: ${responseData.error?.code}`);
      console.log(`   Type: ${responseData.error?.type}`);
      if (responseData.error?.error_data) {
        console.log(`   Details: ${JSON.stringify(responseData.error.error_data)}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testWhatsApp()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
