import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";
import { TrafficSourceSchema } from "./coupon";

const TimestampSchema = z.union([
    z.custom<Timestamp>(val => val instanceof Timestamp),
    z.string().datetime(),
]);

export const OrderItemSchema = z.object({
  productId: z.string(),
  variationId: z.string().nullish(),
  productName: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  sku: z.string(),
  hsnCode: z.string().optional(),
  taxRate: z.number().optional(),
  weight: z.number().optional(),
  dimensions: z.object({
    l: z.number(),
    b: z.number(),
    h: z.number(),
  }).optional(),
  totalPrice: z.number().optional(), // Legacy field from old orders
  isQuickShipItem: z.boolean().optional(), // Flag for quick ship custom items
});

export const PricingInfoSchema = z.object({
  subtotal: z.number(),
  discount: z.number().default(0), // Coupon discount
  shippingCharges: z.number().default(0),
  codCharges: z.number().default(0),
  prepaidDiscount: z.number().default(0), // Prepaid discount from checkout settings
  taxes: z.number().default(0),
  grandTotal: z.number()
});

export const PaymentInfoSchema = z.object({
    method: z.enum(["COD", "Prepaid"]),
    status: z.enum(["Pending", "Completed", "Failed", "Refunded"]).default("Pending"),
    transactionId: z.string().optional(),
    razorpayOrderId: z.string().optional(),
    
    // Payment failure tracking
    failureReason: z.string().optional(),
    errorCode: z.string().optional(),
    lastFailedPaymentId: z.string().optional(),
    
    // Payment authorization tracking
    authorizedPaymentId: z.string().optional(),
    authorizationStatus: z.string().optional(),
    
    // Payment capture tracking
    capturedPaymentId: z.string().optional(),
    capturedAmount: z.number().optional(),
    captureStatus: z.string().optional(),
    
    // Refund tracking
    refundId: z.string().optional(),
    refundAmount: z.number().optional(),
    refundStatus: z.enum(["initiated", "completed"]).optional(),
    refundCompletedAt: TimestampSchema.optional(),
});

export const ApprovalInfoSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  approvedBy: z.string().optional(),
  approvedAt: TimestampSchema.optional(),
  autoApprovalMetadata: z.object({
    rulesMatched: z.array(z.string()).optional(),
    requiresManualReview: z.boolean().optional()
  }).optional()
});

// Action log entry schema for tracking all order-related actions
export const ActionLogEntrySchema = z.object({
  actionId: z.string(),
  timestamp: z.string().datetime(),
  actionBy: z.string(), // Admin user who took the action
  actionType: z.enum([
    "call_placed",
    "call_attempted",
    "whatsapp_sent",
    "email_sent",
    "sms_sent",
    "ticket_raised",
    "address_verified",
    "address_updated",
    "payment_verified",
    "payment_issue",
    "refund_initiated",
    "courier_contacted",
    "shipment_delayed",
    "delivery_rescheduled",
    "customer_complaint",
    "quality_issue",
    "return_requested",
    "replacement_sent",
    "follow_up",
    "internal_note",
    "other"
  ]),
  actionDetails: z.string(), // What exactly was done
  customerResponse: z.string().optional(), // What the customer said/did
  outcome: z.enum(["resolved", "pending", "escalated", "no_response"]),
  nextAction: z.string().optional(), // What needs to be done next
  nextActionBy: z.string().datetime().optional(), // When to follow up
  notes: z.string().optional() // Additional notes
});

