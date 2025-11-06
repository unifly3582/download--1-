
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

if (!getApps().length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("Firebase admin initialization error:", error.message);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
