
import { z } from "zod";

export const AutoApprovalSettingSchema = z.object({
  settingId: z.string(),
  maxAutoApprovalValue: z.number(),
  minCustomerAgeDays: z.number(),
  allowNewCustomers: z.boolean(),
  requireVerifiedDimensions: z.boolean(),
  enableLearningMode: z.boolean()
});

export type AutoApprovalSetting = z.infer<typeof AutoApprovalSettingSchema>;
