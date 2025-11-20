// Get ALL WhatsApp templates
require('dotenv').config({ path: '.env.local' });

async function getAllTemplates() {
  console.log('🔍 Fetching ALL WhatsApp Templates...\n');

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !businessAccountId) {
    console.error('❌ Missing WhatsApp credentials');
    return;
  }

  try {
    const response = await fetch(
      `https://crm.marketingravan.com/api/meta/v19.0/${businessAccountId}/message_templates?limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', data);
      return;
    }

    console.log(`📦 Found ${data.data?.length || 0} templates\n`);
    console.log('═'.repeat(80));

    data.data?.forEach((template, index) => {
      console.log(`\n${index + 1}. ${template.name}`);
      console.log(`   Status: ${template.status}`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Language: ${template.language}`);
      
      if (template.components) {
        console.log(`\n   Components:`);
        template.components.forEach((comp, i) => {
          console.log(`\n   ${i + 1}. ${comp.type}`);
          if (comp.format) console.log(`      Format: ${comp.format}`);
          if (comp.text) {
            console.log(`      Text:`);
            console.log(`      ${comp.text.split('\n').join('\n      ')}`);
          }
          if (comp.example?.body_text) {
            console.log(`      Example Variables:`);
            comp.example.body_text[0]?.forEach((ex, j) => {
              console.log(`        {{${j + 1}}}: ${ex}`);
            });
          }
        });
      }
      console.log('\n' + '─'.repeat(80));
    });

    // Look specifically for order placed templates
    console.log('\n\n🔍 ORDER PLACED TEMPLATES:\n');
    const orderPlacedTemplates = data.data?.filter(t => 
      t.name.toLowerCase().includes('order') && 
      (t.name.toLowerCase().includes('received') || 
       t.name.toLowerCase().includes('placed') ||
       t.name.toLowerCase().includes('confirm'))
    );

    if (orderPlacedTemplates?.length > 0) {
      orderPlacedTemplates.forEach(t => {
        console.log(`✅ ${t.name} (${t.status})`);
      });
    } else {
      console.log('❌ No order placed/received templates found!');
      console.log('\nAvailable templates:');
      data.data?.forEach(t => {
        console.log(`   - ${t.name} (${t.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getAllTemplates()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
