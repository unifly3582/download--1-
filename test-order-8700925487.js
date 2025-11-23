const axios = require('axios');

const API_BASE_URL = 'http://localhost:9006/api';
const PHONE = '+918700925487';

console.log('🔍 Testing Order Flow for Phone:', PHONE);
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('='.repeat(60));

async function testOrderFlow() {
  try {
    // STEP 1: Get Customer Profile
    console.log('\nSTEP 1: Fetching Customer Profile');
    console.log('='.repeat(60));
    
    const profileResponse = await axios.post(
      `${API_BASE_URL}/customer/profile`,
      {
        action: 'get',
        phone: PHONE
      }
    );
    
    console.log('✅ Customer Profile Response:');
    console.log(JSON.stringify(profileResponse.data, null, 2));
    
    const customerData = profileResponse.data.data;
    console.log('\n📋 Profile Summary:');
    console.log('Name:', customerData.name);
    console.log('Email:', customerData.email);
    console.log('Phone:', customerData.phone);
    console.log('CustomerId:', customerData.customerId);
    console.log('Saved Addresses:', customerData.savedAddresses?.length || 0);

    // STEP 2: Place Order
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: Placing Order');
    console.log('='.repeat(60));
    
    const orderData = {
      orderSource: 'customer_app',
      trafficSource: {
        source: 'direct',
        medium: 'test',
        campaign: 'test_8700925487',
        sessionId: `test_${Date.now()}`,
        landingPage: 'http://localhost:3000/checkout'
      },
      customerInfo: {
        customerId: customerData.customerId,
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email
      },
      shippingAddress: customerData.defaultAddress || {
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        zip: '110001',
        country: 'India'
      },
      items: [
        {
          productId: 'XVI6LqjLwws6UWKk7dI3',
          variationId: 'ODqHgBIzMDwF4VAdSAAn',
          quantity: 1,
          sku: 'BUGGLY_100GM_1KG'
        }
      ],
      paymentInfo: {
        method: 'COD'
      },
      pricingInfo: {
        taxes: 0,
        shippingCharges: 0,
        codCharges: 30,
        prepaidDiscount: 0
      }
    };

    console.log('\n📝 Order Data:');
    console.log(JSON.stringify(orderData, null, 2));
    
    console.log('\n🔍 Verifying customerInfo.customerId:');
    console.log('Type:', typeof orderData.customerInfo.customerId);
    console.log('Value:', JSON.stringify(orderData.customerInfo.customerId));
    console.log('Is undefined?:', orderData.customerInfo.customerId === undefined);
    
    console.log('\n🚀 Sending order request to: POST /customer/orders/create');
    
    const orderResponse = await axios.post(
      `${API_BASE_URL}/customer/orders/create`,
      orderData
    );
    
    console.log('\n✅ ORDER CREATED SUCCESSFULLY!');
    console.log(JSON.stringify(orderResponse.data, null, 2));
    console.log('\n🎉 Order ID:', orderResponse.data.orderId);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log('Customer Profile: ✅ Found');
    console.log('Order Placement: ✅ Success');
    console.log('\n✨ SUCCESS! This phone number works!');
    
  } catch (error) {
    console.error('\n❌ ERROR OCCURRED!');
    console.error('='.repeat(60));
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received');
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('\n📊 Error Details:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
}

testOrderFlow();
