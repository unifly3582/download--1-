import { db } from "@/lib/firebase/server";
import admin from "firebase-admin";
import crypto from 'crypto';
import { OrderItem } from "@/types/order";
import { VerifiedCombination, CreateCombination } from "@/types/combination";
import { logger } from "@/lib/logger";

/**
 * Service for managing product combinations with weight and dimensions
 */
export class CombinationService {
  
  /**
   * Creates a unique hash for a combination of items
   */
  static createCombinationHash(items: OrderItem[]): string {
    const skus = items
      .map(item => `${item.sku}_${item.quantity}`)
      .sort()
      .join('S');
    return crypto.createHash('md5').update(skus).digest('hex');
  }

  /**
   * Saves a verified combination to the database
   */
  static async saveCombination(
    items: OrderItem[], 
    weight: number, 
    dimensions: { l: number; b: number; h: number },
    verifiedBy: string,
    notes?: string
  ): Promise<string> {
    try {
      const combinationHash = this.createCombinationHash(items);
      
      const combination: Omit<VerifiedCombination, 'combinationHash' | 'verifiedAt' | 'totalItems' | 'uniqueProducts'> = {
        items,
        weight,
        dimensions,
        verifiedBy,
        notes,
        isActive: true,
        usageCount: 0
      };

      // Calculate metadata
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const uniqueProducts = new Set(items.map(item => item.productId)).size;

      const fullCombination: VerifiedCombination = {
        ...combination,
        combinationHash,
        verifiedAt: new Date(),
        totalItems,
        uniqueProducts
      };

      await db.collection('verifiedCombinations').doc(combinationHash).set({
        ...fullCombination,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info('Combination saved successfully', { combinationHash, totalItems, uniqueProducts });
      return combinationHash;

    } catch (error) {
      logger.error('Failed to save combination', error, { items: items.length });
      throw error;
    }
  }

  /**
   * Retrieves a combination by its hash
   */
  static async getCombination(combinationHash: string): Promise<VerifiedCombination | null> {
    try {
      const doc = await db.collection('verifiedCombinations').doc(combinationHash).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      if (!data) {
        return null;
      }

      // Convert Firestore timestamps to dates
      return {
        ...data,
        combinationHash,
        verifiedAt: data.verifiedAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
        lastUsedAt: data.lastUsedAt?.toDate()
      } as VerifiedCombination;

    } catch (error) {
      logger.error('Failed to get combination', error, { combinationHash });
      return null;
    }
  }

  /**
   * Finds a combination for the given items
   */
  static async findCombination(items: OrderItem[]): Promise<VerifiedCombination | null> {
    const combinationHash = this.createCombinationHash(items);
    return this.getCombination(combinationHash);
  }

  /**
   * Updates usage statistics when a combination is used
   */
  static async recordUsage(combinationHash: string): Promise<void> {
    try {
      await db.collection('verifiedCombinations').doc(combinationHash).update({
        usageCount: admin.firestore.FieldValue.increment(1),
        lastUsedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info('Combination usage recorded', { combinationHash });

    } catch (error) {
      logger.error('Failed to record combination usage', error, { combinationHash });
      // Don't throw - usage tracking is not critical
    }
  }

  /**
   * Updates an existing combination
   */
  static async updateCombination(
    combinationHash: string,
    weight: number,
    dimensions: { l: number; b: number; h: number },
    updatedBy: string,
    notes?: string
  ): Promise<void> {
    try {
      await db.collection('verifiedCombinations').doc(combinationHash).update({
        weight,
        dimensions,
        updatedBy,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        notes: notes || admin.firestore.FieldValue.delete()
      });

      logger.info('Combination updated successfully', { combinationHash });

    } catch (error) {
      logger.error('Failed to update combination', error, { combinationHash });
      throw error;
    }
  }

  /**
   * Lists all combinations (for admin)
   */
  static async listCombinations(limit: number = 50): Promise<VerifiedCombination[]> {
    try {
      const snapshot = await db.collection('verifiedCombinations')
        .where('isActive', '==', true)
        .orderBy('verifiedAt', 'desc')
        .limit(limit)
        .get();

      const combinations: VerifiedCombination[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        combinations.push({
          ...data,
          combinationHash: doc.id,
          verifiedAt: data.verifiedAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
          lastUsedAt: data.lastUsedAt?.toDate()
        } as VerifiedCombination);
      });

      return combinations;

    } catch (error) {
      logger.error('Failed to list combinations', error);
      throw error;
    }
  }

  /**
   * Searches combinations by product
   */
  static async findCombinationsWithProduct(productId: string): Promise<VerifiedCombination[]> {
    try {
      // Note: This requires a composite index on items array and isActive
      const snapshot = await db.collection('verifiedCombinations')
        .where('isActive', '==', true)
        .get(); // We'll filter in memory for now due to array query limitations

      const combinations: VerifiedCombination[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Check if any item has the target productId
        const hasProduct = data.items?.some((item: OrderItem) => item.productId === productId);
        
        if (hasProduct) {
          combinations.push({
            ...data,
            combinationHash: doc.id,
            verifiedAt: data.verifiedAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
            lastUsedAt: data.lastUsedAt?.toDate()
          } as VerifiedCombination);
        }
      });

      return combinations.sort((a, b) => b.verifiedAt.getTime() - a.verifiedAt.getTime());

    } catch (error) {
      logger.error('Failed to find combinations with product', error, { productId });
      throw error;
    }
  }

  /**
   * Deactivates a combination (soft delete)
   */
  static async deactivateCombination(combinationHash: string, deactivatedBy: string): Promise<void> {
    try {
      await db.collection('verifiedCombinations').doc(combinationHash).update({
        isActive: false,
        updatedBy: deactivatedBy,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info('Combination deactivated', { combinationHash, deactivatedBy });

    } catch (error) {
      logger.error('Failed to deactivate combination', error, { combinationHash });
      throw error;
    }
  }

  /**
   * Gets combination statistics
   */
  static async getCombinationStats(): Promise<{
    totalCombinations: number;
    activeCombinations: number;
    totalUsage: number;
    averageWeight: number;
    mostUsedCombination?: { hash: string; count: number };
  }> {
    try {
      const snapshot = await db.collection('verifiedCombinations').get();
      
      let totalCombinations = 0;
      let activeCombinations = 0;
      let totalUsage = 0;
      let totalWeight = 0;
      let mostUsedCount = 0;
      let mostUsedHash = '';

      snapshot.forEach(doc => {
        const data = doc.data();
        totalCombinations++;
        
        if (data.isActive) {
          activeCombinations++;
          totalWeight += data.weight || 0;
        }
        
        const usageCount = data.usageCount || 0;
        totalUsage += usageCount;
        
        if (usageCount > mostUsedCount) {
          mostUsedCount = usageCount;
          mostUsedHash = doc.id;
        }
      });

      return {
        totalCombinations,
        activeCombinations,
        totalUsage,
        averageWeight: activeCombinations > 0 ? totalWeight / activeCombinations : 0,
        mostUsedCombination: mostUsedCount > 0 ? { hash: mostUsedHash, count: mostUsedCount } : undefined
      };

    } catch (error) {
      logger.error('Failed to get combination stats', error);
      throw error;
    }
  }
}

export default CombinationService;