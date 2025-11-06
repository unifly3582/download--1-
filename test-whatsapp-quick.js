// Quick WhatsApp Test Script for your existing template
require('dotenv').config({ path: '.env.local' });

async function sendTestMessage() {
    console.log('🧪 Quick WhatsApp Test Starting...\n');

    // Your credentials
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    console.log('🔧 Configuration:');
    console.log(`Access Token: ${accessToken ? '✅ Set' : '❌ Missing'}`);
    console.log(`Phone Number ID: ${phoneNumberId ? '✅ Set' : '❌ Missing'}`);

    if (!accessToken || !phoneNumberId) {
        console.log('❌ Missing credentials');
        return;
    }

    // Test message payload using your existing template
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
                        { "type": "text", "text": "Test Customer" },
                        { "type": "text", "text": "ORD_TEST_123" },
                        { "type": "text", "text": "₹1299" },
                        { "type": "text", "text": "Organic Honey, Pure Ghee" }
                    ]
                }
            ]
        }
    };

    console.log('\n📋 Sending message to 9999968191');
    console.log('📄 Payload:', JSON.stringify(payload, null, 2));

    try {
        // Using your custom API URL
        const apiUrl = `https://crm.marketingravan.com/api/meta/v19.0/${phoneNumberId}/messages`;

        console.log(`\n🚀 API URL: ${apiUrl}`);

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
            console.log('\n✅ Message sent successfully!');
            console.log(`📨 Message ID: ${responseData.messages?.[0]?.id || 'Not provided'}`);
            console.log('\n📱 Check WhatsApp on 9999968191 for the message!');
        } else {
            console.log('\n❌ Message failed to send');
            console.log(`Error: ${responseData.error?.message || 'Unknown error'}`);

            // Common error troubleshooting
            if (response.status === 401) {
                console.log('💡 Tip: Check if your access token is valid and not expired');
            } else if (response.status === 400) {
                console.log('💡 Tip: Check if the template name and parameters are correct');
            } else if (response.status === 403) {
                console.log('💡 Tip: Check if the phone number is added to your test numbers');
            }
        }

    } catch (error) {
        console.error('\n❌ Network/Connection Error:', error.message);
    }
}

// Run the test
sendTestMessage().catch(console.error);