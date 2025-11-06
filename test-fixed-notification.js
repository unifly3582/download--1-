// Test the fixed order notification
require('dotenv').config({ path: '.env.local' });

async function testFixedNotification() {
  const baseUrl = 'https://crm.marketingravan.com/api/meta/v19.0';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  // Mock order data
  const orderData = {
    customerName: "Test Customer",
    orderId: "ORD_2025_FIXED123",
    orderAmount: 1599,
    items: "Premium Face Cream, Vitamin C Serum"
  };
  
  // Using the corrected template structure
  const payload = {
    messaging_product: "whatsapp",
    to: "919999968191",
    type: "template",
    template: {
      name: "buggly_order_confirmation",
      language: {
        code: "en"
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: orderData.customerName },
            { type: "text", text: orderData.orderId },
            { type: "text", text: `₹${orderData.orderAmount}` },
            { type: "text", text: orderData.items }
          ]
        }
      ]
    }
  };

  console.log('🔧 Testing FIXED notification template...');
  console.log('Template: buggly_order_confirmation');
  console.log('Order Data:', JSON.stringify(orderData, null, 2));
  
  try {
    const response = await fetch(
      `${baseUrl}/${phoneNumberId}/messages`,
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
    
    console.log('\n📱 Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('\n✅ FIXED notification sent successfully!');
      console.log('🎉 The admin panel should now work correctly!');
    } else {
      console.log('\n❌ Still having issues...');
      if (responseData.error) {
        console.log(`Error: ${responseData.error.message}`);
      }
    }
    
  } catch (error) {
    console.error('\n💥 Error:', error.message);
  }
}

testFixedNotification();