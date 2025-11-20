import { z } from "zod";

// Issue Types
export const IssueTypeEnum = z.enum([
  "missing_items",
  "damaged_product",
  "wrong_item",
  "address_issue",
  "delivery_delay",
  "customer_unavailable",
  "payment_issue",
  "quality_complaint",
  "return_request",
  "courier_problem",
  "other"
]);

// Priority Levels
export const IssuePriorityEnum = z.enum([
  "low",
  "medium",
  "high",
  "critical"
]);

// Issue Status
export const IssueStatusEnum = z.enum([
  "open",
  "in_progress",
  "resolved",
  "closed",
  "reopened"
]);

// Issue Update Schema
export const IssueUpdateSchema = z.object({
  updateId: z.string(),
  timestamp: z.string().datetime(),
  updatedBy: z.string(),
  actionTaken: z.string(),
  customerResponse: z.string().optional(),
  statusChange: z.string().optional(),
  notes: z.string().optional()
});

// Main Issue Schema
export const IssueSchema = z.object({
  issueId: z.string(),
  orderId: z.string(),
  
  // Issue Details
  issueType: IssueTypeEnum,
  issueReason: z.string(),
  issueDescription: z.string(),
  priority: IssuePriorityEnum,
  
  // Status & Lifecycle
  status: IssueStatusEnum,
  createdAt: z.string().datetime(),
  createdBy: z.string(),
  updatedAt: z.string().datetime(),
  updatedBy: z.string(),
  closedAt: z.string().datetime().optional(),
  closedBy: z.string().optional(),
  
  // Updates History
  updates: z.array(IssueUpdateSchema).default([]),
  
  // Resolution
  resolution: z.string().optional(),
  resolutionNotes: z.string().optional(),
  
  // Metadata
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).default([])
});

// Create Issue Schema (for API)
export const CreateIssueSchema = z.object({
  orderId: z.string(),
  issueType: IssueTypeEnum,
  issueReason: z.string().min(5, "Reason must be at least 5 characters"),
  issueDescription: z.string().min(10, "Description must be at least 10 characters"),
  priority: IssuePriorityEnum,
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// Add Update Schema (for API)
export const AddIssueUpdateSchema = z.object({
  actionTaken: z.string().min(5, "Action must be at least 5 characters"),
  customerResponse: z.string().optional(),
  statusChange: IssueStatusEnum.optional(),
  notes: z.string().optional()
});

// Close Issue Schema (for API)
export const CloseIssueSchema = z.object({
  resolution: z.string().min(10, "Resolution must be at least 10 characters"),
  resolutionNotes: z.string().optional()
});

// Type exports
export type Issue = z.infer<typeof IssueSchema>;
export type IssueUpdate = z.infer<typeof IssueUpdateSchema>;
export type CreateIssue = z.infer<typeof CreateIssueSchema>;
export type AddIssueUpdate = z.infer<typeof AddIssueUpdateSchema>;
export type CloseIssue = z.infer<typeof CloseIssueSchema>;
export type IssueType = z.infer<typeof IssueTypeEnum>;
export type IssuePriority = z.infer<typeof IssuePriorityEnum>;
export type IssueStatus = z.infer<typeof IssueStatusEnum>;
