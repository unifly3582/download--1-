
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

async function createCollections() {
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

  try {
    // Create 'orders' collection by adding a placeholder document
    const ordersRef = db.collection('orders').doc('placeholder');
    await ordersRef.set({ note: 'This document is a placeholder to create the collection.' });
    console.log("Successfully created the 'orders' collection.");

    // Create 'customers' collection by adding a placeholder document
    const customersRef = db.collection('customers').doc('placeholder');
    await customersRef.set({ note: 'This document is a placeholder to create the collection.' });
    console.log("Successfully created the 'customers' collection.");

  } catch (error) {
    console.error('Error creating collections:', error.message);
  } finally {
    // It's important to close the app to allow the script to exit gracefully.
    await admin.app().delete();
  }
}

createCollections();
