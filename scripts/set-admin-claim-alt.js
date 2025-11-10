#!/usr/bin/env node

/**
 * Alternative script to set admin custom claims using Firebase CLI
 * This script creates a temporary JSON file and uses it to set admin claims
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

/**
 * Create a temporary service account file
 */
function createTempServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase credentials in environment variables');
  }

  const serviceAccount = {
    "type": "service_account",
    "project_id": projectId,
    "private_key_id": "key-id",
    "private_key": privateKey.replace(/\\n/g, '\n'),
    "client_email": clientEmail,
    "client_id": "",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`
  };

  const tempPath = path.join(__dirname, '..', 'temp-service-account.json');
  fs.writeFileSync(tempPath, JSON.stringify(serviceAccount, null, 2));
  return tempPath;
}

/**
 * Initialize Firebase Admin SDK with service account file
 */
function initializeFirebaseAdmin(serviceAccountPath) {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
}

/**
 * Set admin custom claim for a user by email
 */
async function setAdminClaim(email) {
  let tempPath = null;
  
  try {
    console.log(`🔍 Looking up user with email: ${email}`);
    
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`✅ Found user: ${userRecord.uid} (${userRecord.email})`);
    
    // Check current custom claims
    const currentClaims = userRecord.customClaims || {};
    console.log('📋 Current custom claims:', currentClaims);
    
    // Set admin custom claim
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      ...currentClaims,
      admin: true
    });
    
    console.log(`🎉 Successfully set admin claim for ${email}`);
    console.log(`🔑 User ${userRecord.uid} now has admin privileges`);
    
    // Verify the claim was set
    const updatedUser = await admin.auth().getUser(userRecord.uid);
    console.log('✅ Updated custom claims:', updatedUser.customClaims);
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ Error: User with email ${email} not found.`);
      console.error('💡 Make sure the user has signed up to your app at least once.');
    } else {
      console.error('❌ Error setting admin claim:', error.message);
    }
    throw error;
  } finally {
    // Clean up temp file
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

/**
 * Main function
 */
async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Error: Email address is required');
    console.log('Usage: node scripts/set-admin-claim-alt.js <email>');
    console.log('Example: node scripts/set-admin-claim-alt.js vaibhav@gmail.com');
    process.exit(1);
  }
  
  let tempPath = null;
  
  try {
    console.log('🚀 Creating temporary service account file...');
    tempPath = createTempServiceAccount();
    
    console.log('🚀 Initializing Firebase Admin SDK...');
    initializeFirebaseAdmin(tempPath);
    console.log('✅ Firebase Admin SDK initialized successfully');
    
    await setAdminClaim(email);
    
    console.log('\n🎯 Next steps:');
    console.log('1. The user needs to sign out and sign back in to refresh their token');
    console.log('2. Or wait for the token to refresh automatically (up to 1 hour)');
    console.log('3. The user should then have admin access to protected routes');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up temp file
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
      console.log('🧹 Cleaned up temporary files');
    }
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { setAdminClaim };