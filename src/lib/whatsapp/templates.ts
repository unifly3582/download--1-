// WhatsApp Message Templates for Order Notifications
// These templates follow Meta WhatsApp Business API format

export interface WhatsAppTemplate {
  name: string;
  language: string;
  components: Array<{
    type: string;
    sub_type?: string;
    index?: number;
    parameters?: Array<{
      type: string;
      text?: string;
    }>;
  }>;
}

export interface OrderNotificationData {
  customerName: string;
  orderId: string;
  orderAmount: number;
  items: string; // Comma-separated item names
  paymentMethod?: string; // COD/Prepaid
  deliveryAddress?: string; // Full delivery address
  awbNumber?: string;
  trackingUrl?: string;
  courierPartner?: string;
  expectedDeliveryDate?: string;
  currentLocation?: string;
}

// Template 1: Order Placed Confirmation
// Using bugglysimple template (APPROVED)
// Template message: "Dear {{1}}, Your order has been successfully received (Order No: {{2}}). We will share your tracking ID as soon as your package is dispatched."
export const ORDER_PLACED_TEMPLATE: WhatsAppTemplate = {
  name: "bugglysimple",
  language: "en",
  components: [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: "{{1}}" // Customer Name
        },
        {
          type: "text",
          text: "{{2}}" // Order ID
        }
      ]
    }
  ]
};

// Template 2: Order Shipped (Updated for your actual template)
export const ORDER_SHIPPED_TEMPLATE: WhatsAppTemplate = {
  name: "buggly_order_shipped",
  language: "en",
  components: [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: "{{1}}" // Customer Name
        },
        {
          type: "text",
          text: "{{2}}" // Order ID
        },
        {
          type: "text",
          text: "{{3}}" // AWB Number
        },
        {
          type: "text",
          text: "{{4}}" // Total Amount
        },
        {
          type: "text",
          text: "{{5}}" // Payment Method
        }
      ]
    }
  ]
};

// Template 3: Order Picked Up
export const ORDER_PICKED_TEMPLATE: WhatsAppTemplate = {
  name: "order_picked_notification", 
  language: "en",
  components: [
    {
      type: "header",
      parameters: [
        {
          type: "text",
          text: "{{1}}" // Customer Name
        }
      ]
    },
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: "{{1}}" // Order ID
        },
        {
          type: "text",
          text: "{{2}}" // AWB Number
        },
        {
          type: "text",
          text: "{{3}}" // Courier Partner
        }
      ]
    }
  ]
};

// Template 4: Out for Delivery
// Template structure: Hi {{1}}! 🚚 Your order {{2}} is out for delivery today! 📦 AWB: {{3}} 📍 Current Location: {{4}}
export const ORDER_OUT_FOR_DELIVERY_TEMPLATE: WhatsAppTemplate = {
  name: "buggly_out_for_delivery",
  language: "en", 
  components: [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: "{{1}}" // Customer Name
        },
        {
          type: "text",
          text: "{{2}}" // Order ID
        },
        {
          type: "text",
          text: "{{3}}" // AWB Number
        },
        {
          type: "text",
          text: "{{4}}" // Current Location
        }
      ]
    }
  ]
};

// Template 5: Order Delivered
export const ORDER_DELIVERED_TEMPLATE: WhatsAppTemplate = {
  name: "order_delivered_notification",
  language: "en",
  components: [
    {
      type: "header", 
      parameters: [
        {
          type: "text",
          text: "{{1}}" // Customer Name
        }
      ]
    },
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: "{{1}}" // Order ID
        },
        {
          type: "text",
          text: "{{2}}" // AWB Number
        }
      ]
    }
  ]
};

// Template 6: Order Cancelled
// Template message: "Dear {{1}}, Your Buggly order (Order ID: {{2}}) has been cancelled. Please contact our customer care team on whatsapp for more information."
export const ORDER_CANCELLED_TEMPLATE: WhatsAppTemplate = {
  name: "order_cancelled",
  language: "en",
  components: [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: "{{1}}" // Customer Name
        },
        {
          type: "text",
          text: "{{2}}" // Order ID
        }
      ]
    }
  ]
};

// Template 7: OTP Authentication
// Template for customer login OTP
export const OTP_TEMPLATE: WhatsAppTemplate = {
  name: "otp",
  language: "en",
  components: [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: "{{1}}" // OTP Code
        }
      ]
    },
    {
      type: "button",
      sub_type: "url",
      index: 0,
      parameters: [
        {
          type: "text",
          text: "{{1}}" // OTP Code for URL
        }
      ]
    }
  ]
};

