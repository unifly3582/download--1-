/**
 * Simple demonstration of how combinations work
 * Run with: node combination-demo.js
 */

// Mock data that represents order items
const orderItems1 = [
  { productId: 'PROD001', sku: 'SKU001', quantity: 2, productName: 'Product A', unitPrice: 100 },
  { productId: 'PROD002', sku: 'SKU002', quantity: 1, productName: 'Product B', unitPrice: 200 }
];

const orderItems2 = [
  { productId: 'PROD002', sku: 'SKU002', quantity: 1, productName: 'Product B', unitPrice: 200 },
  { productId: 'PROD001', sku: 'SKU001', quantity: 2, productName: 'Product A', unitPrice: 100 }
];

const orderItems3 = [
  { productId: 'PROD001', sku: 'SKU001', quantity: 1, productName: 'Product A', unitPrice: 100 },
  { productId: 'PROD003', sku: 'SKU003', quantity: 1, productName: 'Product C', unitPrice: 150 }
];

// Mock combination hash generation (simplified version)
function createCombinationHash(items) {
  const crypto = require('crypto');
  
  // Create sorted array of SKU_QUANTITY pairs
  const skuQuantityPairs = items
    .map(item => `${item.sku}_${item.quantity}`)
    .sort(); // Sort to ensure consistent hash regardless of item order
  
  // Generate MD5 hash
  const hash = crypto.createHash('md5')
    .update(skuQuantityPairs.join('|'))
    .digest('hex');
  
  return hash;
}

// Mock database of verified combinations
const verifiedCombinations = {
  // This would be the hash for orderItems1 and orderItems2 (same combination)
  'a1b2c3d4e5f6': {
    combinationHash: 'a1b2c3d4e5f6',
    items: orderItems1,
    weight: 3.5,
    dimensions: { l: 25, b: 20, h: 15 },
    usageCount: 5,
    verifiedBy: 'admin-123',
    verifiedAt: new Date('2024-01-15'),
    isActive: true,
    notes: 'Manually verified - packs efficiently together'
  }
};

// Simulate how the system works
function processOrder(orderItems) {
  console.log('\n🚚 Processing Order:');
  console.log('Items:', orderItems.map(item => `${item.productName} (${item.sku}) x${item.quantity}`).join(', '));
  
  // Generate hash for this combination
  const hash = createCombinationHash(orderItems);
  console.log(`📋 Combination Hash: ${hash}`);
  
  // Check if we have a verified combination
  const combination = verifiedCombinations[hash];
  
  if (combination) {
    console.log('✅ FOUND VERIFIED COMBINATION!');
    console.log(`   Weight: ${combination.weight}kg`);
    console.log(`   Dimensions: ${combination.dimensions.l}x${combination.dimensions.b}x${combination.dimensions.h}cm`);
    console.log(`   Usage Count: ${combination.usageCount}`);
    console.log(`   Notes: ${combination.notes}`);
    
    // Simulate usage tracking
    combination.usageCount++;
    console.log(`   📊 Usage count updated to: ${combination.usageCount}`);
    
    return {
      source: 'verified_combination',
      weight: combination.weight,
      dimensions: combination.dimensions,
      needsManualVerification: false
    };
  } else {
    console.log('❌ NO COMBINATION FOUND');
    console.log('   Will calculate from individual products');
    console.log('   💡 Consider creating a combination after manual verification');
    
    return {
      source: 'individual_calculation',
      weight: null,
      dimensions: null,
      needsManualVerification: true
    };
  }
}

// Simulate creating a new combination
function createCombination(orderItems, weight, dimensions, notes) {
  const hash = createCombinationHash(orderItems);
  
  console.log('\n➕ CREATING NEW COMBINATION:');
  console.log(`   Hash: ${hash}`);
  console.log(`   Weight: ${weight}kg`);
  console.log(`   Dimensions: ${dimensions.l}x${dimensions.b}x${dimensions.h}cm`);
  console.log(`   Notes: ${notes}`);
  
  verifiedCombinations[hash] = {
    combinationHash: hash,
    items: orderItems,
    weight: weight,
    dimensions: dimensions,
    usageCount: 0,
    verifiedBy: 'admin-456',
    verifiedAt: new Date(),
    isActive: true,
    notes: notes
  };
  
  console.log('✅ Combination saved! Future orders with same items will use this data.');
}

// Demo the system
console.log('🧪 COMBINATION SYSTEM DEMONSTRATION');
console.log('=====================================');

// Test 1: Order with existing combination
console.log('\n📦 Test 1: Order with EXISTING combination');
const hash1 = createCombinationHash(orderItems1);
verifiedCombinations[hash1] = {
  combinationHash: hash1,
  items: orderItems1,
  weight: 3.5,
  dimensions: { l: 25, b: 20, h: 15 },
  usageCount: 5,
  verifiedBy: 'admin-123',
  verifiedAt: new Date('2024-01-15'),
  isActive: true,
  notes: 'Manually verified - packs efficiently together'
};
processOrder(orderItems1);

// Test 2: Same combination but different order (should generate same hash)
console.log('\n📦 Test 2: SAME combination but items in different order');
processOrder(orderItems2);

// Test 3: New combination (not found)
console.log('\n📦 Test 3: NEW combination (not found)');
processOrder(orderItems3);

// Test 4: Create the new combination
console.log('\n📦 Test 4: CREATE the new combination');
createCombination(orderItems3, 2.8, { l: 20, b: 18, h: 12 }, 'New combination verified manually');

// Test 5: Now the same order will use the combination
console.log('\n📦 Test 5: Same order now USES the created combination');
processOrder(orderItems3);

console.log('\n🎉 DEMONSTRATION COMPLETE!');
console.log('\nKey Points:');
console.log('• Same items in any order = same hash = same combination');
console.log('• Verified combinations provide instant weight/dimensions');
console.log('• Usage is automatically tracked for analytics');
console.log('• New combinations can be created after manual verification');
console.log('• System falls back to individual calculations when needed');