import { z } from 'zod';

/**
 * Testimonial Schema
 * Represents a customer testimonial video from YouTube
 */
export const TestimonialSchema = z.object({
  id: z.string(),
  youtubeVideoId: z.string().min(1, 'YouTube Video ID is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerLocation: z.string().min(1, 'Customer location is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Testimonial = z.infer<typeof TestimonialSchema>;

/**
 * Create Testimonial Schema (without auto-generated fields)
 */
export const CreateTestimonialSchema = z.object({
  youtubeVideoId: z.string().min(1, 'YouTube Video ID is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerLocation: z.string().min(1, 'Customer location is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CreateTestimonial = z.infer<typeof CreateTestimonialSchema>;

/**
 * Update Testimonial Schema (partial, without auto-generated fields)
 */
export const UpdateTestimonialSchema = CreateTestimonialSchema.partial();

export type UpdateTestimonial = z.infer<typeof UpdateTestimonialSchema>;
