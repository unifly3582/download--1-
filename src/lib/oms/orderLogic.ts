
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
    // If item already has weight and dimensions (from external source), use them
    if (item.weight && item.dimensions && item.dimensions.l > 0 && item.dimensions.b > 0 && item.dimensions.h > 0) {
      totalWeight += item.weight * item.quantity;
      packageDimensions.l = Math.max(packageDimensions.l, item.dimensions.l);
      packageDimensions.b = Math.max(packageDimensions.b, item.dimensions.b);
      packageDimensions.h = Math.max(packageDimensions.h, item.dimensions.h);
      updatedItems.push(item);
      continue;
    }

    // If no productId or SKU, and no dimensions provided, needs manual verification
    if (!item.productId || !item.sku) {
      logger.warn('Item missing productId or SKU, needs manual verification', { 
        productName: item.productName, 
        sku: item.sku 
      });
      needsManualVerification = true;
      updatedItems.push(item);
      continue; // Continue to process other items instead of breaking
    }

    let productData: Product | undefined = productCache.get(item.productId);

    if (!productData) {
      const productRef = db.collection('products').doc(item.productId);
      const doc = await productRef.get();
      if (!doc.exists) {
        logger.warn('Product not found in database, needs manual verification', { 
          productId: item.productId,
          productName: item.productName 
        });
        needsManualVerification = true;
        updatedItems.push(item);
        continue; // Continue to process other items instead of breaking
      }
      productData = { id: doc.id, ...doc.data() } as Product;
      productCache.set(item.productId, productData);
    }
    
    // The Product type uses 'b', but the data from firestore might still use 'w'.
    // It's safer to check for both and prioritize 'b'.
    const variation = productData.variations?.find(v => v.sku === item.sku);
    const dims = variation?.dimensions as any;

    if (!variation || !variation.weight || variation.weight <= 0 || !dims || dims.l <= 0 || (dims.b === undefined && dims.w === undefined) || (dims.b <= 0 && dims.w <= 0) || dims.h <= 0) {
        logger.warn('Invalid or missing variation dimensions', { 
          sku: item.sku, 
          productId: item.productId,
          hasVariation: !!variation,
          hasWeight: !!variation?.weight,
          hasDimensions: !!dims
        });
        needsManualVerification = true;
        updatedItems.push(item);
        continue; // Continue to process other items instead of breaking
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
    // Return the best available data even if manual verification is needed
    return { 
      weight: totalWeight > 0 ? totalWeight : null, 
      dimensions: (packageDimensions.l > 0 && packageDimensions.b > 0 && packageDimensions.h > 0) ? packageDimensions : null, 
      needsManualVerification: true, 
      updatedItems: updatedItems.length > 0 ? updatedItems : items 
    };
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
