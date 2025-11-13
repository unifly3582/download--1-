// Example: Working with combinations via API

class CombinationManager {
  
  // Get all combinations
  static async getAllCombinations() {
    const response = await fetch('/api/combinations?limit=100', {
      headers: { 'Authorization': 'Bearer admin-token' }
    });
    
    const data = await response.json();
    console.log('All combinations:', data.data);
    return data.data;
  }

  // Search combinations containing a specific product
  static async findCombinationsWithProduct(productId) {
    const response = await fetch(`/api/combinations?product=${productId}`, {
      headers: { 'Authorization': 'Bearer admin-token' }
    });
    
    const data = await response.json();
    console.log(`Combinations with ${productId}:`, data.data);
    return data.data;
  }

  // Get specific combination details
  static async getCombination(hash) {
    const response = await fetch(`/api/combinations/${hash}`, {
      headers: { 'Authorization': 'Bearer admin-token' }
    });
    
    const data = await response.json();
    console.log('Combination details:', data.data);
    return data.data;
  }

  // Update combination weight/dimensions
  static async updateCombination(hash, weight, dimensions, notes) {
    const response = await fetch(`/api/combinations/${hash}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin-token'
      },
      body: JSON.stringify({ weight, dimensions, notes })
    });
    
    const result = await response.json();
    console.log('Combination updated:', result);
    return result;
  }

  // Deactivate a combination
  static async deactivateCombination(hash) {
    const response = await fetch(`/api/combinations/${hash}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer admin-token' }
    });
    
    const result = await response.json();
    console.log('Combination deactivated:', result);
    return result;
  }
}

// Usage examples:
async function examples() {
  // List all combinations
  const allCombinations = await CombinationManager.getAllCombinations();
  
  // Find combinations containing specific product
  const withProduct = await CombinationManager.findCombinationsWithProduct('PROD001');
  
  // Update combination
  await CombinationManager.updateCombination(
    'combination-hash-here',
    4.2,  // New weight
    { l: 30, b: 25, h: 18 }, // New dimensions
    'Updated after re-verification'
  );
}