/**
 * Check for admin users
 */

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function checkUsers() {
  console.log('🔍 Checking users...\n');

  const usersSnapshot = await db.collection('users').get();
  console.log(`Total users: ${usersSnapshot.size}\n`);

  const usersByRole = {};
  
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    const role = data.role || 'no-role';
    
    if (!usersByRole[role]) {
      usersByRole[role] = [];
    }
    
    usersByRole[role].push({
      id: doc.id,
      email: data.email,
      name: data.name
    });
  });

  console.log('Users by role:');
  Object.entries(usersByRole).forEach(([role, users]) => {
    console.log(`\n${role} (${users.length}):`);
    users.slice(0, 5).forEach(user => {
      console.log(`   - ${user.id}: ${user.email || user.name || 'N/A'}`);
    });
    if (users.length > 5) {
      console.log(`   ... and ${users.length - 5} more`);
    }
  });
}

checkUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
