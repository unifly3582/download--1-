// Example: Using CombinationService directly in your backend code

import { CombinationService } from '@/lib/oms/combinationService';
import { OrderItem } from '@/types/order';

class OrderProcessor {
  
  async processOrder(orderItems: OrderItem[]) {
    console.log('Processing order with items:', orderItems);
    
    // 1. Check if combination exists
    const combination = await CombinationService.findCombination(orderItems);
    
    if (combination) {
      console.log('✅ Found verified combination!');
      console.log(`Weight: ${combination.weight}kg`);
      console.log(`Dimensions: ${combination.dimensions.l}x${combination.dimensions.b}x${combination.dimensions.h}cm`);
      console.log(`Usage count: ${combination.usageCount}`);
      
      // Use the verified data for shipping calculations
      return {
        weight: combination.weight,
        dimensions: combination.dimensions,
        shippingCost: this.calculateShipping(combination.weight, combination.dimensions)
      };
    } else {
      console.log('❌ No combination found - manual calculation needed');
      // Fall back to individual product calculations
      return this.calculateFromIndividualProducts(orderItems);
    }
  }

  async createCombinationFromOrder(orderItems: OrderItem[], verifiedWeight: number, verifiedDimensions: any, adminUserId: string) {
    console.log('Creating new combination from order...');
    
    await CombinationService.saveCombination(
      orderItems,
      verifiedWeight,
      verifiedDimensions,
      adminUserId,
      'Created from processed order'
    );
    
    console.log('✅ Combination saved for future orders!');
  }

  async getPopularCombinations() {
    const stats = await CombinationService.getCombinationStats();
    console.log('Combination Statistics:');
    console.log(`Total combinations: ${stats.totalCombinations}`);
    console.log(`Active combinations: ${stats.activeCombinations}`);
    console.log(`Total usage: ${stats.totalUsage}`);
    console.log(`Average weight: ${stats.averageWeight.toFixed(2)}kg`);
    
    if (stats.mostUsedCombination) {
      console.log(`Most used: ${stats.mostUsedCombination.hash} (${stats.mostUsedCombination.count} times)`);
    }
  }

  private calculateShipping(weight: number, dimensions: any) {
    // Your shipping calculation logic
    return weight * 10 + (dimensions.l * dimensions.b * dimensions.h) * 0.01;
  }

  private calculateFromIndividualProducts(items: OrderItem[]) {
    // Fallback calculation logic
    return { weight: 0, dimensions: { l: 0, b: 0, h: 0 }, shippingCost: 0 };
  }
}

// Usage example:
async function example() {
  const processor = new OrderProcessor();
  
  const orderItems: OrderItem[] = [
    {
      productId: 'PROD001',
      productName: 'Product A',
      sku: 'SKU001',
      quantity: 2,
      unitPrice: 100
    },
    {
      productId: 'PROD002',
      productName: 'Product B', 
      sku: 'SKU002',
      quantity: 1,
      unitPrice: 200
    }
  ];

  // Process the order (automatically uses combinations if available)
  const result = await processor.processOrder(orderItems);
  
  // Get analytics
  await processor.getPopularCombinations();
}