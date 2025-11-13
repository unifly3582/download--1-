
import { z } from "zod";
import { OrderItemSchema } from "./order";

// Enhanced combination schema that matches our order system
export const VerifiedCombinationSchema = z.object({
  // Unique hash of the combination (MD5 of sorted SKUs and quantities)
  combinationHash: z.string(),
  
  // The actual items in this combination
  items: z.array(OrderItemSchema),
  
  // Verified total weight in grams
  weight: z.number().positive(),
  
  // Verified dimensions using our standard l/b/h format
  dimensions: z.object({
    l: z.number().positive(), // length in cm
    b: z.number().positive(), // breadth/width in cm  
    h: z.number().positive(), // height in cm
  }),
  
  // Metadata
  verifiedBy: z.string(), // User ID who verified this
  verifiedAt: z.date(),   // When it was verified
  updatedBy: z.string().optional(), // Last updated by
  updatedAt: z.date().optional(),   // Last updated at
  
  // Usage tracking
  usageCount: z.number().default(0), // How many times this combination was used
  lastUsedAt: z.date().optional(),   // When it was last used
  
  // Additional metadata
  notes: z.string().optional(), // Admin notes about this combination
  isActive: z.boolean().default(true), // Can be disabled if no longer valid
  
  // Calculated metrics (for efficiency)
  totalItems: z.number().positive(), // Total number of items
  uniqueProducts: z.number().positive(), // Number of unique products
});

export type VerifiedCombination = z.infer<typeof VerifiedCombinationSchema>;

// Schema for creating a new combination
export const CreateCombinationSchema = VerifiedCombinationSchema.omit({
  combinationHash: true,
  verifiedAt: true,
  updatedAt: true,
  usageCount: true,
  lastUsedAt: true,
  totalItems: true,
  uniqueProducts: true,
});

export type CreateCombination = z.infer<typeof CreateCombinationSchema>;
