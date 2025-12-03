/**
 * Test OTP sending to a specific phone number
 * Usage: node test-otp-send.js
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;

/**
 * Generate a random 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via WhatsApp using existing Meta Business API
 */
async function sendWhatsAppOTP(phone, otp) {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const baseUrl = 'https://crm.marketingravan.com/api/meta/v19.0';
    
    if (!accessToken || !phoneNumberId) {
      console.error('❌ WhatsApp credentials not configured');
      return false;
    }
    
    // Clean phone number (remove + and spaces)
    const cleanPhone = phone.replace(/[\s+\-()]/g, '');
    
    // Add country code if not present
    let formattedPhone = cleanPhone;
    if (cleanPhone.length === 10) {
      formattedPhone = '91' + cleanPhone; // India
    }
    
    console.log('📱 Formatted phone:', formattedPhone);
    
    // Build OTP template payload
    const payload = {
      to: formattedPhone,
      recipient_type: "individual",
      type: "template",
      template: {
        language: {
          policy: "deterministic",
          code: "en"
        },
        name: "otp", // Your approved OTP template name
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: otp // OTP code
              }
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: 0,
            parameters: [
              {
                type: "text",
                text: otp // OTP code for button URL parameter
              }
            ]
          }
        ]
      }
    };
    
    console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));
    
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
    
    if (!response.ok) {
      console.error('❌ WhatsApp API Error:', JSON.stringify(responseData, null, 2));
      return false;
    }
    
    console.log('✅ WhatsApp OTP sent successfully!');
    console.log('📨 Message ID:', responseData.messages?.[0]?.id);
    console.log('📋 Full response:', JSON.stringify(responseData, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send WhatsApp OTP:', error);
    return false;
  }
}

/**
 * Test OTP sending
 */
async function testOTPSend() {
  const testPhone = '9999968191';
  
  console.log('🧪 Testing OTP Send');
  console.log('==================');
  console.log('📱 Phone:', testPhone);
  console.log('');
  
  // Generate OTP
  const otp = generateOTP();
  console.log('🔢 Generated OTP:', otp);
  console.log('⏰ Valid for:', OTP_EXPIRY_MINUTES, 'minutes');
  console.log('');
  
  // Store OTP in Firestore
  const normalizedPhone = testPhone.replace(/[\s-]/g, '');
  const formattedPhone = normalizedPhone.length === 10 ? '91' + normalizedPhone : normalizedPhone;
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  
  console.log('💾 Storing OTP in Firestore...');
  await db.collection('otpVerifications').doc(formattedPhone).set({
    phone: formattedPhone,
    otp,
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    attempts: 0,
    verified: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('✅ OTP stored in Firestore');
  console.log('');
  
  // Send OTP via WhatsApp
  console.log('📲 Sending OTP via WhatsApp...');
  const sent = await sendWhatsAppOTP(testPhone, otp);
  
  if (sent) {
    console.log('');
    console.log('✅ SUCCESS! OTP sent to', testPhone);
    console.log('');
    console.log('📝 To verify, use:');
    console.log(`   Phone: ${formattedPhone}`);
    console.log(`   OTP: ${otp}`);
    console.log('');
    console.log('🧪 Test verification with:');
    console.log(`curl -X POST http://localhost:3000/api/customer/auth/verify-otp \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"phone": "${formattedPhone}", "otp": "${otp}"}'`);
  } else {
    console.log('');
    console.log('❌ FAILED to send OTP');
  }
}

// Run test
testOTPSend()
  .then(() => {
    console.log('');
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
