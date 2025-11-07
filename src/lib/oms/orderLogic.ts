
import { db } from "@/lib/firebase/server";
import { OrderItem } from "@/types/order";
import { Product } from "@/types/products";
import crypto from 'crypto';
import { logger } from "@/lib/logger";

interface OrderWeightAndDimensions {
  weight: number | null;
  dimensions: { l: number; b: number; h: number } | null;
  needsManualVerification: boolean;
  updatedItems: OrderItem[]; 
}

function createCombinationHash(items: OrderItem[]): string {
  const skus = items.map(item => `${item.sku}_${item.quantity}`).sort().join('S');
  return crypto.createHash('md5').update(skus).digest('hex');
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

  if (items.length > 1) {
      const combinationHash = createCombinationHash(items);
      const combinationRef = db.collection('verifiedCombinations').doc(combinationHash);
      const combinationDoc = await combinationRef.get();

      if (combinationDoc.exists) {
          const data = combinationDoc.data();
          // Ensure the returned dimension object is correct
          if (data && data.weight > 0 && data.dimensions) {
              return {
                  weight: data.weight,
                  dimensions: { l: data.dimensions.l, b: data.dimensions.b ?? data.dimensions.w, h: data.dimensions.h },
                  needsManualVerification: false,
                  updatedItems: updatedItems,
              };
          }
      }
      logger.info('Multi-item order needs verification', { combinationHash });
      return { weight: totalWeight, dimensions: packageDimensions, needsManualVerification: true, updatedItems: updatedItems };
  }

  return {
    weight: totalWeight,
    dimensions: packageDimensions,
    needsManualVerification: false,
    updatedItems: updatedItems
  };
}
