// Test WhatsApp API directly
require('dotenv').config({ path: '.env.local' });

async function testWhatsAppAPI() {
  console.log('🧪 Testing WhatsApp API...\n');

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const baseUrl = 'https://crm.marketingravan.com/api/meta/v19.0';

  console.log('📋 Configuration:');
  console.log(`   Base URL: ${baseUrl}`);
  console.log(`   Phone Number ID: ${phoneNumberId}`);
  console.log(`   Access Token: ${accessToken ? accessToken.substring(0, 20) + '...' : 'NOT SET'}`);
  console.log('');

  if (!accessToken || !phoneNumberId) {
    console.log('❌ Missing configuration!');
    return;
  }

  const url = `${baseUrl}/${phoneNumberId}/messages`;
  console.log(`📡 Testing URL: ${url}\n`);

  const payload = {
    to: "919999999999",
    recipient_type: "individual",
    type: "template",
    template: {
      language: {
        policy: "deterministic",
        code: "en"
      },
      name: "bugglysimple",
      components: [{
        type: "body",
        parameters: [
          { type: "text", text: "Test Customer" },
          { type: "text", text: "TEST-001" }
        ]
      }]
    }
  };

  console.log('📤 Sending test request...');
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📡 Response Headers:`, Object.fromEntries(response.headers.entries()));
    console.log('');

    const contentType = response.headers.get('content-type');
    console.log(`📋 Content-Type: ${contentType}\n`);

    const responseText = await response.text();
    
    if (contentType?.includes('application/json')) {
      console.log('✅ Response is JSON:');
      const responseData = JSON.parse(responseText);
      console.log(JSON.stringify(responseData, null, 2));
    } else {
      console.log('❌ Response is NOT JSON (probably HTML error page):');
      console.log(responseText.substring(0, 500));
      console.log('...');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWhatsAppAPI()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
