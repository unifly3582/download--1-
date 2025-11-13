/**
 * Check WhatsApp templates using your custom API endpoint
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function checkTemplatesCustomAPI() {
  console.log('🔍 Checking WhatsApp Templates via Custom API...\n');

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !phoneNumberId || !businessAccountId) {
    console.error('❌ Missing WhatsApp credentials in .env.local');
    return;
  }

  console.log('Configuration:');
  console.log(`  Phone Number ID: ${phoneNumberId}`);
  console.log(`  Business Account ID: ${businessAccountId}`);
  console.log(`  Custom API: https://crm.marketingravan.com/api/meta/v19.0`);
  console.log('');

  try {
    // Try the custom API endpoint
    console.log('Attempting to fetch templates via custom API...\n');
    
    const url = `https://crm.marketingravan.com/api/meta/v19.0/${businessAccountId}/message_templates`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 100
      },
      timeout: 10000
    });

    console.log('✅ Successfully connected to API\n');
    
    const templates = response.data.data || response.data;
    
    if (!templates || templates.length === 0) {
      console.log('⚠️  No templates found or different response format');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return;
    }

    console.log(`Found ${templates.length} template(s)\n`);
    
    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name || 'Unnamed'}`);
      console.log(`   Status: ${template.status || 'Unknown'}`);
      console.log(`   Category: ${template.category || 'Unknown'}`);
      console.log(`   Language: ${template.language || 'Unknown'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.log('\n\n💡 Alternative: Check templates manually');
    console.log('   1. Go to https://business.facebook.com/');
    console.log('   2. Select your business account');
    console.log('   3. Go to WhatsApp Manager');
    console.log('   4. Click "Message Templates"');
    console.log('   5. Look for approved templates');
    console.log('');
    console.log('   Then share with me:');
    console.log('   - Template names (e.g., "buggly_order_shipped")');
    console.log('   - Which ones are approved');
    console.log('   - Variable order for each template');
  }
}

checkTemplatesCustomAPI()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
