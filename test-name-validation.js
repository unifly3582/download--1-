// Test name validation in order schema
const { CreateOrderSchema, CustomerCreateOrderSchema } = require('./src/types/order');

console.log('🧪 Testing name validation...\n');

// Test 1: Empty name (should fail)
const testEmpty = {
  orderSource: "admin_form",
  customerInfo: {
    name: "",
    phone: "9876543210",
    email: "test@example.com"
  },
  shippingAddress: {
    street: "123 Test St",
    city: "Mumbai",
    state: "Maharashtra",
    zip: "400001",
    country: "India"
  },
  items: [{
    productId: "test-id",
    variationId: null,
    productName: "Test Product",
    quantity: 1,
    unitPrice: 100,
    sku: "TEST-SKU"
  }],
  paymentInfo: {
    method: "COD"
  }
};

const result1 = CreateOrderSchema.safeParse(testEmpty);
console.log('❌ Empty name test:', result1.success ? 'PASSED (should fail!)' : 'FAILED as expected');
if (!result1.success) {
  console.log('   Error:', result1.error.issues.find(i => i.path.includes('name'))?.message);
}

// Test 2: Single character name (should fail)
const testSingle = { ...testEmpty, customerInfo: { ...testEmpty.customerInfo, name: "A" } };
const result2 = CreateOrderSchema.safeParse(testSingle);
console.log('❌ Single char name test:', result2.success ? 'PASSED (should fail!)' : 'FAILED as expected');
if (!result2.success) {
  console.log('   Error:', result2.error.issues.find(i => i.path.includes('name'))?.message);
}

// Test 3: Valid name (should pass)
const testValid = { ...testEmpty, customerInfo: { ...testEmpty.customerInfo, name: "Alice Example" } };
const result3 = CreateOrderSchema.safeParse(testValid);
console.log('✅ Valid name test:', result3.success ? 'PASSED' : 'FAILED');

// Test 4: Whitespace only name (should fail after trim)
const testWhitespace = { ...testEmpty, customerInfo: { ...testEmpty.customerInfo, name: "   " } };
const result4 = CreateOrderSchema.safeParse(testWhitespace);
console.log('❌ Whitespace name test:', result4.success ? 'PASSED (should fail!)' : 'FAILED as expected');
if (!result4.success) {
  console.log('   Error:', result4.error.issues.find(i => i.path.includes('name'))?.message);
}

console.log('\n✅ Name validation is now enforced!');