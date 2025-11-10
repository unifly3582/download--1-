#!/usr/bin/env node

/**
 * Script to check Firestore index status and test queries
 */

const admin = require('firebase-admin');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function checkIndexStatus() {
  console.log('🔍 Checking Firestore index status...');
  
  try {
    // Initialize Firebase Admin
    if (admin.apps.length > 0) {
      await Promise.all(admin.apps.map(app => app.delete()));
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });

    console.log('✅ Firebase Admin initialized');

    const db = admin.firestore();

    // Test the problematic query from the error
    console.log('🧪 Testing problematic query...');
    
    try {
      const query = db.collection('orders')
        .where('internalStatus', 'in', ['created_pending', 'needs_manual_verification'])
        .orderBy('createdAt', 'desc')
        .limit(5);
        
      const snapshot = await query.get();
      console.log('✅ Query successful! Found', snapshot.size, 'documents');
      
      if (snapshot.size > 0) {
        console.log('📄 Sample document IDs:', snapshot.docs.slice(0, 3).map(doc => doc.id));
      }
      
    } catch (queryError) {
      console.log('❌ Query failed:', queryError.code, queryError.message);
      
      if (queryError.code === 9) {
        console.log('🔨 Index is still building. This is normal for new projects.');
        console.log('⏱️  Indexes typically take 5-15 minutes to build.');
        console.log('🔗 Check status: https://console.firebase.google.com/project/buggly-adminpanel/firestore/indexes');
      }
    }

    // Test simple query (should always work)
    console.log('🧪 Testing simple query...');
    try {
      const simpleQuery = db.collection('orders').limit(3);
      const simpleSnapshot = await simpleQuery.get();
      console.log('✅ Simple query successful! Collection has', simpleSnapshot.size, 'documents');
    } catch (simpleError) {
      console.log('❌ Simple query failed:', simpleError.message);
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkIndexStatus();