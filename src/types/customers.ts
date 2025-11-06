
import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";

// Helper for Firestore Timestamps
const FirestoreTimestampSchema = z.custom<Timestamp>(val => val instanceof Timestamp)
  .transform(ts => ts.toDate().toISOString())
  .or(z.string().datetime()); // Allow already serialized strings

const AddressSchema = z.object({
  label: z.string().optional(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string(),
});

export const CustomerSchema = z.object({
  customerId: z.string(),
  phone: z.string().transform((val) => {
    if (val.startsWith('+91')) return val;
    return `+91${val}`;
  }).pipe(z.string().regex(/^\+91\d{10}$/, "Phone number must be in the format +91XXXXXXXXXX")),
  name: z.string(),
  email: z.string().email().optional(),
  preferredLanguage: z.string().optional(),
  whatsappOptIn: z.boolean().default(false),
  createdAt: FirestoreTimestampSchema.optional(),
  updatedAt: FirestoreTimestampSchema.optional(),
  defaultAddress: AddressSchema.optional(),
  savedAddresses: z.array(AddressSchema).optional(),
  preferredCourier: z.string().optional(),
  region: z.string().optional(),
  isDubious: z.boolean().default(false),
  trustScore: z.number().min(0).max(100).default(50),
  loyaltyTier: z.enum(["new", "repeat", "gold", "platinum"]).default("new"),
  totalOrders: z.number().default(0),
  totalSpent: z.number().default(0),
  lastOrderAt: FirestoreTimestampSchema.optional(),
  avgOrderValue: z.number().default(0),
  refundsCount: z.number().default(0),
  returnRate: z.number().default(0),
  blacklistReason: z.string().optional(),
  lastInteractionSource: z.enum(["whatsapp", "website", "ai_agent"]).optional(),
  lastInteractionAt: FirestoreTimestampSchema.optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  referralSource: z.string().optional(),
  inactiveSince: FirestoreTimestampSchema.optional(),
  customerSegment: z.enum(["Active", "Dormant", "At Risk"]).optional(),
  lifetimeValue: z.number().default(0),
  avgDeliveryTime: z.number().optional(),
  preferredProducts: z.array(z.string()).optional(),
  orderFrequencyDays: z.number().optional(),
  purchaseHistory: z.array(z.string()).optional(), // Added purchase history
});

export type Customer = z.infer<typeof CustomerSchema>;
