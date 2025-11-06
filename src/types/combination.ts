
import { z } from "zod";

export const VerifiedCombinationSchema = z.object({
  combinationId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number()
  })),
  verifiedDimensions: z.object({
    length: z.number(),
    width: z.number(),
    height: z.number(),
    unit: z.string()
  }),
  verifiedWeight: z.number(),
  verifiedBy: z.string(),
  verifiedAt: z.string()
});

export type VerifiedCombination = z.infer<typeof VerifiedCombinationSchema>;
