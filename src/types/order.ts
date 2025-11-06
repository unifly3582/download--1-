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
});

export const PricingInfoSchema = z.object({
  subtotal: z.number(),
  discount: z.number().default(0), // Add discount field
  shippingCharges: z.number().default(0),
  codCharges: z.number().default(0),
  taxes: z.number().default(0),
  grandTotal: z.number()
});

export const PaymentInfoSchema = z.object({
    method: z.enum(["COD", "Prepaid"]),
    status: z.enum(["Pending", "Completed", "Failed", "Refunded"]).default("Pending"),
    transactionId: z.string().optional(),
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
  
  // Action log for pending orders
  actionLog: z.array(z.object({
    actionId: z.string(),
    timestamp: z.string().datetime(),
    actionBy: z.string(),
    action: z.string(),
    result: z.enum(["success", "failed", "pending"]),
    nextAction: z.string().optional(),
    notes: z.string().optional()
  })).optional(),
  
  apiRequest: z.any().optional(),
  apiResponse: z.any().optional(),
  error: z.string().optional(),
});

const CustomerInfoSchema = z.object({
    customerId: z.string(),
    name: z.string(),
    phone: z.string(),
    email: z.string().email().optional()
  });


export const OrderSchema = z.object({
  orderId: z.string(),
  orderSource: z.enum(["admin_form", "ai_agent", "customer_app"]),
  
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
  shipmentInfo: ShipmentInfoSchema,
  internalStatus: z.enum([
    "created_pending", "approved", "ready_for_shipping",
    "shipped", "in_transit", "pending", "delivered",
    "return_initiated", "returned", "cancelled", "needs_manual_verification"
  ]),
  
  // Customer-facing fields
  customerFacingStatus: z.enum([
    "confirmed", "processing", "shipped", "out_for_delivery", 
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
  orderSource: z.enum(["admin_form", "ai_agent", "customer_app"]),
  
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
  })
});

export type CustomerCreateOrder = z.infer<typeof CustomerCreateOrderSchema>;