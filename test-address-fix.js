// Test the new address management system
require('dotenv').config({ path: '.env.local' });

async function testNewAddressSystem() {
  console.log('🧪 Testing New Address Management System...\n');

  const testPhone = '+919999999997'; // Use different phone for testing

  // Test 1: Create order - should only set default address, NOT add to savedAddresses
  const orderPayload = {
    orderSource: 'admin_form',
    customerInfo: {
      name: 'Test Customer New System',
      phone: testPhone,
      email: 'test@newaddress.com'
    },
    shippingAddress: {
      street: '123 Main Street, Apt 1A',
      city: 'Mumbai',
      state: 'Maharashtra',
      zip: '400001',
      country: 'India'
    },
    items: [
      {
        productId: 'TEST_PROD',
        productName: 'Test Product',
        quantity: 1,
        unitPrice: 999,
        sku: 'TEST_SKU'
      }
    ],
    paymentInfo: {
      method: 'COD'
    },
    manualPricingInfo: {
      subtotal: 999,
      discount: 0,
      taxes: 0,
      shippingCharges: 0,
      grandTotal: 999,
      codCharges: 25
    }
  };

  console.log('📋 Test 1 - Creating Order:');
  console.log('Customer:', orderPayload.customerInfo.phone);
  console.log('Shipping Address:', orderPayload.shippingAddress);

  try {
    // Create order
    console.log('\n🚀 Creating order...');
    const orderResponse = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-admin-token-here' // Replace with actual token
      },
      body: JSON.stringify(orderPayload)
    });

    const orderResult = await orderResponse.json();
    console.log('Order Status:', orderResponse.status);
    console.log('Order Result:', orderResult.success ? `✅ ${orderResult.orderId}` : `❌ ${orderResult.error}`);

    if (!orderResponse.ok) {
      console.log('❌ Order creation failed, stopping test');
      return;
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Check customer addresses after order creation
    console.log('\n🔍 Checking customer addresses after order creation...');
    const addressResponse = await fetch(`http://localhost:3000/api/customers/${encodeURIComponent(testPhone)}/addresses`, {
      headers: {
        'Authorization': 'Bearer your-admin-token-here' // Replace with actual token
      }
    });

    if (addressResponse.ok) {
      const addressData = await addressResponse.json();
      console.log('\n📊 Address Data After Order:');
      console.log('Default Address:', addressData.data.defaultAddress);
      console.log('Saved Addresses Count:', addressData.data.totalAddresses);
      console.log('Saved Addresses:', addressData.data.savedAddresses);

      if (addressData.data.totalAddresses === 0) {
        console.log('✅ SUCCESS: No automatic address added to savedAddresses!');
      } else {
        console.log('❌ ISSUE: Address was automatically added to savedAddresses');
      }
    }

    // Test 3: Explicitly add address to address book
    console.log('\n🚀 Test 3 - Explicitly adding address to address book...');
    const addAddressPayload = {
      action: 'add',
      address: {
        street: '456 Second Street, Apt 2B',
        city: 'Delhi',
        state: 'Delhi',
        zip: '110001',
        country: 'India'
      },
      setAsDefault: false
    };

    const addResponse = await fetch(`http://localhost:3000/api/customers/${encodeURIComponent(testPhone)}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-admin-token-here' // Replace with actual token
      },
      body: JSON.stringify(addAddressPayload)
    });

    const addResult = await addResponse.json();
    console.log('Add Address Result:', addResult.success ? `✅ ${addResult.message}` : `❌ ${addResult.error}`);

    // Test 4: Check addresses after explicit addition
    if (addResponse.ok) {
      console.log('\n🔍 Checking addresses after explicit addition...');
      const finalAddressResponse = await fetch(`http://localhost:3000/api/customers/${encodeURIComponent(testPhone)}/addresses`, {
        headers: {
          'Authorization': 'Bearer your-admin-token-here' // Replace with actual token
        }
      });

      if (finalAddressResponse.ok) {
        const finalAddressData = await finalAddressResponse.json();
        console.log('\n📊 Final Address Data:');
        console.log('Default Address:', finalAddressData.data.defaultAddress);
        console.log('Saved Addresses Count:', finalAddressData.data.totalAddresses);
        console.log('Saved Addresses:', finalAddressData.data.savedAddresses);

        if (finalAddressData.data.totalAddresses === 1) {
          console.log('✅ SUCCESS: Only explicitly added address is in savedAddresses!');
        } else {
          console.log('❌ ISSUE: Unexpected number of saved addresses');
        }
      }
    }

    // Test 5: Try to add duplicate address (should fail)
    console.log('\n🚀 Test 5 - Trying to add duplicate address (should fail)...');
    const duplicateResponse = await fetch(`http://localhost:3000/api/customers/${encodeURIComponent(testPhone)}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-admin-token-here' // Replace with actual token
      },
      body: JSON.stringify(addAddressPayload) // Same payload as before
    });

    const duplicateResult = await duplicateResponse.json();
    console.log('Duplicate Address Result:', duplicateResult.success ? `❌ Unexpected success` : `✅ Correctly rejected: ${duplicateResult.error}`);

    console.log('\n🎉 Address Management System Test Complete!');
    console.log('\nExpected Behavior Summary:');
    console.log('✅ Orders only set defaultAddress, do not auto-add to savedAddresses');
    console.log('✅ Addresses must be explicitly added to address book');
    console.log('✅ Duplicate addresses are prevented');
    console.log('✅ Users have full control over their address book');

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
  }
}

console.log('⚠️  NOTE: This test requires:');
console.log('⚠️  1. Next.js server running (npm run dev)');
console.log('⚠️  2. Valid admin authentication token');
console.log('⚠️  3. Replace "your-admin-token-here" with actual token\n');

// Uncomment to run the test (requires server running and auth token)
testNewAddressSystem();