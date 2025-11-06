import { db } from "@/lib/firebase/server";
import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import type { 
  Coupon, 
  CouponUsage, 
  CouponValidation,
  CreateCoupon 
} from "@/types/coupon";
import type { OrderItem } from "@/types/order";

/**
 * Validates if a coupon can be applied to an order
 */
export async function validateCoupon(
  couponCode: string,
  customerId?: string,
  customerPhone?: string,
  orderValue?: number,
  items?: OrderItem[]
): Promise<CouponValidation> {
  try {
    // Get coupon by code
    const couponQuery = await db.collection('coupons')
      .where('code', '==', couponCode.toUpperCase())
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (couponQuery.empty) {
      return {
        isValid: false,
        error: 'Invalid coupon code'
      };
    }
    
    const couponDoc = couponQuery.docs[0];
    const coupon = couponDoc.data() as Coupon;
    
    // Check validity dates
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    
    if (now < validFrom) {
      return {
        isValid: false,
        error: 'Coupon is not yet active'
      };
    }
    
    if (now > validUntil) {
      return {
        isValid: false,
        error: 'Coupon has expired'
      };
    }
    
    // Check usage limits
    if (coupon.usageType === 'single_use' && coupon.currentUsageCount >= 1) {
      return {
        isValid: false,
        error: 'Coupon has already been used'
      };
    }
    
    if (coupon.usageType === 'multi_use' && coupon.maxUsageCount) {
      if (coupon.currentUsageCount >= coupon.maxUsageCount) {
        return {
          isValid: false,
          error: 'Coupon usage limit exceeded'
        };
      }
    }
    
    // Check user restrictions
    if (coupon.applicableUsers === 'specific_users') {
      const isUserAllowed = (customerId && coupon.specificUserIds?.includes(customerId)) ||
                           (customerPhone && coupon.specificPhones?.includes(customerPhone));
      
      if (!isUserAllowed) {
        return {
          isValid: false,
          error: 'This coupon is not applicable to your account'
        };
      }
    }
    
    // Check per-user usage limits
    if (coupon.maxUsagePerUser && (customerId || customerPhone)) {
      const userUsageQuery = db.collection('couponUsage')
        .where('couponId', '==', coupon.couponId);
      
      // Query by customerId or customerPhone
      if (customerId) {
        userUsageQuery.where('customerId', '==', customerId);
      } else if (customerPhone) {
        userUsageQuery.where('customerPhone', '==', customerPhone);
      }
      
      const userUsageSnapshot = await userUsageQuery.get();
      const userUsageCount = userUsageSnapshot.size;
      
      if (userUsageCount >= coupon.maxUsagePerUser) {
        return {
          isValid: false,
          error: `You have already used this coupon ${coupon.maxUsagePerUser} time(s). Usage limit per user exceeded.`
        };
      }
    }
    
    // Check if user is new (for new_users_only coupons)
    if (coupon.applicableUsers === 'new_users_only' && customerId) {
      const existingOrdersQuery = await db.collection('orders')
        .where('customerInfo.customerId', '==', customerId)
        .limit(1)
        .get();
      
      if (!existingOrdersQuery.empty) {
        return {
          isValid: false,
          error: 'This coupon is only for new customers'
        };
      }
    }
    
    // Check minimum order value
    if (coupon.minimumOrderValue && orderValue && orderValue < coupon.minimumOrderValue) {
      return {
        isValid: false,
        error: `Minimum order value of ₹${coupon.minimumOrderValue} required`
      };
    }
    
    // Check product restrictions
    if (coupon.applicableProducts && items) {
      const applicableItems = items.filter(item => 
        coupon.applicableProducts!.includes(item.productId)
      );
      
      if (applicableItems.length === 0) {
        return {
          isValid: false,
          error: 'This coupon is not applicable to items in your cart'
        };
      }
    }
    
    // Check excluded products
    if (coupon.excludedProducts && items) {
      const hasExcludedItems = items.some(item => 
        coupon.excludedProducts!.includes(item.productId)
      );
      
      if (hasExcludedItems) {
        return {
          isValid: false,
          error: 'This coupon cannot be applied to some items in your cart'
        };
      }
    }
    
    // Check if user has already used this coupon (for single_use coupons)
    if (coupon.usageType === 'single_use' && (customerId || customerPhone)) {
      const usageQuery = db.collection('couponUsage')
        .where('couponId', '==', coupon.couponId);
      
      if (customerId) {
        usageQuery.where('customerId', '==', customerId);
      } else if (customerPhone) {
        usageQuery.where('customerPhone', '==', customerPhone);
      }
      
      const usageSnapshot = await usageQuery.limit(1).get();
      
      if (!usageSnapshot.empty) {
        return {
          isValid: false,
          error: 'You have already used this coupon'
        };
      }
    }
    
    return {
      isValid: true,
      couponDetails: coupon
    };
    
  } catch (error) {
    console.error('[COUPON_VALIDATION] Error:', error);
    return {
      isValid: false,
      error: 'Unable to validate coupon. Please try again.'
    };
  }
}

