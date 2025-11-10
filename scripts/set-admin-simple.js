#!/usr/bin/env node

/**
 * Simple script to set admin custom claims
 * This script uses a simpler approach with better error handling
 */

console.log('🚀 Starting admin claim script...');

const admin = require('firebase-admin');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Error: Email address is required');
    console.log('Usage: node scripts/set-admin-simple.js <email>');
    process.exit(1);
  }

  console.log(`📧 Setting admin claim for: ${email}`);

  // Check environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log('🔧 Environment check:');
  console.log(`- Project ID: ${projectId ? 'SET' : 'MISSING'}`);
  console.log(`- Client Email: ${clientEmail ? 'SET' : 'MISSING'}`);
  console.log(`- Private Key: ${privateKey ? 'SET (length: ' + privateKey.length + ')' : 'MISSING'}`);

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Missing Firebase credentials');
    process.exit(1);
  }

  try {
    // Initialize Firebase Admin SDK
    console.log('🔥 Initializing Firebase Admin...');
    
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }

    console.log('✅ Firebase Admin initialized');

    // Get user by email
    console.log(`🔍 Looking up user: ${email}`);
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`✅ Found user: ${userRecord.uid}`);

    // Set admin custom claim
    console.log('🔑 Setting admin claim...');
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    console.log('✅ Admin claim set successfully!');

    // Verify
    const updatedUser = await admin.auth().getUser(userRecord.uid);
    console.log('✅ Verification - Custom claims:', updatedUser.customClaims);

    console.log('\n🎉 Success! User is now an admin.');
    console.log('💡 The user needs to sign out and back in to refresh their token.');

  } catch (error) {
    console.error('❌ Error:', error.code || 'Unknown');
    console.error('Details:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 Make sure the user has signed up at least once.');
    }
    
    process.exit(1);
  }
}

main().catch(console.error);