export const ShipmentInfoSchema = z.object({
  courierPartner: z.string().optional(),
  awb: z.string().optional(),
  trackingUrl: z.string().url().optional(),
  shipmentMode: z.enum(["manual", "auto_api"]).optional(),
  currentTrackingStatus: z.string().optional(),
  
  // Enhanced tracking fields
  lastTrackedAt: z.string().datetime().optional(),
  trackingLocation: z.string().optional(),
  trackingInstructions: z.string().optional(),
  trackingDisabledReason: z.string().optional(),
  shippedAt: z.string().datetime().optional(),
  
  // Essential metadata (optimized storage)
  pickupLocation: z.string().optional(),
  uploadWbn: z.string().optional(),  // Delhivery upload batch ID
  
  // Action log for all orders - tracks all customer interactions and internal actions
  actionLog: z.array(ActionLogEntrySchema).optional(),
  
  // Legacy fields (kept for backward compatibility with old orders)
  apiRequest: z.any().optional(),
  apiResponse: z.any().optional(),
  
  // Error tracking
  error: z.string().optional(),
  errorDetails: z.string().optional(),
});

const CustomerInfoSchema = z.object({
    customerId: z.string(),
    name: z.string().min(2, "Customer name must be at least 2 characters long").trim(),
    phone: z.string(),
    email: z.string().email().optional()
  });


const CancellationInfoSchema = z.object({
  cancelledBy: z.string(),
  cancelledAt: TimestampSchema,
  cancelledByRole: z.enum(["admin", "customer"]).optional(),
  reason: z.string().optional()
}).optional();

export const OrderSchema = z.object({
  orderId: z.string(),
  orderSource: z.enum(["admin_form", "ai_agent", "customer_app", "admin_quick_ship"]),
  
  // Traffic Source Tracking
  trafficSource: TrafficSourceSchema.optional(),
  
  // Coupon Information
  couponCode: z.string().optional(),
  couponDetails: z.object({
    couponId: z.string(),
    discountAmount: z.number(),
    couponType: z.enum(["percentage", "fixed_amount", "free_shipping"])
  }).optional(),
  customerInfo: CustomerInfoSchema,
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string()
  }),
  items: z.array(OrderItemSchema).min(1, { message: "Order must have at least one item." }),
  pricingInfo: PricingInfoSchema,
  paymentInfo: PaymentInfoSchema,
  approval: ApprovalInfoSchema,
  cancellation: CancellationInfoSchema,
  shipmentInfo: ShipmentInfoSchema,
  internalStatus: z.enum([
    "payment_pending", "created_pending", "approved", "ready_for_shipping",
    "shipped", "in_transit", "pending", "delivered",
    "return_initiated", "returned", "cancelled", "needs_manual_verification"
  ]),
  
  // Customer-facing fields
  customerFacingStatus: z.enum([
    "payment_pending", "confirmed", "processing", "shipped", "out_for_delivery", 
    "delivered", "cancelled", "returned"
  ]).optional(),
  
  // Tracking flag for efficient queries
  needsTracking: z.boolean().default(false),
  
  // Delivery estimates
  deliveryEstimate: z.object({
    expectedDate: z.string().datetime(),
    earliestDate: z.string().datetime().optional(),
    latestDate: z.string().datetime().optional(),
    timeSlot: z.enum(["morning", "afternoon", "evening", "full_day"]).optional(),
    confidence: z.enum(["high", "medium", "low"]).optional()
  }).optional(),
  
  // Customer communication
  customerNotifications: z.object({
    lastNotificationSent: z.string().datetime().optional(),
    notificationPreferences: z.object({
      sms: z.boolean().default(true),
      whatsapp: z.boolean().default(true),
      email: z.boolean().default(false)
    }).optional()
  }).optional(),
  
  // Notification history for tracking
  notificationHistory: z.object({
    lastNotifiedStatus: z.string().optional(),
    lastNotifiedAt: z.string().datetime().optional()
  }).optional(),
  
  weight: z.number().nullable().optional(),
  dimensions: z.object({
    l: z.number(),
    b: z.number(),
    h: z.number(),
  }).nullable().optional(),
  needsManualWeightAndDimensions: z.boolean().default(false),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema
});

