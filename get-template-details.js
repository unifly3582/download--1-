/**
 * Get detailed information about approved WhatsApp templates
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function getTemplateDetails() {
  console.log('🔍 Fetching Template Details...\n');

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  try {
    const url = `https://crm.marketingravan.com/api/meta/v19.0/${businessAccountId}/message_templates`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 100,
        fields: 'name,status,category,language,components'
      },
      timeout: 10000
    });

    const templates = response.data.data || response.data;
    
    // Filter for tracking-related templates
    const trackingTemplates = templates.filter(t => 
      t.name.includes('buggly') && 
      (t.name.includes('ship') || t.name.includes('deliver') || t.name.includes('out'))
    );

    console.log('📦 Tracking-Related Templates:\n');
    console.log('═'.repeat(80));
    
    trackingTemplates.forEach((template, index) => {
      console.log(`\n${index + 1}. ${template.name}`);
      console.log(`   Status: ${template.status}`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Language: ${template.language}`);
      
      if (template.components && template.components.length > 0) {
        console.log('\n   Components:');
        template.components.forEach((comp, compIndex) => {
          console.log(`\n   ${compIndex + 1}. ${comp.type.toUpperCase()}`);
          
          if (comp.format) {
            console.log(`      Format: ${comp.format}`);
          }
          
          if (comp.text) {
            console.log(`      Text:`);
            console.log(`      ${comp.text.split('\n').join('\n      ')}`);
          }
          
          if (comp.example && comp.example.body_text) {
            console.log(`      Example Variables:`);
            comp.example.body_text[0].forEach((ex, exIndex) => {
              console.log(`        {{${exIndex + 1}}}: ${ex}`);
            });
          }
          
          if (comp.example && comp.example.header_text) {
            console.log(`      Header Example:`);
            comp.example.header_text.forEach((ex, exIndex) => {
              console.log(`        {{${exIndex + 1}}}: ${ex}`);
            });
          }
          
          if (comp.buttons) {
            console.log(`      Buttons:`);
            comp.buttons.forEach((btn, btnIndex) => {
              console.log(`        ${btnIndex + 1}. ${btn.type}: ${btn.text || btn.url || 'N/A'}`);
            });
          }
        });
      }
      
      console.log('\n' + '─'.repeat(80));
    });

    // Save full response
    const fs = require('fs');
    fs.writeFileSync('template-details.json', JSON.stringify(templates, null, 2));
    console.log('\n\n💾 Full template data saved to: template-details.json');

    // Summary for implementation
    console.log('\n\n🎯 Implementation Summary:\n');
    
    const shipped = trackingTemplates.find(t => t.name.includes('ship') && !t.name.includes('out'));
    const outForDelivery = trackingTemplates.find(t => t.name.includes('out'));
    const delivered = trackingTemplates.find(t => t.name.includes('deliver') && !t.name.includes('out') && !t.name.includes('ship'));
    
    console.log('Templates to use:');
    console.log(`  Shipped: ${shipped ? '✅ ' + shipped.name : '❌ Not found'}`);
    console.log(`  Out for Delivery: ${outForDelivery ? '✅ ' + outForDelivery.name : '❌ Not found'}`);
    console.log(`  Delivered: ${delivered ? '✅ ' + delivered.name : '⚠️  Not found - may need to create'}`);
    
    console.log('\n\nNext steps:');
    console.log('  1. Review template details above');
    console.log('  2. Check template-details.json for full structure');
    console.log('  3. Update src/lib/whatsapp/templates.ts with correct names');
    console.log('  4. Map variables correctly');
    console.log('  5. Enable notifications in tracking sync');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

getTemplateDetails()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
