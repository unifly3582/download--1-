/**
 * Test Order Creation for Existing Customer
 * Simulates the exact flow when an existing customer places an order
 */

const admin = require('firebase-admin');
const serviceAccount = require('./temp-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Test with the failing phone number
const TEST_PHONE = '8700925487';

async function testExistingCustomerOrder() {
  console.log('=== Testing Existing Customer Order Creation ===\n');
  
  try {
    // Step 1: Get existing customer data
    console.log('Step 1: Fetching existing customer...');
    const customerSnapshot = await db.collection('customers')
      .where('phone', '==', TEST_PHONE)
      .limit(1)
      .get();
    
    if (customerSnapshot.empty) {
      console.log('❌ Customer not found. Testing with phone:', TEST_PHONE);
      console.log('   Try with a different phone number that exists in your system');
      return;
    }
    
    const existingCustomer = customerSnapshot.docs[0].data();
    console.log('✅ Found existing customer:');
    console.log('   Customer ID:', existingCustomer.customerId);
    console.log('   Name:', existingCustomer.name);
    console.log('   Phone:', existingCustomer.phone);
    console.log('   Email:', existingCustomer.email);
    console.log('   Default Address:', JSON.stringify(existingCustomer.defaultAddress, null, 2));
    console.log('   Saved Addresses:', existingCustomer.savedAddresses?.length || 0);
    
    // Step 2: Simulate order creation data (what comes from frontend)
    console.log('\nStep 2: Simulating order creation data...');
    const orderData = {
      customerInfo: {
        name: existingCustomer.name,
        phone: TEST_PHONE, // Without +91 prefix (as it might come from frontend)
        email: existingCustomer.email
      },
      shippingAddress: {
        street: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400001',
        country: 'India'
        // Note: No 'label' field
      },
      items: [
        {
          productId: 'test-product',
          sku: 'TEST-SKU',
          quantity: 1
        }
      ],
      paymentInfo: {
        method: 'COD'
      }
    };
    
    console.log('Order Data:');
    console.log('   Customer Info:', JSON.stringify(orderData.customerInfo, null, 2));
    console.log('   Shipping Address:', JSON.stringify(orderData.shippingAddress, null, 2));
    
    // Step 3: Check for potential issues
    console.log('\nStep 3: Checking for potential issues...');
    
    // Issue 1: Phone format mismatch
    const phoneMatch = existingCustomer.phone === TEST_PHONE || 
                      existingCustomer.phone === `+91${TEST_PHONE}`;
    console.log(`   Phone format match: ${phoneMatch ? '✅' : '❌'}`);
    console.log(`     Existing: ${existingCustomer.phone}`);
    console.log(`     Incoming: ${TEST_PHONE}`);
    
    // Issue 2: Address structure mismatch
    const existingAddressHasLabel = existingCustomer.defaultAddress?.label !== undefined;
    const newAddressHasLabel = orderData.shippingAddress.label !== undefined;
    console.log(`   Address structure:`);
    console.log(`     Existing has 'label': ${existingAddressHasLabel ? '✅' : '❌'}`);
    console.log(`     New has 'label': ${newAddressHasLabel ? '✅' : '❌'}`);
    
    if (existingAddressHasLabel && !newAddressHasLabel) {
      console.log('   ⚠️  POTENTIAL ISSUE: Existing address has label, new one doesn't');
    }
    
    // Issue 3: Check for extra fields in existing customer
    console.log(`\n   Existing customer fields:`);
    const customerFields = Object.keys(existingCustomer);
    customerFields.forEach(field => {
      const value = existingCustomer[field];
      const type = typeof value;
      const isArray = Array.isArray(value);
      const isObject = type === 'object' && !isArray && value !== null;
      
      console.log(`     - ${field}: ${isArray ? `Array(${value.length})` : isObject ? 'Object' : type}`);
    });
    
    // Step 4: Test the update data structure
    console.log('\nStep 4: Testing update data structure...');
    const normalizedPhone = TEST_PHONE.startsWith('+91') ? TEST_PHONE : `+91${TEST_PHONE}`;
    
    const updateData = {
      ...orderData.customerInfo,
      phone: normalizedPhone,
      customerId: existingCustomer.customerId,
      defaultAddress: orderData.shippingAddress
    };
    
    console.log('Update data that would be sent:');
    console.log(JSON.stringify(updateData, null, 2));
    
    // Step 5: Check if update would cause issues
    console.log('\nStep 5: Potential issues summary...');
    
    const issues = [];
    
    if (!phoneMatch) {
      issues.push('Phone format mismatch between existing and incoming data');
    }
    
    if (existingAddressHasLabel && !newAddressHasLabel) {
      issues.push('Address structure mismatch: existing has label field, new one doesn\'t');
    }
    
    // Check for undefined fields
    const hasUndefinedFields = Object.values(updateData).some(v => v === undefined);
    if (hasUndefinedFields) {
      issues.push('Update data contains undefined fields');
    }
    
    if (issues.length === 0) {
      console.log('✅ No obvious issues detected');
      console.log('   The problem might be elsewhere in the flow');
    } else {
      console.log('❌ Found potential issues:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    // Step 6: Recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    console.log('1. Ensure phone normalization happens before customer lookup');
    console.log('2. Strip or preserve the "label" field consistently');
    console.log('3. Only update fields that are explicitly provided');
    console.log('4. Add more detailed logging in createOrUpdateCustomer');
    console.log('5. Check Hostinger logs for the exact error message');
    
    console.log('\n=== NEXT STEPS ===');
    console.log('Run this to see actual server logs:');
    console.log(`   grep "${TEST_PHONE}" /path/to/logs/error.log`);
    console.log('Or check PM2 logs:');
    console.log('   pm2 logs | grep "CUSTOMER_ORDER"');
    
  } catch (error) {
    console.error('\n❌ Error during test:', error);
    console.error('Stack:', error.stack);
  }
}

testExistingCustomerOrder()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
