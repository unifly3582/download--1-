// Simple script to check auto-approval settings using existing Firebase setup
require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');

// Initialize using environment variables (same as your Next.js app)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase initialized\n');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function checkSettings() {
  try {
    const settingsRef = db.collection('settings').doc('autoApproval');
    const settingsSnap = await settingsRef.get();
    
    if (!settingsSnap.exists) {
      console.log('❌ No auto-approval settings found!');
      console.log('   Location: settings/autoApproval');
      console.log('   You need to configure settings via the admin UI at /settings\n');
      return;
    }
    
    const settings = settingsSnap.data();
    
    console.log('✅ AUTO-APPROVAL SETTINGS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`Max Order Value:           ₹${settings.maxAutoApprovalValue || 0}`);
    console.log(`Min Customer Age:          ${settings.minCustomerAgeDays || 0} days`);
    console.log(`Allow New Customers:       ${settings.allowNewCustomers ? 'YES ✅' : 'NO ❌'}`);
    console.log(`Require Verified Dims:     ${settings.requireVerifiedDimensions ? 'YES ✅' : 'NO ❌'}`);
    console.log(`Learning Mode:             ${settings.enableLearningMode ? 'ENABLED ✅' : 'DISABLED ❌'}`);
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    
    console.log('📋 APPROVAL CRITERIA:\n');
    
    if (settings.maxAutoApprovalValue === 0) {
      console.log('⚠️  WARNING: Max approval value is ₹0');
      console.log('→ NO orders will be auto-approved!');
      console.log('→ All orders require manual approval\n');
    } else {
      console.log('An order WILL be auto-approved if ALL conditions are met:\n');
      console.log(`1. ✅ Order value ≤ ₹${settings.maxAutoApprovalValue}`);
      console.log('2. ✅ Customer exists in database');
      console.log('3. ✅ Customer is NOT flagged as dubious');
      
      if (settings.allowNewCustomers) {
        console.log('4. ✅ Customer can be NEW or RETURNING (any age)');
      } else {
        console.log(`4. ✅ Customer age > ${settings.minCustomerAgeDays} days (returning customers only)`);
      }
      
      if (settings.requireVerifiedDimensions) {
        console.log('5. ✅ Single item OR verified combination (partially implemented)');
      } else {
        console.log('5. ✅ Any item combination (dimensions not checked)');
      }
      
      console.log('\n═══════════════════════════════════════════════════════════════\n');
      
      console.log('💡 EXAMPLES:\n');
      
      const exampleValue = Math.min(500, settings.maxAutoApprovalValue);
      
      console.log(`Example 1: ₹${exampleValue} order, 60-day-old customer, not dubious`);
      console.log('→ ✅ AUTO-APPROVED\n');
      
      console.log(`Example 2: ₹${settings.maxAutoApprovalValue + 100} order, 60-day-old customer, not dubious`);
      console.log('→ ❌ REJECTED (exceeds max value)\n');
      
      if (!settings.allowNewCustomers) {
        console.log(`Example 3: ₹${exampleValue} order, 1-day-old customer, not dubious`);
        console.log('→ ❌ REJECTED (customer too new)\n');
      }
      
      console.log(`Example 4: ₹${exampleValue} order, 60-day-old customer, DUBIOUS flag`);
      console.log('→ ❌ REJECTED (dubious customer)\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSettings();
