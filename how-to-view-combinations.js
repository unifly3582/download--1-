/**
 * HOW TO VIEW YOUR STORED COMBINATIONS
 * ===================================
 */

// METHOD 1: List all combinations via API
const viewAllCombinations = async () => {
  try {
    const response = await fetch('/api/combinations', {
      headers: {
        'Authorization': 'Bearer your-admin-token'
      }
    });
    
    const data = await response.json();
    
    console.log('📦 Your Stored Combinations:');
    console.log('============================');
    
    data.data.forEach((combo, index) => {
      console.log(`\n${index + 1}. Hash: ${combo.combinationHash}`);
      console.log(`   Products: ${combo.items.map(i => `${i.productName} x${i.quantity}`).join(', ')}`);
      console.log(`   Weight: ${combo.weight}kg`);
      console.log(`   Dimensions: ${combo.dimensions.l}×${combo.dimensions.b}×${combo.dimensions.h}cm`);
      console.log(`   Used: ${combo.usageCount} times`);
      console.log(`   Created: ${new Date(combo.verifiedAt).toLocaleDateString()}`);
      console.log(`   Status: ${combo.isActive ? '✅ Active' : '❌ Inactive'}`);
      if (combo.notes) console.log(`   Notes: ${combo.notes}`);
    });
    
  } catch (error) {
    console.error('Error fetching combinations:', error);
  }
};

// METHOD 2: Check specific combination by items
const checkCombinationExists = async (orderItems) => {
  // This would be in your backend code
  const hash = CombinationService.createCombinationHash(orderItems);
  console.log(`Looking for combination with hash: ${hash}`);
  
  const combination = await CombinationService.getCombination(hash);
  
  if (combination) {
    console.log('✅ Combination exists in database!');
    console.log(`   Stored in: verifiedCombinations/${hash}`);
    console.log(`   Weight: ${combination.weight}kg`);
    console.log(`   Dimensions: ${combination.dimensions.l}×${combination.dimensions.b}×${combination.dimensions.h}cm`);
  } else {
    console.log('❌ No combination found for these items');
  }
};

// METHOD 3: Database query (if you have direct DB access)
const directDatabaseQuery = () => {
  console.log(`
🗄️  DIRECT DATABASE ACCESS:
==========================

Collection: verifiedCombinations
Path: /projects/your-project-id/databases/(default)/documents/verifiedCombinations

Query Examples:
• Get all: db.collection('verifiedCombinations').get()
• Get active: db.collection('verifiedCombinations').where('isActive', '==', true).get()
• Get by usage: db.collection('verifiedCombinations').orderBy('usageCount', 'desc').limit(10).get()
• Get by product: db.collection('verifiedCombinations').where('productSkus', 'array-contains', 'SKU001').get()
  `);
};

// METHOD 4: Check what's in your database right now
const checkCurrentStorage = () => {
  console.log(`
📊 TO CHECK YOUR CURRENT COMBINATIONS:
=====================================

1. 🌐 FIREBASE CONSOLE:
   • Go to: https://console.firebase.google.com
   • Select your project
   • Click: Firestore Database
   • Look for: verifiedCombinations collection

2. 🔧 API ENDPOINT:
   • GET /api/combinations
   • Requires admin authentication
   • Returns all active combinations

3. 📱 ADMIN PANEL:
   • If you build an admin interface
   • Connect to the combinations API
   • Display in user-friendly format

4. 💻 COMMAND LINE:
   • Use Firebase CLI: firebase firestore:query
   • Or write a script to list combinations
  `);
};

console.log('🗂️  COMBINATION STORAGE SUMMARY:');
console.log('================================');
console.log('📍 Location: Firestore Database');
console.log('📂 Collection: verifiedCombinations');
console.log('🔑 Document ID: MD5 hash of items');
console.log('💾 Structure: JSON documents with all combination data');
console.log('🔒 Access: Admin authentication required');

// Run the examples
viewAllCombinations();
checkCurrentStorage();