const https = require('https');
require('dotenv').config({ path: '.env.local' });

async function testCustomerAPI(phone) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing Customer API for: ${phone}`);
  console.log('='.repeat(80));

  const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
  
  // You'll need to replace this with your actual admin token
  // For now, let's just test the endpoint structure
  
  const url = `http://localhost:3000/api/customers/${encodeURIComponent(formattedPhone)}`;
  
  console.log(`\nAPI URL: ${url}`);
  console.log(`\nNote: This test requires the Next.js dev server to be running`);
  console.log(`and you need to be authenticated as an admin.`);
  console.log(`\nTo test manually:`);
  console.log(`1. Open your browser`);
  console.log(`2. Login to the admin dashboard`);
  console.log(`3. Open browser console`);
  console.log(`4. Run this:`);
  console.log(`\nfetch('/api/customers/${encodeURIComponent(formattedPhone)}')`);
  console.log(`  .then(r => r.json())`);
  console.log(`  .then(data => console.log(JSON.stringify(data, null, 2)))`);
}

const phoneNumbers = [
  '9819080113',
  '9680790855',
  '9999968191'
];

console.log('\n📋 CUSTOMER API TEST INSTRUCTIONS');
console.log('='.repeat(80));

phoneNumbers.forEach(phone => {
  testCustomerAPI(phone);
});

console.log(`\n${'='.repeat(80)}`);
console.log('Test instructions complete');
console.log('='.repeat(80));
