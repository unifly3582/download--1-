
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function addDelhiveryConfig() {
  try {
    const docRef = db.collection('courierIntegrations').doc('delhivery');
    await docRef.set({
      name: 'Delhivery',
      api: {
        baseUrl: 'https://track.delhivery.com',
        bookingEndpoint: '/api/cmu/create.json',
        authKey: 'YOUR_DELHIVERY_API_KEY', // IMPORTANT: Replace with your actual key
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Successfully created courierIntegrations/delhivery document.');
  } catch (error) {
    console.error('Error creating document:', error.message);
  } finally {
    admin.app().delete();
  }
}

addDelhiveryConfig();
