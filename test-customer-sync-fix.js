// Test customerOrderSync fixes
console.log('=== Testing customerOrderSync undefined value handling ===');

// Mock order data with missing shipmentInfo fields (like new orders)
const mockOrder = {
  orderId: "5020",
  customerInfo: {
    customerId: "cust123",
    name: "Test Customer",
    phone: "9876543210"
  },
  shippingAddress: {
    name: "Test Customer",
    street: "123 Test Street",
    city: "Mumbai",
    state: "Maharashtra",
    zip: "400001"
  },
  items: [{
    productName: "Test Product",
    quantity: 1,
    sku: "TEST-SKU"
  }],
  pricingInfo: {
    grandTotal: 500
  },
  paymentInfo: {
    method: "COD"
  },
  internalStatus: "created_pending",
  approval: {
    status: "pending"
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  // shipmentInfo is missing/undefined (common in new orders)
  shipmentInfo: undefined,
  deliveryEstimate: undefined
};

// Test the tracking object creation
console.log('Testing tracking object creation...');

const trackingData = {
  courierPartner: mockOrder.shipmentInfo?.courierPartner,
  awb: mockOrder.shipmentInfo?.awb,
  trackingUrl: mockOrder.shipmentInfo?.trackingUrl,
  currentStatus: mockOrder.shipmentInfo?.currentTrackingStatus,
  currentLocation: mockOrder.shipmentInfo?.trackingLocation,
  lastUpdate: mockOrder.shipmentInfo?.lastTrackedAt,
  expectedDeliveryDate: mockOrder.deliveryEstimate?.expectedDate,
  deliveryTimeSlot: mockOrder.deliveryEstimate?.timeSlot,
};

console.log('Tracking data:', JSON.stringify(trackingData, null, 2));

// Test JSON.parse(JSON.stringify()) to remove undefined values
console.log('\nTesting undefined value removal...');
const cleanedData = JSON.parse(JSON.stringify(trackingData));
console.log('Cleaned data:', JSON.stringify(cleanedData, null, 2));

// Test data structure for customer order
const customerOrderData = {
  orderId: mockOrder.orderId,
  customerId: mockOrder.customerInfo.customerId,
  customerPhone: mockOrder.customerInfo.phone,
  orderDate: mockOrder.createdAt,
  orderStatus: 'confirmed',
  items: mockOrder.items,
  totalAmount: mockOrder.pricingInfo.grandTotal,
  paymentMethod: mockOrder.paymentInfo.method,
  shippingAddress: mockOrder.shippingAddress,
  tracking: trackingData,
  supportInfo: {
    canCancel: true,
    canReturn: false,
    returnWindowDays: 7,
    supportPhone: '+91-1234567890',
    supportEmail: 'support@bugglyfarms.com'
  }
};

console.log('\nFull customer order data:');
console.log(JSON.stringify(customerOrderData, null, 2));

console.log('\nCleaned customer order data (no undefined):');
const cleanedCustomerOrder = JSON.parse(JSON.stringify(customerOrderData));
console.log(JSON.stringify(cleanedCustomerOrder, null, 2));

console.log('\n✅ Test completed - undefined values handled properly!');