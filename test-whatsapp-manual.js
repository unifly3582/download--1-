// Manual WhatsApp Test Script
// Run with: node test-whatsapp-manual.js

require('dotenv').config({ path: '.env.local' });

// Mock the WhatsApp service for testing
class WhatsAppService {
  constructor(config) {
    this.config = config;
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  async sendTemplateMessage(to, template) {
    try {
      const cleanPhone = to.replace(/[\s+\-()]/g, '');
      
      const payload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
          name: template.name,
          language: {
            code: template.language
          },
          components: template.components
        }
      };

      console.log(`\n🚀 Sending WhatsApp message to ${cleanPhone}`);
      console.log(`📋 Template: ${template.name}`);
      console.log(`📄 Payload:`, JSON.stringify(payload, null, 2));

      if (!this.config.accessToken || this.config.accessToken === 'your_whatsapp_access_token_here') {
        console.log('❌ WhatsApp Access Token not configured');
        return {
          success: false,
          error: 'Access token not configured'
        };
      }

      const response = await fetch(
        `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ WhatsApp API Error:', responseData);
        return {
          success: false,
          error: responseData.error?.message || 'WhatsApp API error',
          details: responseData
        };
      }

      console.log('✅ Message sent successfully!');
      console.log('📨 Response:', responseData);
      return {
        success: true,
        messageId: responseData.messages?.[0]?.id,
        details: responseData
      };

    } catch (error) {
      console.error('❌ Service error:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }
}

// Test templates
const ORDER_PLACED_TEMPLATE = {
  name: "order_placed_confirmation",
  language: "en",
  components: [
    {
      type: "header",
      parameters: [
        {
          type: "text",
          text: "John Doe"
        }
      ]
    },
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: "ORD_2024_TEST123"
        },
        {
          type: "text", 
          text: "1299"
        },
        {
          type: "text",
          text: "Premium Organic Honey 500g, Natural Ghee 250ml"
        }
      ]
    }
  ]
};

async function testWhatsApp() {
  console.log('🧪 WhatsApp Manual Test Starting...\n');

  // Check environment variables
  const config = {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  };

  console.log('🔧 Configuration Check:');
  console.log(`Access Token: ${config.accessToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`Phone Number ID: ${config.phoneNumberId ? '✅ Set' : '❌ Missing'}`);
  console.log(`Business Account ID: ${config.businessAccountId ? '✅ Set' : '❌ Missing'}`);

  if (!config.accessToken || !config.phoneNumberId || !config.businessAccountId) {
    console.log('\n❌ Missing required environment variables. Please check your .env.local file.');
    console.log('\nRequired variables:');
    console.log('- WHATSAPP_ACCESS_TOKEN');
    console.log('- WHATSAPP_PHONE_NUMBER_ID');
    console.log('- WHATSAPP_BUSINESS_ACCOUNT_ID');
    return;
  }

  // Test phone number (replace with your test number)
  const testPhoneNumber = '919876543210'; // Replace with your WhatsApp test number
  
  console.log('\n⚠️  IMPORTANT: Replace this with your actual test phone number!');
  console.log('Make sure this number is added to your WhatsApp Business account test numbers!');
  
  console.log(`\n📱 Test Phone Number: ${testPhoneNumber}`);
  console.log('⚠️  Make sure this number is added to your WhatsApp Business account test numbers!');

  const whatsappService = new WhatsAppService(config);

  // Test sending order placed notification
  console.log('\n' + '='.repeat(50));
  console.log('Testing Order Placed Notification');
  console.log('='.repeat(50));

  const result = await whatsappService.sendTemplateMessage(testPhoneNumber, ORDER_PLACED_TEMPLATE);
  
  if (result.success) {
    console.log('🎉 Test completed successfully!');
    console.log(`📨 Message ID: ${result.messageId}`);
  } else {
    console.log('❌ Test failed!');
    console.log(`Error: ${result.error}`);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Check your WhatsApp for the test message');
  console.log('2. If successful, test other notification types via the admin dashboard');
  console.log('3. If failed, check the error message and your WhatsApp Business setup');
}

// Run the test
testWhatsApp().catch(console.error);