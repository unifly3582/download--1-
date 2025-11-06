require('dotenv').config({ path: '.env.local' });

// scripts/clean-customer-addresses.js

// This script uses require for Node.js compatibility
const admin = require('firebase-admin');

// --- CONFIGURATION ---
// ALWAYS run with 'true' first to test.
// Change to 'false' to perform the actual database writes.
const DRY_RUN = true;
const BATCH_SIZE = 400; // Firestore batch limit is 500
const PINCODE_API_URL = 'https://api.postalpincode.in/pincode/';

/**
 * Initializes the Firebase Admin SDK.
 * It uses the same environment variables your Next.js app uses for the server-side.
 */
function initializeFirebaseAdmin() {
  // Check if the app is already initialized to prevent errors
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Your environment variables must be available in the terminal session
  // where you run this script.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set.');
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey.replace(/\\n/g, '\n'), // Important: format the private key
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK Initialized.');
}

/**
 * Fetches pincode data from the external API.
 */
async function getPincodeData(pincode) {
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return null; // Invalid pincode format
  }
  try {
    const response = await fetch(`${PINCODE_API_URL}${pincode}`);
    const data = await response.json();
    if (data && data[0].Status === 'Success') {
      const postOffice = data[0].PostOffice[0];
      return {
        city: postOffice.District,
        state: postOffice.State,
      };
    }
    return null;
  } catch (error) {
    console.warn(`- Could not fetch data for pincode: ${pincode}`);
    return null;
  }
}

/**
 * Main function to run the cleaning process.
 */
async function main() {
  console.log(`Starting address cleaning script. DRY_RUN is set to: ${DRY_RUN}`);
  
  initializeFirebaseAdmin();
  const db = admin.firestore();

  const customersRef = db.collection('customers');
  const snapshot = await customersRef.get();

  if (snapshot.empty) {
    console.log('No customers found. Exiting.');
    return;
  }

  console.log(`Found ${snapshot.size} total customers to check...`);

  let updatesToCommit = 0;
  let batch = db.batch();

  for (const doc of snapshot.docs) {
    const customer = doc.data();
    const customerId = doc.id;
    const currentAddress = customer.defaultAddress;

    // Skip if customer has no address or no pincode
    if (!currentAddress || !currentAddress.zip) {
      continue;
    }
    
    // Add a small delay to avoid overwhelming the external API
    await new Promise(resolve => setTimeout(resolve, 50));

    const apiAddress = await getPincodeData(currentAddress.zip);

    if (!apiAddress) {
      console.log(`- Skipping ${customer.name} (${customerId}): Pincode ${currentAddress.zip} not found by API.`);
      continue;
    }

    // Check if an update is needed (case-insensitive comparison)
    const needsUpdate =
      apiAddress.city.toLowerCase() !== currentAddress.city.toLowerCase() ||
      apiAddress.state.toLowerCase() !== currentAddress.state.toLowerCase();

    if (needsUpdate) {
      console.log(`- Staging update for ${customer.name} (${customerId}):`);
      console.log(`  - Pincode: ${currentAddress.zip}`);
      console.log(`  - Old: ${currentAddress.city}, ${currentAddress.state}`);
      console.log(`  - New: ${apiAddress.city}, ${apiAddress.state}`);
      
      const customerDocRef = db.collection('customers').doc(customerId);
      batch.update(customerDocRef, {
        'defaultAddress.city': apiAddress.city,
        'defaultAddress.state': apiAddress.state,
        'updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
      updatesToCommit++;

      // Commit the batch when it reaches the size limit
      if (updatesToCommit === BATCH_SIZE) {
        if (DRY_RUN) {
          console.log(`\n[DRY RUN] Would commit a batch of ${updatesToCommit} updates.\n`);
        } else {
          console.log(`\nCommitting a batch of ${updatesToCommit} updates...\n`);
          await batch.commit();
        }
        // Reset for the next batch
        batch = db.batch();
        updatesToCommit = 0;
      }
    }
  }

  // Commit any remaining updates in the last batch
  if (updatesToCommit > 0) {
    if (DRY_RUN) {
      console.log(`\n[DRY RUN] Would commit the final batch of ${updatesToCommit} updates.`);
    } else {
      console.log(`\nCommitting the final batch of ${updatesToCommit} updates...`);
      await batch.commit();
    }
  }

  console.log('\n--------------------');
  console.log('Script finished!');
  console.log('--------------------');
}

// Run the main function and catch any errors.
main().catch(error => {
  console.error('A critical error occurred:', error);
  process.exit(1);
});