#!/usr/bin/env node

/**
 * Script to validate Firebase Admin SDK credentials
 */

const admin = require('firebase-admin');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function validateCredentials() {
  console.log('🔍 Validating Firebase Admin SDK credentials...');
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log('📋 Credential check:');
  console.log(`- Project ID: ${projectId || 'MISSING'}`);
  console.log(`- Client Email: ${clientEmail || 'MISSING'}`);
  console.log(`- Private Key: ${privateKey ? `SET (${privateKey.length} chars)` : 'MISSING'}`);

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Missing required credentials');
    return false;
  }

  try {
    console.log('🚀 Attempting to initialize Firebase Admin...');
    
    // Clean up any existing apps
    if (admin.apps.length > 0) {
      await Promise.all(admin.apps.map(app => app.delete()));
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });

    console.log('✅ Firebase Admin initialized successfully');

    // Test Firestore access
    console.log('🔍 Testing Firestore access...');
    const db = admin.firestore();
    
    // Try to list collections
    const collections = await db.listCollections();
    console.log('✅ Firestore access successful');
    console.log(`📚 Found ${collections.length} collections:`, collections.map(c => c.id));

    return true;

  } catch (error) {
    console.error('❌ Firebase Admin validation failed:', error.code || 'Unknown');
    console.error('Details:', error.message);
    
    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Generate a new service account key from Firebase Console');
      console.log('2. Check if the service account has proper permissions');
      console.log('3. Verify the private key format (should have \\n for newlines)');
    }
    
    return false;
  }
}

validateCredentials()
  .then(success => {
    if (success) {
      console.log('\n🎉 All credentials are valid!');
    } else {
      console.log('\n❌ Credential validation failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Validation script error:', error);
    process.exit(1);
  });