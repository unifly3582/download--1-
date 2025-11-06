// src/lib/firebase/server.ts
import admin from 'firebase-admin';

// A more robust way to initialize the Firebase Admin SDK in serverless environments
const initAdmin = () => {
  // Check if the default app is already initialized
  if (admin.apps.length > 0 && admin.apps[0]) {
    return admin.apps[0];
  }

  // If not initialized, create it
  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        // The private key must have newlines correctly formatted
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    // This catch is crucial for environments where multiple initializations might be attempted.
    console.error('Firebase admin initialization error:', error.message);
    // If initialization fails but an app exists, return the existing app.
    // This can happen in rare race conditions.
    if (admin.apps.length > 0 && admin.apps[0]) {
        return admin.apps[0];
    }
    throw error; // Re-throw the error if initialization truly fails
  }
};

// Initialize the app when this module is first loaded
initAdmin();

// Define and export the firestore instance, aliased as 'db'
export const db = admin.firestore();

// Define and export the auth instance
export const auth = admin.auth();
