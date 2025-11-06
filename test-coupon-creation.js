// Simple test to debug coupon creation
// Run this in browser console on the coupons page

const testCouponData = {
  code: 'TEST123',
  type: 'percentage',
  value: 10,
  usageType: 'multi_use',
  maxUsageCount: 100,
  applicableUsers: 'all',
  minimumOrderValue: 500,
  validFrom: new Date().toISOString(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  description: 'Test coupon',
  isActive: true
};

console.log('Test coupon data:', testCouponData);

fetch('/api/admin/coupons', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('authToken') // Adjust based on your auth
  },
  body: JSON.stringify(testCouponData)
})
.then(response => response.json())
.then(data => {
  console.log('Response:', data);
})
.catch(error => {
  console.error('Error:', error);
});