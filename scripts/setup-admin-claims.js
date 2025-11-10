#!/usr/bin/env node

/**
 * Script to properly set admin custom claims now that Firebase credentials are working
 */

const admin = require('firebase-admin');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function setAdminClaims() {
  console.log('🚀 Setting up admin claims with working Firebase credentials...');
  
  try {
    // Initialize Firebase Admin (clean slate)
    if (admin.apps.length > 0) {
      await Promise.all(admin.apps.map(app => app.delete()));
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });

    console.log('✅ Firebase Admin initialized successfully');

    const emails = ['vaibhav@gmail.com', 'uniflyinsect@gmail.com'];
    
    for (const email of emails) {
      try {
        console.log(`🔍 Setting admin claim for: ${email}`);
        
        // Get user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        console.log(`✅ Found user: ${userRecord.uid}`);
        
        // Set admin custom claim
        await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
        console.log(`🎉 Admin claim set for ${email}`);
        
        // Verify
        const updatedUser = await admin.auth().getUser(userRecord.uid);
        console.log(`✅ Verified claims for ${email}:`, updatedUser.customClaims);
        
      } catch (userError) {
        if (userError.code === 'auth/user-not-found') {
          console.log(`⚠️  User ${email} not found - they need to sign up first`);
        } else {
          console.error(`❌ Error setting admin claim for ${email}:`, userError.message);
        }
      }
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. Users with admin claims should sign out and back in');
    console.log('2. Remove the temporary admin check from withAuth.ts');
    console.log('3. The app will now use proper Firebase custom claims');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setAdminClaims();