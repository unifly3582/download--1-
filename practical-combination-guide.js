/**
 * Practical Guide: How to Use Combinations in Your Store
 * =====================================================
 */

// SCENARIO 1: Customer places order with 2x Product A + 1x Product B
// System automatically:
// 1. Generates hash: "639c673772c6efffa6ff80b21a67d6f5"
// 2. Looks up combination in database
// 3. If found: Uses verified weight/dimensions
// 4. If not found: Calculates from individual products

// SCENARIO 2: Admin creates combination after physical verification
// Use this API call (or admin interface):

const createCommonCombination = async () => {
  const response = await fetch('/api/combinations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-admin-token'
    },
    body: JSON.stringify({
      // These are the actual items from a real order
      items: [
        {
          productId: 'prod_wireless_mouse',
          productName: 'Wireless Mouse',
          sku: 'WM001',
          quantity: 2,
          unitPrice: 25.99
        },
        {
          productId: 'prod_mouse_pad',
          productName: 'Gaming Mouse Pad',
          sku: 'MP001',
          quantity: 1,
          unitPrice: 15.99
        }
      ],
      // After physically packing and weighing:
      weight: 0.85,  // Total weight in kg
      dimensions: {
        l: 25,  // Length in cm
        b: 20,  // Breadth in cm
        h: 8    // Height in cm
      },
      notes: 'Common combo - 2 mice + mousepad pack efficiently together'
    })
  });

  if (response.ok) {
    console.log('✅ Combination created! Future orders will be faster.');
  }
};

// SCENARIO 3: Check what combinations you have
const checkExistingCombinations = async () => {
  const response = await fetch('/api/combinations?limit=20', {
    headers: { 'Authorization': 'Bearer admin-token' }
  });
  
  const data = await response.json();
  
  console.log('Your verified combinations:');
  data.data.forEach(combo => {
    console.log(`📦 Hash: ${combo.combinationHash}`);
    console.log(`   Items: ${combo.items.length} products`);
    console.log(`   Weight: ${combo.weight}kg`);
    console.log(`   Used: ${combo.usageCount} times`);
    console.log(`   Products: ${combo.items.map(i => `${i.productName} x${i.quantity}`).join(', ')}`);
    console.log('');
  });
};

// SCENARIO 4: Find all combinations that include a specific product
const findCombinationsWithProduct = async (productId) => {
  const response = await fetch(`/api/combinations?product=${productId}`, {
    headers: { 'Authorization': 'Bearer admin-token' }
  });
  
  const data = await response.json();
  
  console.log(`Combinations containing product ${productId}:`);
  data.data.forEach(combo => {
    console.log(`📦 ${combo.combinationHash} (used ${combo.usageCount} times)`);
  });
};

// PRACTICAL WORKFLOW FOR YOUR STORE:

// 1. Monitor your order processing logs to see which combinations are being calculated frequently
// 2. For high-frequency combinations, physically verify the weight/dimensions
// 3. Create the combination using the API
// 4. Future orders with same items will automatically use verified data
// 5. Check analytics to see which combinations are most popular

console.log(`
🎯 QUICK START FOR YOUR STORE:
=============================

1. 🔍 IDENTIFY: Look for orders that appear frequently
2. 📦 VERIFY: Physically pack and weigh those combinations  
3. 💾 SAVE: Use POST /api/combinations to store verified data
4. 📊 MONITOR: Check usage with GET /api/combinations
5. 🚀 OPTIMIZE: Focus on high-usage combinations first

💡 TIP: Start with your top 10 most common product combinations!
`);

// Export functions for use
module.exports = {
  createCommonCombination,
  checkExistingCombinations,
  findCombinationsWithProduct
};