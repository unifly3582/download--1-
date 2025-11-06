// Test order notification flow
require('dotenv').config({ path: '.env.local' });

// Mock order data similar to what's created from admin panel
const mockOrder = {
  orderId: "ORD_2025_TEST123",
  orderSource: "admin_form",
  customerInfo: {
    customerId: "CUST_123",
    name: "Test Customer",
    phone: "+919876543210",
    email: "test@example.com"
  },
  shippingAddress: {
    street: "123 Test Street",
    city: "Mumbai",
    state: "Maharashtra",
    zip: "400001",
    country: "India"
  },
  items: [
    {
      productId: "PROD_123",
      productName: "Test Product",
      quantity: 1,
      unitPrice: 999,
      sku: "TEST_SKU"
    }
  ],
  pricingInfo: {
    subtotal: 999,
    discount: 0,
    taxes: 0,
    shippingCharges: 0,
    grandTotal: 999,
    codCharges: 0
  },
  paymentInfo: {
    method: "COD",
    status: "Pending"
  },
  approval: {
    status: "pending"
  },
  shipmentInfo: {},
  internalStatus: "created_pending",
  weight: 0.5,
  dimensions: { l: 10, b: 10, h: 5 },
  needsManualWeightAndDimensions: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Test the notification logic
async function testOrderNotification() {
  console.log('=== Order Notification Test ===');
  console.log('Mock Order:', JSON.stringify(mockOrder, null, 2));
  
  try {
    // Test phone formatting
    function formatPhoneForWhatsApp(phone) {
      let cleaned = phone.replace(/\D/g, '');
      if (cleaned.startsWith('0')) {
        cleaned = '91' + cleaned.substring(1);
      }
      if (!cleaned.startsWith('91') && cleaned.length === 10) {
        cleaned = '91' + cleaned;
      }
      return cleaned;
    }
    
    const formattedPhone = formatPhoneForWhatsApp(mockOrder.customerInfo.phone);
    console.log('\n=== Phone Formatting ===');
    console.log('Original:', mockOrder.customerInfo.phone);
    console.log('Formatted:', formattedPhone);
    
    // Test notification data building
    const itemNames = mockOrder.items.map(item => item.productName).join(', ');
    const deliveryAddress = `${mockOrder.shippingAddress.street}, ${mockOrder.shippingAddress.city}, ${mockOrder.shippingAddress.state} ${mockOrder.shippingAddress.zip}`;
    
    const notificationData = {
      customerName: mockOrder.customerInfo.name,
      orderId: mockOrder.orderId,
      orderAmount: mockOrder.pricingInfo.grandTotal,
      items: itemNames,
      paymentMethod: mockOrder.paymentInfo.method,
      deliveryAddress: deliveryAddress,
      awbNumber: mockOrder.shipmentInfo.awb,
      trackingUrl: mockOrder.shipmentInfo.trackingUrl,
      courierPartner: mockOrder.shipmentInfo.courierPartner,
      expectedDeliveryDate: undefined,
      currentLocation: mockOrder.shipmentInfo.trackingLocation
    };
    
    console.log('\n=== Notification Data ===');
    console.log(JSON.stringify(notificationData, null, 2));
    
    // Test template building
    const template = {
      name: "buggly_order_placed",
      language: "en",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: notificationData.customerName },
            { type: "text", text: notificationData.orderId },
            { type: "text", text: `₹${notificationData.orderAmount}` },
            { type: "text", text: notificationData.paymentMethod || "COD" },
            { type: "text", text: notificationData.items },
            { type: "text", text: notificationData.deliveryAddress || "Address" }
          ]
        }
      ]
    };
    
    console.log('\n=== WhatsApp Template ===');
    console.log(JSON.stringify(template, null, 2));
    
    // Test actual sending
    const baseUrl = 'https://crm.marketingravan.com/api/meta/v19.0';
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: template
    };
    
    console.log('\n=== Sending WhatsApp Message ===');
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
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('✅ Order notification sent successfully!');
    } else {
      console.log('❌ Order notification failed');
      console.log('Error:', responseData.error?.message || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testOrderNotification();