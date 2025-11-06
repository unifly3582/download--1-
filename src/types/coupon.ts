import { z } from "zod";

// Traffic Source Schema
export const TrafficSourceSchema = z.object({
  source: z.enum([
    "direct", "google_search", "google_ads", "meta_ads", 
    "instagram", "facebook", "youtube", "email", "sms", 
    "referral", "organic_social", "other"
  ]),
  medium: z.string().optional(), // "cpc", "organic", "social", "email"
  campaign: z.string().optional(), // Campaign name
  referrer: z.string().url().optional(), // Full referrer URL
  utmSource: z.string().optional(), // UTM parameters
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  landingPage: z.string().url().optional(), // First page visited
  sessionId: z.string().optional() // Track user session
});

// Coupon Schema
export const CouponSchema = z.object({
  couponId: z.string(),
  code: z.string().min(3).max(20), // "SAVE20", "WELCOME10"
  
  // Coupon Type
  type: z.enum(["percentage", "fixed_amount", "free_shipping"]),
  value: z.number().min(0), // 20 (for 20% off) or 100 (for ₹100 off)
  
  // Usage Limits
  usageType: z.enum(["single_use", "multi_use", "unlimited"]),
  maxUsageCount: z.number().min(1).optional(), // For multi_use coupons
  currentUsageCount: z.number().min(0).default(0),
  maxUsagePerUser: z.number().min(1).optional(), // Max times each user can use this coupon
  
  // User Restrictions
  applicableUsers: z.enum(["all", "specific_users", "new_users_only"]),
  specificUserIds: z.array(z.string()).optional(),
  specificPhones: z.array(z.string()).optional(),
  
  // Order Restrictions
  minimumOrderValue: z.number().min(0).optional(),
  maximumDiscountAmount: z.number().min(0).optional(),
  applicableProducts: z.array(z.string()).optional(), // Product IDs
  excludedProducts: z.array(z.string()).optional(), // Excluded Product IDs
  
  // Validity
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  isActive: z.boolean().default(true),
  
  // Metadata
  createdBy: z.string(),
  description: z.string().optional(),
  internalNotes: z.string().optional(), // Admin notes
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// Coupon Usage Tracking
export const CouponUsageSchema = z.object({
  usageId: z.string(),
  couponId: z.string(),
  couponCode: z.string(),
  orderId: z.string(),
  customerId: z.string(),
  customerPhone: z.string(),
  discountAmount: z.number(),
  orderValue: z.number(),
  usedAt: z.string().datetime()
});

// Create Coupon Schema (for admin)
export const CreateCouponSchema = CouponSchema.omit({
  couponId: true,
  currentUsageCount: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true
});

// Coupon Validation Response
export const CouponValidationSchema = z.object({
  isValid: z.boolean(),
  discountAmount: z.number().optional(),
  error: z.string().optional(),
  couponDetails: CouponSchema.optional()
});

export type TrafficSource = z.infer<typeof TrafficSourceSchema>;
export type Coupon = z.infer<typeof CouponSchema>;
export type CouponUsage = z.infer<typeof CouponUsageSchema>;
export type CreateCoupon = z.infer<typeof CreateCouponSchema>;
export type CouponValidation = z.infer<typeof CouponValidationSchema>;