/**
 * Calculates discount amount based on coupon
 */
export function calculateDiscount(
  coupon: Coupon,
  orderValue: number,
  items?: OrderItem[]
): number {
  let discountAmount = 0;
  
  // Calculate applicable order value (if product restrictions exist)
  let applicableValue = orderValue;
  
  if (coupon.applicableProducts && items) {
    applicableValue = items
      .filter(item => coupon.applicableProducts!.includes(item.productId))
      .reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }
  
  switch (coupon.type) {
    case 'percentage':
      discountAmount = (applicableValue * coupon.value) / 100;
      break;
      
    case 'fixed_amount':
      discountAmount = Math.min(coupon.value, applicableValue);
      break;
      
    case 'free_shipping':
      // This will be handled in shipping calculation
      discountAmount = 0;
      break;
  }
  
  // Apply maximum discount limit
  if (coupon.maximumDiscountAmount) {
    discountAmount = Math.min(discountAmount, coupon.maximumDiscountAmount);
  }
  
  return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
}

/**
 * Records coupon usage
 */
export async function recordCouponUsage(
  couponId: string,
  couponCode: string,
  orderId: string,
  customerId: string,
  customerPhone: string,
  discountAmount: number,
  orderValue: number
): Promise<void> {
  try {
    const usageId = uuidv4();
    
    // Record usage
    const usage: CouponUsage = {
      usageId,
      couponId,
      couponCode,
      orderId,
      customerId,
      customerPhone,
      discountAmount,
      orderValue,
      usedAt: new Date().toISOString()
    };
    
    // Use batch to ensure atomicity
    const batch = db.batch();
    
    // Add usage record
    const usageRef = db.collection('couponUsage').doc(usageId);
    batch.set(usageRef, usage);
    
    // Update coupon usage count
    const couponRef = db.collection('coupons').doc(couponId);
    batch.update(couponRef, {
      currentUsageCount: admin.firestore.FieldValue.increment(1),
      updatedAt: new Date().toISOString()
    });
    
    await batch.commit();
    
    console.log(`[COUPON_USAGE] Recorded usage: ${couponCode} for order ${orderId}`);
    
  } catch (error) {
    console.error('[COUPON_USAGE] Error recording usage:', error);
    throw error;
  }
}

/**
 * Creates a new coupon
 */
export async function createCoupon(
  couponData: CreateCoupon,
  createdBy: string
): Promise<string> {
  try {
    const couponId = uuidv4();
    const now = new Date().toISOString();
    
    // Check if coupon code already exists
    const existingCoupon = await db.collection('coupons')
      .where('code', '==', couponData.code.toUpperCase())
      .limit(1)
      .get();
    
    if (!existingCoupon.empty) {
      throw new Error('Coupon code already exists');
    }
    
    const coupon: Coupon = {
      ...couponData,
      couponId,
      code: couponData.code.toUpperCase(),
      currentUsageCount: 0,
      createdBy,
      createdAt: now,
      updatedAt: now
    };
    
    await db.collection('coupons').doc(couponId).set(coupon);
    
    console.log(`[COUPON_CREATE] Created coupon: ${coupon.code} by ${createdBy}`);
    
    return couponId;
    
  } catch (error) {
    console.error('[COUPON_CREATE] Error:', error);
    throw error;
  }
}

/**
 * Gets coupon usage statistics
 */
export async function getCouponStats(couponId: string): Promise<{
  totalUsage: number;
  totalDiscount: number;
  uniqueUsers: number;
  recentUsage: CouponUsage[];
}> {
  try {
    const usageQuery = await db.collection('couponUsage')
      .where('couponId', '==', couponId)
      .orderBy('usedAt', 'desc')
      .get();
    
    const usageRecords = usageQuery.docs.map(doc => doc.data() as CouponUsage);
    
    const totalUsage = usageRecords.length;
    const totalDiscount = usageRecords.reduce((sum, usage) => sum + usage.discountAmount, 0);
    const uniqueUsers = new Set(usageRecords.map(usage => usage.customerId)).size;
    const recentUsage = usageRecords.slice(0, 10); // Last 10 uses
    
    return {
      totalUsage,
      totalDiscount,
      uniqueUsers,
      recentUsage
    };
    
  } catch (error) {
    console.error('[COUPON_STATS] Error:', error);
    throw error;
  }
}