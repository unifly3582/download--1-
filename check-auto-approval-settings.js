// Check Auto-Approval Settings from Firebase
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "buggly-adminpanel",
      clientEmail: "firebase-adminsdk-fbsvc@buggly-adminpanel.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCvkOIe6riSJWrA\njuYjY0IZboaoyBJlocpJdsltL8qNSm1YxFJIzRejSPL68KFkr5HijsJA5edd3oP8\nd8dl8XFnMsc9QDp2gCcaUiBk59v6Snz6MK8cZdpsBEM2rCd5S30MJN14XsYBVkM9\n1bwgR6bioFNwBeSuVeWCZSPwrktEaRA41RE0og2aVxqQfPujq0Csr0kLZLCs9fq0\nMcZ7xS/OUEcuxPrAWuufNDOzJmQc1N3/VSutHRWoma4hgAsw+YjPrv4/F02WxW+4\nRxRyZ2cLIWOU7hCHQDdNyDhki8f+bJxLQdEkgL8wDoNye1eW1bmgJ8ovSbAYqzqW\nT6LpObLjAgMBAAECggEABO1nYJVsh12EI3y0j3sHreMLkHfHsbvatjkelMaUmWaP\nWcBuIXDwIDsPPA++LS89mZgxciosViwalDQLD/IOIWasGiylTLzIBtXAkanC42wX\nxIXSmaoaI+dIDk7CmjA42uW7TteKGHDYA5zuDLyLaII2FUd1EEIvkNCkiOq7Xg4b\nj+xjiZw2OAJfm7Y1sCy7AsrXnoa7ZOhZQuZ2yZuUI0uDPyI/k5kIEYvabDHFrkIR\n+iscG38LwVu7TTDOf8mufahYL/LriH0RPxd38w2WNHp2falXCoWeRvE2rK9w1X6r\nj69fuouLlnf5ZUrxo/iT2xJjWpEmQVfrxWP5MWyWsQKBgQDgMYT/4ivc2OiIGolR\nU3OqncU/uUWIHEaJYFrNcM1OF9gsRMqDprL+Rj2VqS/u3wqXG/8D5AJcZluH13J8\nLkkEibRVoPOf6R2n1ESr/mnjXwfuUmXAiakNnBFI/0Uq5RbyTJjff4yKhnOwltYR\noqQNyFuukRjTDGxfoTKS0hENFwKBgQDIeUMnCNLQ4CekopuZ1iTFWnalA0vkmi93\nL1Hd2KBrMdUAqHK2H8m/heIdnV/htJes0/fYXj0Q+q6zkZOt6zBud7CLEg/k4FOR\nH8H2KM3syoiTNn5hFSjSBmhODXupfrow82UysxDbxTk6+XnPzRmp2bY+X31Maq2s\neV70D01gFQKBgQDbF8mv/yl6ZAeqqrQzY+iPfit7gOWwhGFyc1WJm4knninF6Vw3\nmDsoPyCEF5keSZ4h2lw3QyYDgoxEjon1TY5R/vjbDbXIOpqentSVeMWmTAKGJsQF\niwJIqJJD0iOYLdVk6PIkyJNh9M8ubdm51kWYqoreaDHoXiWytuejj+LV9QKBgCmY\nb4SD4ioQuGkCjEKJGiwQrxlh67dM/pg+K0BamD5loop2aQa85cFlaBs48hIExIvJ\nl10/gHArc2Ayzm+BoxTopKrWXpHgsbYk3rvSj5eYFmplHifKmiOpzK6VQZlTgBJ0\nDgVM/ix7aXqBFPM23SJO1+9tJLRcVhi5PihpnGZZAoGBAM9JLBVXvKpkd+GJublZ\nYEpUrgPpFRTMvWqTmEjp3DUOU19aW1nO2+U45z9PsjqRSG9O+EkFIhMMo2t90gT+\nsnmZhxWDP0POQL/Wlh/4ru+H3PjXEqtg/vjyJ29DKuKWsexf9GlG086JAG54aLPC\nomWfQhgsmRrhGc2QOoUL3wcv\n-----END PRIVATE KEY-----\n"
    })
  });
}

const db = admin.firestore();

async function checkAutoApprovalSettings() {
  try {
    console.log('🔍 Checking Auto-Approval Settings...\n');
    
    // Fetch the auto-approval settings document
    const settingsRef = db.collection('settings').doc('autoApproval');
    const settingsDoc = await settingsRef.get();
    
    if (!settingsDoc.exists) {
      console.log('❌ AUTO-APPROVAL SETTINGS NOT FOUND');
      console.log('The settings/autoApproval document does not exist in your database.');
      console.log('\n📝 This means auto-approval is NOT configured yet.');
      console.log('\n💡 To enable auto-approval, you need to create settings with:');
      console.log('   - maxAutoApprovalValue: Maximum order value (e.g., 5000)');
      console.log('   - minCustomerAgeDays: Minimum customer age in days (e.g., 30)');
      console.log('   - allowNewCustomers: true/false');
      console.log('   - requireVerifiedDimensions: true/false');
      console.log('   - enableLearningMode: true/false');
      return;
    }
    
    const settings = settingsDoc.data();
    
    console.log('✅ AUTO-APPROVAL SETTINGS FOUND\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 CURRENT AUTO-APPROVAL CONFIGURATION:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('💰 Max Auto-Approval Value:');
    console.log(`   ₹${settings.maxAutoApprovalValue || 'NOT SET'}`);
    console.log(`   → Orders above this amount require manual approval\n`);
    
    console.log('📅 Minimum Customer Age:');
    console.log(`   ${settings.minCustomerAgeDays || 'NOT SET'} days`);
    console.log(`   → Customers must be this old to get auto-approved\n`);
    
    console.log('🆕 Allow New Customers:');
    console.log(`   ${settings.allowNewCustomers ? '✅ YES' : '❌ NO'}`);
    console.log(`   → First-time customers ${settings.allowNewCustomers ? 'CAN' : 'CANNOT'} be auto-approved\n`);
    
    console.log('📦 Require Verified Dimensions:');
    console.log(`   ${settings.requireVerifiedDimensions ? '✅ YES' : '❌ NO'}`);
    console.log(`   → Multi-item orders ${settings.requireVerifiedDimensions ? 'NEED' : 'DO NOT NEED'} verified combinations\n`);
    
    console.log('🧠 Learning Mode:');
    console.log(`   ${settings.enableLearningMode ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log(`   → System ${settings.enableLearningMode ? 'IS' : 'IS NOT'} learning from approvals\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n📋 SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Provide interpretation
    if (settings.maxAutoApprovalValue === 0) {
      console.log('⚠️  WARNING: Max auto-approval value is 0');
      console.log('   → NO orders will be auto-approved (all require manual approval)');
    } else if (settings.maxAutoApprovalValue > 0) {
      console.log(`✅ Orders up to ₹${settings.maxAutoApprovalValue} can be auto-approved`);
    }
    
    if (!settings.allowNewCustomers && settings.minCustomerAgeDays > 0) {
      console.log(`✅ Only returning customers (${settings.minCustomerAgeDays}+ days old) get auto-approved`);
    } else if (settings.allowNewCustomers) {
      console.log('✅ New customers can be auto-approved');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n🔧 RAW DATA:');
    console.log(JSON.stringify(settings, null, 2));
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkAutoApprovalSettings();