// Helper function to build template with actual data
export function buildWhatsAppTemplate(
  template: WhatsAppTemplate,
  data: OrderNotificationData
): WhatsAppTemplate {
  const filledTemplate = JSON.parse(JSON.stringify(template)); // Deep clone
  
  filledTemplate.components.forEach((component: any) => {
    if (component.parameters) {
      component.parameters.forEach((param: any) => {
        if (param.text) {
          // Replace placeholders with actual data
          switch (template.name) {
            case "bugglysimple":
              if (component.type === "body") {
                const bodyParams = [
                  data.customerName,                    // {{1}} Customer Name
                  data.orderId                          // {{2}} Order ID
                ];
                const paramIndex = component.parameters!.indexOf(param);
                param.text = bodyParams[paramIndex] || param.text;
              }
              break;
              
            case "buggly_order_shipped":
              if (component.type === "body") {
                const bodyParams = [
                  data.customerName,                    // {{1}} Customer Name
                  data.orderId,                        // {{2}} Order ID
                  data.awbNumber || "",                // {{3}} AWB Number
                  `${data.orderAmount}`,               // {{4}} Total Amount
                  data.paymentMethod || "COD"          // {{5}} Payment Method
                ];
                const paramIndex = component.parameters!.indexOf(param);
                param.text = bodyParams[paramIndex] || param.text;
              }
              break;
              
            case "order_picked_notification":
              if (component.type === "header") {
                param.text = data.customerName;
              } else if (component.type === "body") {
                const bodyParams = [
                  data.orderId,
                  data.awbNumber || "",
                  data.courierPartner || ""
                ];
                const paramIndex = component.parameters!.indexOf(param);
                param.text = bodyParams[paramIndex] || param.text;
              }
              break;
              
            case "buggly_out_for_delivery":
              if (component.type === "body") {
                const bodyParams = [
                  data.customerName,                    // {{1}} Customer Name
                  data.orderId,                        // {{2}} Order ID
                  data.awbNumber || "",                // {{3}} AWB Number
                  data.currentLocation || "Delhi Hub"  // {{4}} Current Location
                ];
                const paramIndex = component.parameters!.indexOf(param);
                param.text = bodyParams[paramIndex] || param.text;
              }
              break;
              
            case "order_delivered_notification":
              if (component.type === "header") {
                param.text = data.customerName;
              } else if (component.type === "body") {
                const bodyParams = [data.orderId, data.awbNumber || ""];
                const paramIndex = component.parameters!.indexOf(param);
                param.text = bodyParams[paramIndex] || param.text;
              }
              break;
              
            case "order_cancelled":
              if (component.type === "body") {
                const bodyParams = [
                  data.customerName,                    // {{1}} Customer Name
                  data.orderId                          // {{2}} Order ID
                ];
                const paramIndex = component.parameters!.indexOf(param);
                param.text = bodyParams[paramIndex] || param.text;
              }
              break;
          }
        }
      });
    }
  });
  
  return filledTemplate;
}

// Template message content for reference (what customers will see)
export const TEMPLATE_MESSAGES = {
  ORDER_PLACED: `Dear {{customerName}},
Your order has been successfully received (Order No: {{orderId}}).
We will share your tracking ID as soon as your package is dispatched.`,

  ORDER_SHIPPED: `Hi {{customerName}}! 📦

Great news! Your order {{orderId}} has been shipped.

📋 AWB: {{awbNumber}}
🚚 Courier: {{courierPartner}}
📅 Expected Delivery: {{expectedDeliveryDate}}

Track your order: {{trackingUrl}}`,

  ORDER_PICKED: `Hi {{customerName}}! 🚛

Your order {{orderId}} (AWB: {{awbNumber}}) has been picked up by {{courierPartner}} and is on its way to you!`,

  ORDER_OUT_FOR_DELIVERY: `Hi {{customerName}}! 🚚

Your order {{orderId}} (AWB: {{awbNumber}}) is out for delivery from {{currentLocation}}. 

Expected delivery: {{expectedDeliveryTime}}

Please be available to receive your package.`,

  ORDER_DELIVERED: `Hi {{customerName}}! ✅

Your order {{orderId}} (AWB: {{awbNumber}}) has been successfully delivered!

Thank you for shopping with us. We hope you love your purchase! 

Rate your experience: [link]`,

  ORDER_CANCELLED: `Dear {{customerName}},

Your Buggly order (Order ID: {{orderId}}) has been cancelled.

Please contact our customer care team on whatsapp for more information.`
};