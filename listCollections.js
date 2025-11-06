
// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');

// Check if the required environment variables are loaded
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error('Error: Missing Firebase environment variables. Please ensure .env.local is correctly configured.');
  process.exit(1);
}

// Initialize the Firebase Admin SDK with credentials
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The private key needs to be parsed correctly
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function listCollections() {
  try {
    const collections = await db.listCollections();
    console.log('Firestore Collections:');
    if (collections.length === 0) {
      console.log('No collections found in the database.');
    }
    collections.forEach(collection => {
      console.log(' - ', collection.id);
    });
  } catch (error) {
    console.error('Error listing collections:', error.message);
  } finally {
    // Close the app to allow the script to exit
    admin.app().delete();
  }
}

listCollections();
