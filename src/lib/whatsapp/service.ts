// WhatsApp Business API Service
import { 
  WhatsAppTemplate, 
  OrderNotificationData, 
  buildWhatsAppTemplate,
  ORDER_PLACED_TEMPLATE,
  ORDER_SHIPPED_TEMPLATE,
  ORDER_PICKED_TEMPLATE,
  ORDER_OUT_FOR_DELIVERY_TEMPLATE,
  ORDER_DELIVERED_TEMPLATE
} from './templates';

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken?: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export class WhatsAppService {
  private config: WhatsAppConfig;
  private baseUrl = 'https://crm.marketingravan.com/api/meta/v19.0';

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  /**
   * Send a templated WhatsApp message
   */
  async sendTemplateMessage(
    to: string, // Phone number in international format (e.g., "919876543210")
    template: WhatsAppTemplate
  ): Promise<SendMessageResponse> {
    try {
      // Clean phone number (remove + and spaces)
      const cleanPhone = to.replace(/[\s+\-()]/g, '');
      
      const payload = {
        to: cleanPhone,
        recipient_type: "individual",
        type: "template",
        template: {
          language: {
            policy: "deterministic",
            code: template.language
          },
          name: template.name,
          components: template.components
        }
      };

      console.log(`[WhatsApp] Sending template ${template.name} to ${cleanPhone}`);
      console.log(`[WhatsApp] Payload:`, JSON.stringify(payload, null, 2));

      const response = await fetch(
        `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        console.error(`[WhatsApp] API Error:`, responseData);
        return {
          success: false,
          error: responseData.error?.message || 'WhatsApp API error',
          details: responseData
        };
      }

      console.log(`[WhatsApp] Message sent successfully:`, responseData);
      return {
        success: true,
        messageId: responseData.messages?.[0]?.id,
        details: responseData
      };

    } catch (error: any) {
      console.error(`[WhatsApp] Service error:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error
      };
    }
  }

  /**
   * Send order placed notification
   */
  async sendOrderPlacedNotification(
    phoneNumber: string,
    data: OrderNotificationData
  ): Promise<SendMessageResponse> {
    const template = buildWhatsAppTemplate(ORDER_PLACED_TEMPLATE, data);
    return this.sendTemplateMessage(phoneNumber, template);
  }

  /**
   * Send order shipped notification
   */
  async sendOrderShippedNotification(
    phoneNumber: string,
    data: OrderNotificationData
  ): Promise<SendMessageResponse> {
    const template = buildWhatsAppTemplate(ORDER_SHIPPED_TEMPLATE, data);
    return this.sendTemplateMessage(phoneNumber, template);
  }

  /**
   * Send order picked notification
   */
  async sendOrderPickedNotification(
    phoneNumber: string,
    data: OrderNotificationData
  ): Promise<SendMessageResponse> {
    const template = buildWhatsAppTemplate(ORDER_PICKED_TEMPLATE, data);
    return this.sendTemplateMessage(phoneNumber, template);
  }

  /**
   * Send out for delivery notification
   */
  async sendOutForDeliveryNotification(
    phoneNumber: string,
    data: OrderNotificationData
  ): Promise<SendMessageResponse> {
    const template = buildWhatsAppTemplate(ORDER_OUT_FOR_DELIVERY_TEMPLATE, data);
    return this.sendTemplateMessage(phoneNumber, template);
  }

  /**
   * Send order delivered notification
   */
  async sendOrderDeliveredNotification(
    phoneNumber: string,
    data: OrderNotificationData
  ): Promise<SendMessageResponse> {
    const template = buildWhatsAppTemplate(ORDER_DELIVERED_TEMPLATE, data);
    return this.sendTemplateMessage(phoneNumber, template);
  }

  /**
   * Send text message (for testing - requires approved template)
   */
  async sendTextMessage(
    to: string,
    message: string
  ): Promise<SendMessageResponse> {
    try {
      const cleanPhone = to.replace(/[\s+\-()]/g, '');
      
      const payload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: {
          body: message
        }
      };

      const response = await fetch(
        `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: responseData.error?.message || 'WhatsApp API error',
          details: responseData
        };
      }

      return {
        success: true,
        messageId: responseData.messages?.[0]?.id,
        details: responseData
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error
      };
    }
  }

  /**
   * Verify webhook signature (for webhook security)
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    appSecret: string
  ): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  }
}

// Factory function to create WhatsApp service instance
export function createWhatsAppService(): WhatsAppService | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !phoneNumberId || !businessAccountId) {
    console.warn('[WhatsApp] Missing required environment variables');
    return null;
  }

  return new WhatsAppService({
    accessToken,
    phoneNumberId,
    businessAccountId,
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  });
}

// Utility function to format phone number for WhatsApp
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 0, replace with country code (assuming India +91)
  if (cleaned.startsWith('0')) {
    cleaned = '91' + cleaned.substring(1);
  }
  
  // If it doesn't start with country code, add India code
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  return cleaned;
}