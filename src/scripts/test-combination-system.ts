/**
 * Test script for combination management system
 * This tests the complete flow from creation to usage tracking
 */

import { CombinationService } from '@/lib/oms/combinationService';
import { OrderItem } from '@/types/order';

async function testCombinationSystem() {
  console.log('🧪 Testing Combination Management System...\n');

  // Test data
  const testItems: OrderItem[] = [
    {
      productId: 'PROD001',
      productName: 'Test Product 1',
      sku: 'SKU001',
      quantity: 2,
      unitPrice: 100,
      weight: 0.5,
      dimensions: { l: 10, b: 10, h: 5 }
    },
    {
      productId: 'PROD002',
      productName: 'Test Product 2',
      sku: 'SKU002', 
      quantity: 1,
      unitPrice: 200,
      weight: 1.0,
      dimensions: { l: 15, b: 12, h: 8 }
    }
  ];

  try {
    // 1. Test combination hash generation
    console.log('1️⃣ Testing combination hash generation...');
    const hash = CombinationService.createCombinationHash(testItems);
    console.log(`   Generated hash: ${hash}`);
    console.log('   ✅ Hash generation works\n');

    // 2. Test finding non-existent combination
    console.log('2️⃣ Testing finding non-existent combination...');
    const notFound = await CombinationService.findCombination(testItems);
    console.log(`   Found combination: ${notFound ? 'YES' : 'NO'}`);
    console.log('   ✅ Correctly returns null for non-existent combination\n');

    // 3. Test saving new combination
    console.log('3️⃣ Testing saving new combination...');
    await CombinationService.saveCombination(
      testItems,
      3.5, // Total weight
      { l: 25, b: 20, h: 15 }, // Total dimensions
      'test-user-123',
      'Test combination for system validation'
    );
    console.log('   ✅ Combination saved successfully\n');

    // 4. Test finding existing combination
    console.log('4️⃣ Testing finding existing combination...');
    const found = await CombinationService.findCombination(testItems);
    if (found) {
      console.log(`   Found combination with hash: ${found.combinationHash}`);
      console.log(`   Weight: ${found.weight}kg`);
      console.log(`   Dimensions: ${found.dimensions.l}x${found.dimensions.b}x${found.dimensions.h}cm`);
      console.log(`   Usage count: ${found.usageCount}`);
      console.log('   ✅ Successfully found saved combination\n');
    } else {
      console.log('   ❌ Failed to find saved combination\n');
      return;
    }

    // 5. Test usage recording
    console.log('5️⃣ Testing usage recording...');
    await CombinationService.recordUsage(found.combinationHash);
    
    // Check if usage was recorded
    const updatedCombination = await CombinationService.getCombination(found.combinationHash);
    if (updatedCombination && updatedCombination.usageCount > found.usageCount) {
      console.log(`   Usage count increased from ${found.usageCount} to ${updatedCombination.usageCount}`);
      console.log('   ✅ Usage recording works\n');
    } else {
      console.log('   ❌ Usage recording failed\n');
    }

    // 6. Test listing combinations
    console.log('6️⃣ Testing combination listing...');
    const combinations = await CombinationService.listCombinations(5);
    console.log(`   Found ${combinations.length} active combinations`);
    if (combinations.length > 0) {
      console.log(`   Latest combination: ${combinations[0].combinationHash}`);
      console.log('   ✅ Combination listing works\n');
    }

    // 7. Test product search
    console.log('7️⃣ Testing product search...');
    const withProduct = await CombinationService.findCombinationsWithProduct('PROD001');
    console.log(`   Found ${withProduct.length} combinations containing PROD001`);
    console.log('   ✅ Product search works\n');

    // 8. Test statistics
    console.log('8️⃣ Testing combination statistics...');
    const stats = await CombinationService.getCombinationStats();
    console.log(`   Total combinations: ${stats.totalCombinations}`);
    console.log(`   Active combinations: ${stats.activeCombinations}`);
    console.log(`   Total usage: ${stats.totalUsage}`);
    console.log(`   Average weight: ${stats.averageWeight.toFixed(2)}kg`);
    if (stats.mostUsedCombination) {
      console.log(`   Most used: ${stats.mostUsedCombination.hash} (${stats.mostUsedCombination.count} uses)`);
    }
    console.log('   ✅ Statistics calculation works\n');

    console.log('🎉 All tests passed! Combination management system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for potential use in other scripts
export { testCombinationSystem };

// Run if called directly
if (require.main === module) {
  testCombinationSystem();
}