// Test the complete admin order creation notification flow
require('dotenv').config({ path: '.env.local' });

// Simulate the exact notification service flow
async function testAdminOrderFlow() {
  console.log('🔄 Simulating Admin Panel Order Creation Flow...\n');
  
  // Step 1: Mock order data (as created from admin panel)
  const mockOrder = {
    orderId: "ORD_2025_ADMIN123",
    orderSource: "admin_form",
    customerInfo: {
      customerId: "CUST_456",
      name: "Admin Test Customer",
      phone: "+919999968191",
      email: "test@admin.com"
    },
    shippingAddress: {
      street: "123 Admin Street",
      city: "Mumbai", 
      state: "Maharashtra",
      zip: "400001",
      country: "India"
    },
    items: [
      {
        productId: "PROD_789",
        productName: "Premium Face Cream",
        quantity: 2,
        unitPrice: 899,
        sku: "PFC_001"
      },
      {
        productId: "PROD_790", 
        productName: "Vitamin C Serum",
        quantity: 1,
        unitPrice: 699,
        sku: "VCS_001"
      }
    ],
    pricingInfo: {
      subtotal: 2497,
      discount: 0,
      taxes: 0,
      shippingCharges: 0,
      grandTotal: 2497,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  console.log('📋 Order Data:', JSON.stringify(mockOrder, null, 2));

  // Step 2: Build notification data (same as in notifications.ts)
  const itemNames = mockOrder.items.map(item => item.productName).join(', ');
  const deliveryAddress = `${mockOrder.shippingAddress.street}, ${mockOrder.shippingAddress.city}, ${mockOrder.shippingAddress.state} ${mockOrder.shippingAddress.zip}`;
  
  const notificationData = {
    customerName: mockOrder.customerInfo.name,
    orderId: mockOrder.orderId,
    orderAmount: mockOrder.pricingInfo.grandTotal,
    items: itemNames,
    paymentMethod: mockOrder.paymentInfo.method,
    deliveryAddress: deliveryAddress
  };

  console.log('\n📨 Notification Data:', JSON.stringify(notificationData, null, 2));

  // Step 3: Format phone number (same as in service)
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
  console.log('\n📞 Phone Formatting:');
  console.log('Original:', mockOrder.customerInfo.phone);
  console.log('Formatted:', formattedPhone);

  // Step 4: Build WhatsApp payload (using your exact format)
  const payload = {
    "to": formattedPhone,
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
            {"type": "text", "text": notificationData.customerName},
            {"type": "text", "text": notificationData.orderId},
            {"type": "text", "text": `₹${notificationData.orderAmount.toLocaleString('en-IN')}`},
            {"type": "text", "text": notificationData.items}
          ]
        }
      ]
    }
  };

  console.log('\n📤 WhatsApp Payload:', JSON.stringify(payload, null, 2));

  // Step 5: Send the message
  const baseUrl = 'https://crm.marketingravan.com/api/meta/v19.0';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  try {
    console.log('\n🚀 Sending notification...');
    
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
    
    console.log('\n📱 WhatsApp API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Admin order notification sent!');
      console.log('🎉 The admin panel order creation should now work!');
      console.log(`📋 Queue ID: ${responseData.message?.queue_id}`);
    } else {
      console.log('\n❌ FAILED! Notification not sent');
      if (responseData.error) {
        console.log(`Error: ${responseData.error.message}`);
        console.log(`Code: ${responseData.error.code}`);
      }
    }
    
  } catch (error) {
    console.error('\n💥 Network Error:', error.message);
  }
}

testAdminOrderFlow();