// Test WhatsApp configuration
require('dotenv').config({ path: '.env.local' });

console.log('=== WhatsApp Configuration Test ===');

const requiredVars = [
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID', 
  'WHATSAPP_BUSINESS_ACCOUNT_ID'
];

let allConfigured = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allConfigured = false;
  }
});

console.log('\n=== Configuration Status ===');
if (allConfigured) {
  console.log('✅ All WhatsApp environment variables are configured');
} else {
  console.log('❌ Some WhatsApp environment variables are missing');
}

// Test phone number formatting
const testPhone = '+919876543210';
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

console.log('\n=== Phone Formatting Test ===');
console.log(`Input: ${testPhone}`);
console.log(`Formatted: ${formatPhoneForWhatsApp(testPhone)}`);