// Schema for creating an order, now with an option for admin-provided pricing.
export const CreateOrderSchema = z.object({
  orderSource: z.enum(["admin_form", "ai_agent", "customer_app", "admin_quick_ship"]),
  
  // Traffic Source Tracking
  trafficSource: TrafficSourceSchema.optional(),
  
  // Coupon Code
  couponCode: z.string().optional(),
  customerInfo: CustomerInfoSchema.omit({ customerId: true }).extend({
    customerId: z.string().optional(),
  }),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string()
  }),
  items: z.array(OrderItemSchema).min(1),
  paymentInfo: PaymentInfoSchema.omit({ status: true }),
  manualPricingInfo: PricingInfoSchema.optional(), // <-- ADDED: For admin price overrides
});


export type Order = z.infer<typeof OrderSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type ActionLogEntry = z.infer<typeof ActionLogEntrySchema>;

// Customer-facing order schema
export const CustomerOrderSchema = z.object({
  orderId: z.string(),
  customerId: z.string(),
  customerPhone: z.string(),
  
  // Order summary
  orderDate: z.string().datetime(),
  orderStatus: z.enum([
    "confirmed", "processing", "shipped", "out_for_delivery",
    "delivered", "cancelled", "returned"
  ]),
  
  // Items (simplified for customer)
  items: z.array(z.object({
    productName: z.string(),
    quantity: z.number(),
    sku: z.string(),
    image: z.string().url().optional()
  })),
  
  // Customer-relevant pricing
  totalAmount: z.number(),
  paymentMethod: z.enum(["COD", "Prepaid"]),
  
  // Shipping details
  shippingAddress: z.object({
    name: z.string(),
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string()
  }),
  
  // Tracking information
  tracking: z.object({
    courierPartner: z.string().optional(),
    awb: z.string().optional(),
    trackingUrl: z.string().url().optional(),
    
    // Current status
    currentStatus: z.string().optional(),
    currentLocation: z.string().optional(),
    lastUpdate: z.string().datetime().optional(),
    
    // Delivery information
    expectedDeliveryDate: z.string().datetime().optional(),
    deliveryTimeSlot: z.string().optional(),
    
    // Customer-friendly tracking events
    trackingEvents: z.array(z.object({
      timestamp: z.string().datetime(),
      status: z.string(),
      description: z.string(),
      location: z.string().optional()
    })).optional()
  }).optional(),
  
  // Cancellation information (if cancelled)
  cancellation: z.object({
    cancelledAt: z.string().datetime(),
    cancelledByRole: z.enum(["admin", "customer"]),
    reason: z.string().optional()
  }).optional(),
  
  // Support information
  supportInfo: z.object({
    canCancel: z.boolean().default(false),
    canReturn: z.boolean().default(true),
    returnWindowDays: z.number().default(7),
    supportPhone: z.string().optional(),
    supportEmail: z.string().optional()
  }).optional(),
  
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type CustomerOrder = z.infer<typeof CustomerOrderSchema>;

// Customer-facing order creation schema (no auth required)
export const CustomerCreateOrderSchema = z.object({
  orderSource: z.literal("customer_app"),
  
  // Traffic Source Tracking (captured by frontend)
  trafficSource: TrafficSourceSchema.optional(),
  
  // Coupon Code
  couponCode: z.string().optional(),
  
  // Customer Info (no customerId required)
  customerInfo: z.object({
    name: z.string().min(2),
    phone: z.string().min(10).max(15),
    email: z.string().email().optional()
  }),
  
  // Shipping Address
  shippingAddress: z.object({
    street: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    zip: z.string().min(6).max(6),
    country: z.string().default("India")
  }),
  
  // Order Items
  items: z.array(z.object({
    productId: z.string(),
    variationId: z.string().optional(),
    quantity: z.number().min(1),
    sku: z.string()
  })).min(1),
  
  // Payment Method
  paymentInfo: z.object({
    method: z.enum(["COD", "Prepaid"])
  }),
  
  // Pricing Info (calculated on frontend using checkout settings)
  pricingInfo: z.object({
    shippingCharges: z.number().optional(),
    codCharges: z.number().optional(),
    prepaidDiscount: z.number().optional(),
    taxes: z.number().optional()
  }).optional()
});

export type CustomerCreateOrder = z.infer<typeof CustomerCreateOrderSchema>;