#!/usr/bin/env node

/**
 * Script to set admin custom claims for Firebase users
 * Usage: node scripts/set-admin-claim.js <email>
 * Example: node scripts/set-admin-claim.js vaibhav@gmail.com
 */

const admin = require('firebase-admin');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
    
    throw new Error(
      `Missing required Firebase environment variables: ${missing.join(', ')}. ` +
      `Please ensure these are set in your .env.local file.`
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

/**
 * Set admin custom claim for a user by email
 * @param {string} email - User's email address
 */
async function setAdminClaim(email) {
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
  }
}

/**
 * Main function
 */
async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Error: Email address is required');
    console.log('Usage: node scripts/set-admin-claim.js <email>');
    console.log('Example: node scripts/set-admin-claim.js vaibhav@gmail.com');
    process.exit(1);
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Error: Invalid email format');
    process.exit(1);
  }
  
  try {
    console.log('🚀 Initializing Firebase Admin SDK...');
    initializeFirebaseAdmin();
    console.log('✅ Firebase Admin SDK initialized successfully');
    
    await setAdminClaim(email);
    
    console.log('\n🎯 Next steps:');
    console.log('1. The user needs to sign out and sign back in to refresh their token');
    console.log('2. Or wait for the token to refresh automatically (up to 1 hour)');
    console.log('3. The user should then have admin access to protected routes');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { setAdminClaim };