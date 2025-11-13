// WhatsApp Message Templates for Order Notifications
// These templates follow Meta WhatsApp Business API format

export interface WhatsAppTemplate {
  name: string;
  language: string;
  components: Array<{
    type: string;
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
export const ORDER_OUT_FOR_DELIVERY_TEMPLATE: WhatsAppTemplate = {
  name: "buggly_out_for_delivery",
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
          text: "{{3}}" // Current Location
        },
        {
          type: "text",
          text: "{{4}}" // Expected Delivery Time
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
              if (component.type === "header") {
                // Header has no variables in this template
              } else if (component.type === "body") {
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
We will share your tracking ID as soon as your package is dispatched.

[View order button]`,

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

Rate your experience: [link]`
};