// Simple test for order confirmation notification
require('dotenv').config({ path: '.env.local' });

async function testNotification() {
  console.log('🧪 Testing Order Confirmation Notification...\n');

  try {
    // Test WhatsApp service directly
    const { createWhatsAppService } = await import('./src/lib/whatsapp/service.ts');
    const { ORDER_PLACED_TEMPLATE, buildWhatsAppTemplate } = await import('./src/lib/whatsapp/templates.ts');
    
    const whatsappService = createWhatsAppService();
    
    if (!whatsappService) {
      console.log('❌ WhatsApp service not configured!');
      console.log('   Check your .env.local file for:');
      console.log('   - WHATSAPP_ACCESS_TOKEN');
      console.log('   - WHATSAPP_PHONE_NUMBER_ID');
      console.log('   - WHATSAPP_BUSINESS_ACCOUNT_ID');
      return;
    }
    
    console.log('✅ WhatsApp service is configured\n');
    
    // Test data
    const testData = {
      customerName: 'Test Customer',
      orderId: 'TEST-001',
      orderAmount: 500,
      items: 'Test Product',
      paymentMethod: 'COD',
      deliveryAddress: 'Test Address, Test City, Test State 123456'
    };
    
    console.log('📤 Sending test notification...');
    console.log('   Customer: Test Customer');
    console.log('   Order ID: TEST-001');
    console.log('   Phone: +919999999999 (test number)\n');
    
    const template = buildWhatsAppTemplate(ORDER_PLACED_TEMPLATE, testData);
    
    console.log('📋 Template being sent:');
    console.log(JSON.stringify(template, null, 2));
    console.log('');
    
    const result = await whatsappService.sendTemplateMessage('+919999999999', template);
    
    if (result.success) {
      console.log('✅ Notification sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
    } else {
      console.log('❌ Notification failed!');
      console.log(`   Error: ${result.error}`);
      if (result.details) {
        console.log('   Details:', JSON.stringify(result.details, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  }
}

testNotification()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
