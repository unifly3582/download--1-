
import { z } from "zod";

export const CourierIntegrationSchema = z.object({
  courierId: z.string(),
  name: z.string(),
  integrationType: z.enum(["api", "manual"]),
  api: z.object({
    baseUrl: z.string().url().optional(),
    authKey: z.string().optional(),
    bookingEndpoint: z.string().optional(),
    trackingEndpoint: z.string().optional(),
    webhookEnabled: z.boolean().optional()
  }).optional(),
  supportedFeatures: z.object({
    autoBooking: z.boolean(),
    autoTracking: z.boolean(),
    manualEntry: z.boolean()
  })
});

export type CourierIntegration = z.infer<typeof CourierIntegrationSchema>;
