// Send CORRECT WhatsApp template to 9999968191
require('dotenv').config({ path: '.env.local' });

async function sendCorrectTemplate() {
  console.log('📤 Sending CORRECT WhatsApp Template to +919999968191\n');

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.error('❌ Missing WhatsApp credentials');
    return;
  }

  // CORRECT template: bugglysimple
  // Parameters: {{1}} = Customer Name, {{2}} = Order ID
  const payload = {
    to: "919999968191",
    recipient_type: "individual",
    type: "template",
    template: {
      language: {
        policy: "deterministic",
        code: "en"
      },
      name: "bugglysimple",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "Rohit Verma" },  // {{1}} Customer Name
            { type: "text", text: "5077" }          // {{2}} Order ID
          ]
        }
      ]
    }
  };

  console.log('📋 Template: bugglysimple');
  console.log('📋 Parameters:');
  console.log('   {{1}} Customer Name: Rohit Verma');
  console.log('   {{2}} Order ID: 5077');
  console.log('');

  try {
    const response = await fetch(
      `https://crm.marketingravan.com/api/meta/v19.0/${phoneNumberId}/messages`,
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

    console.log(`📊 Response Status: ${response.status}`);
    console.log('📊 Response:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('');

    if (response.ok) {
      console.log('✅ WhatsApp message sent successfully!');
      console.log('\n📱 Expected message:');
      console.log('━'.repeat(50));
      console.log('Order Placed');
      console.log('');
      console.log('Dear *Rohit Verma*,');
      console.log('Your order has been successfully received *(Order No: 5077*).');
      console.log('');
      console.log('We will share your tracking ID as soon as your package is dispatched.');
      console.log('━'.repeat(50));
    } else {
      console.log('❌ Failed to send message');
      console.log(`   Error: ${responseData.error?.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendCorrectTemplate()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
