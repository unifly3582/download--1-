/**
 * Check approved WhatsApp templates from Meta Business API
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function checkWhatsAppTemplates() {
  console.log('🔍 Checking WhatsApp Templates from Meta...\n');

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !businessAccountId) {
    console.error('❌ Missing WhatsApp credentials in .env.local');
    console.error('   Required: WHATSAPP_ACCESS_TOKEN, WHATSAPP_BUSINESS_ACCOUNT_ID');
    return;
  }

  console.log('Configuration:');
  console.log(`  Business Account ID: ${businessAccountId}`);
  console.log(`  Access Token: ${accessToken.substring(0, 20)}...`);
  console.log('');

  try {
    // Fetch message templates from Meta API
    console.log('Fetching templates from Meta API...\n');
    
    const url = `https://graph.facebook.com/v19.0/${businessAccountId}/message_templates`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        limit: 100 // Get up to 100 templates
      }
    });

    const templates = response.data.data;
    
    if (!templates || templates.length === 0) {
      console.log('⚠️  No templates found');
      return;
    }

    console.log(`✅ Found ${templates.length} template(s)\n`);
    console.log('═'.repeat(80));
    console.log('');

    // Group templates by status
    const byStatus = {
      APPROVED: [],
      PENDING: [],
      REJECTED: [],
      DISABLED: [],
      OTHER: []
    };

    templates.forEach(template => {
      const status = template.status || 'OTHER';
      if (byStatus[status]) {
        byStatus[status].push(template);
      } else {
        byStatus.OTHER.push(template);
      }
    });

    // Display approved templates
    if (byStatus.APPROVED.length > 0) {
      console.log('✅ APPROVED TEMPLATES:\n');
      
      byStatus.APPROVED.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name}`);
        console.log(`   Category: ${template.category}`);
        console.log(`   Language: ${template.language}`);
        console.log(`   ID: ${template.id}`);
        
        // Show components
        if (template.components && template.components.length > 0) {
          console.log('   Components:');
          template.components.forEach(comp => {
            console.log(`     - ${comp.type.toUpperCase()}`);
            if (comp.text) {
              // Show first 100 chars of text
              const text = comp.text.substring(0, 100);
              console.log(`       Text: ${text}${comp.text.length > 100 ? '...' : ''}`);
            }
            if (comp.format) {
              console.log(`       Format: ${comp.format}`);
            }
            if (comp.example && comp.example.body_text) {
              console.log(`       Example: ${comp.example.body_text[0].join(', ')}`);
            }
          });
        }
        console.log('');
      });
    }

    // Display pending templates
    if (byStatus.PENDING.length > 0) {
      console.log('⏳ PENDING TEMPLATES:\n');
      
      byStatus.PENDING.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name}`);
        console.log(`   Category: ${template.category}`);
        console.log(`   Language: ${template.language}`);
        console.log('');
      });
    }

    // Display rejected templates
    if (byStatus.REJECTED.length > 0) {
      console.log('❌ REJECTED TEMPLATES:\n');
      
      byStatus.REJECTED.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name}`);
        console.log(`   Category: ${template.category}`);
        console.log(`   Reason: ${template.rejected_reason || 'Not specified'}`);
        console.log('');
      });
    }

    // Display disabled templates
    if (byStatus.DISABLED.length > 0) {
      console.log('🚫 DISABLED TEMPLATES:\n');
      
      byStatus.DISABLED.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name}`);
        console.log(`   Category: ${template.category}`);
        console.log('');
      });
    }

    // Summary
    console.log('═'.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   Total Templates: ${templates.length}`);
    console.log(`   ✅ Approved: ${byStatus.APPROVED.length}`);
    console.log(`   ⏳ Pending: ${byStatus.PENDING.length}`);
    console.log(`   ❌ Rejected: ${byStatus.REJECTED.length}`);
    console.log(`   🚫 Disabled: ${byStatus.DISABLED.length}`);

    // Check for tracking-related templates
    console.log('\n\n🎯 Tracking Notification Templates:');
    
    const trackingTemplates = {
      shipped: byStatus.APPROVED.find(t => 
        t.name.toLowerCase().includes('ship') && 
        !t.name.toLowerCase().includes('out')
      ),
      outForDelivery: byStatus.APPROVED.find(t => 
        t.name.toLowerCase().includes('out') || 
        t.name.toLowerCase().includes('delivery')
      ),
      delivered: byStatus.APPROVED.find(t => 
        t.name.toLowerCase().includes('deliver') && 
        !t.name.toLowerCase().includes('out')
      )
    };

    console.log(`   Shipped: ${trackingTemplates.shipped ? '✅ ' + trackingTemplates.shipped.name : '❌ Not found'}`);
    console.log(`   Out for Delivery: ${trackingTemplates.outForDelivery ? '✅ ' + trackingTemplates.outForDelivery.name : '❌ Not found'}`);
    console.log(`   Delivered: ${trackingTemplates.delivered ? '✅ ' + trackingTemplates.delivered.name : '❌ Not found'}`);

    // Recommendations
    console.log('\n\n💡 Recommendations:');
    
    if (!trackingTemplates.shipped) {
      console.log('   ⚠️  No "shipped" template found - create one for shipping notifications');
    }
    
    if (!trackingTemplates.outForDelivery) {
      console.log('   ⚠️  No "out for delivery" template found - create one for delivery notifications');
    }
    
    if (!trackingTemplates.delivered) {
      console.log('   ⚠️  No "delivered" template found - create one for delivery confirmation');
    }

    if (trackingTemplates.shipped && trackingTemplates.outForDelivery && trackingTemplates.delivered) {
      console.log('   ✅ All tracking templates are approved and ready to use!');
      console.log('\n   Next steps:');
      console.log('   1. Update src/lib/whatsapp/templates.ts with exact template names');
      console.log('   2. Update src/app/api/tracking/sync/route.ts to enable notifications');
      console.log('   3. Test with a real order');
    }

    // Save full response for debugging
    console.log('\n\n💾 Full template data saved to: whatsapp-templates-response.json');
    const fs = require('fs');
    fs.writeFileSync('whatsapp-templates-response.json', JSON.stringify(templates, null, 2));

  } catch (error) {
    console.error('\n❌ Error fetching templates:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('\n💡 Authentication failed. Check:');
        console.error('   1. WHATSAPP_ACCESS_TOKEN is valid');
        console.error('   2. Token has not expired');
        console.error('   3. Token has correct permissions');
      } else if (error.response.status === 400) {
        console.error('\n💡 Bad request. Check:');
        console.error('   1. WHATSAPP_BUSINESS_ACCOUNT_ID is correct');
        console.error('   2. Account has WhatsApp Business API access');
      }
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Network error. Check your internet connection.');
    }
  }
}

checkWhatsAppTemplates()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
