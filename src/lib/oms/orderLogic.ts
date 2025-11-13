
import { db } from "@/lib/firebase/server";
import { OrderItem } from "@/types/order";
import { Product } from "@/types/products";
import { logger } from "@/lib/logger";
import { CombinationService } from "./combinationService";

interface OrderWeightAndDimensions {
  weight: number | null;
  dimensions: { l: number; b: number; h: number } | null;
  needsManualVerification: boolean;
  updatedItems: OrderItem[]; 
}

export async function getOrderWeightAndDimensions(items: OrderItem[]): Promise<OrderWeightAndDimensions> {
  let totalWeight = 0;
  // Corrected: Initialize with 'b' instead of 'w'
  let packageDimensions = { l: 0, b: 0, h: 0 };
  let needsManualVerification = false;
  const updatedItems: OrderItem[] = [];
  const productCache = new Map<string, Product>();

  for (const item of items) {
    if (!item.productId || !item.sku) {
      needsManualVerification = true;
      break; 
    }

    let productData: Product | undefined = productCache.get(item.productId);

    if (!productData) {
      const productRef = db.collection('products').doc(item.productId);
      const doc = await productRef.get();
      if (!doc.exists) {
        logger.error('Product not found', null, { productId: item.productId });
        needsManualVerification = true;
        break;
      }
      productData = { id: doc.id, ...doc.data() } as Product;
      productCache.set(item.productId, productData);
    }
    
    // The Product type uses 'b', but the data from firestore might still use 'w'.
    // It's safer to check for both and prioritize 'b'.
    const variation = productData.variations?.find(v => v.sku === item.sku);
    const dims = variation?.dimensions as any;

    if (!variation || !variation.weight || variation.weight <= 0 || !dims || dims.l <= 0 || (dims.b === undefined && dims.w === undefined) || (dims.b <= 0 && dims.w <= 0) || dims.h <= 0) {
        logger.error('Invalid or missing variation', null, { sku: item.sku, productId: item.productId });
        needsManualVerification = true;
        break;
    }

    const variationWidth = dims.b ?? dims.w; // Prioritize 'b', fallback to 'w'

    totalWeight += variation.weight * item.quantity;
    packageDimensions.l = Math.max(packageDimensions.l, dims.l);
    // Corrected: Use 'b' for the calculation
    packageDimensions.b = Math.max(packageDimensions.b, variationWidth);
    packageDimensions.h = Math.max(packageDimensions.h, dims.h);

    const updatedItem: OrderItem = {
      ...item,
      variationId: variation.id,
      weight: variation.weight,
      // Ensure the dimensions object we store matches the type
      dimensions: { l: dims.l, b: variationWidth, h: dims.h },
      hsnCode: variation.hsnCode
    };
    updatedItems.push(updatedItem);
  }

  if (needsManualVerification) {
    return { weight: null, dimensions: null, needsManualVerification: true, updatedItems: items };
  }

  // Check for verified combinations (both single and multi-item)
  if (items.length >= 1) {
      const combination = await CombinationService.findCombination(items);

      if (combination && combination.isActive) {
          // Record usage for analytics
          await CombinationService.recordUsage(combination.combinationHash);
          
          logger.info('Using verified combination', { 
            combinationHash: combination.combinationHash, 
            itemCount: items.length,
            usageCount: combination.usageCount + 1
          });
          
          return {
              weight: combination.weight,
              dimensions: combination.dimensions,
              needsManualVerification: false,
              updatedItems: updatedItems,
          };
      }
      
      // For multi-item orders without verified combinations, require manual verification
      if (items.length > 1) {
        const combinationHash = CombinationService.createCombinationHash(items);
        logger.info('Multi-item order needs verification - no verified combination found', { 
          combinationHash,
          itemCount: items.length
        });
        return { weight: totalWeight, dimensions: packageDimensions, needsManualVerification: true, updatedItems: updatedItems };
      }
  }

  return {
    weight: totalWeight,
    dimensions: packageDimensions,
    needsManualVerification: false,
    updatedItems: updatedItems
  };
}
