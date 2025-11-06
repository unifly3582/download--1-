# WhatsApp Business API Setup Guide

This guide will help you set up WhatsApp Business API for sending order notifications.

## 1. WhatsApp Business API Setup

### Step 1: Create Meta Business Account
1. Go to [Meta Business](https://business.facebook.com/)
2. Create a business account if you don't have one
3. Verify your business

### Step 2: Set up WhatsApp Business API
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app and select "Business" type
3. Add WhatsApp product to your app
4. Follow the setup wizard

### Step 3: Get Required Credentials
You'll need these values for your environment variables:

- **Access Token**: From your app dashboard
- **Phone Number ID**: From WhatsApp > Getting Started
- **Business Account ID**: From WhatsApp > Getting Started
- **Webhook Verify Token**: Create your own secure token

## 2. Message Templates Creation

WhatsApp requires pre-approved templates for business messaging. Here are the templates you need to create:

### Template 1: Order Placed Confirmation
```
Name: order_placed_confirmation
Category: TRANSACTIONAL
Language: English (en)

Header: Hi {{1}}! 🎉

Body: Your order {{1}} has been confirmed for ₹{{2}}.

Items: {{3}}

We'll notify you once it's shipped. Thank you for choosing us!

Footer: Buggly Farms
```

### Template 2: Order Shipped Notification
```
Name: order_shipped_notification
Category: TRANSACTIONAL
Language: English (en)

Header: Hi {{1}}! 📦

Body: Great news! Your order {{1}} has been shipped.

📋 AWB: {{2}}
🚚 Courier: {{3}}
📅 Expected Delivery: {{4}}

Button: Track Order [{{1}}]

Footer: Buggly Farms
```

### Template 3: Order Picked Notification
```
Name: order_picked_notification
Category: TRANSACTIONAL
Language: English (en)

Header: Hi {{1}}! 🚛

Body: Your order {{1}} (AWB: {{2}}) has been picked up by {{3}} and is on its way to you!

Footer: Buggly Farms
```

### Template 4: Out for Delivery
```
Name: order_out_for_delivery
Category: TRANSACTIONAL
Language: English (en)

Header: Hi {{1}}! 🚚

Body: Your order {{1}} (AWB: {{2}}) is out for delivery from {{3}}.

Expected delivery: {{4}}

Please be available to receive your package.

Footer: Buggly Farms
```

### Template 5: Order Delivered
```
Name: order_delivered_notification
Category: TRANSACTIONAL
Language: English (en)

Header: Hi {{1}}! ✅

Body: Your order {{1}} (AWB: {{2}}) has been successfully delivered!

Thank you for shopping with us. We hope you love your purchase!

Footer: Buggly Farms
```

## 3. Template Creation Steps

1. Go to your WhatsApp Business Manager
2. Navigate to Account Tools > Message Templates
3. Click "Create Template"
4. Fill in the template details as shown above
5. Submit for approval (usually takes 24-48 hours)

## 4. Environment Variables Setup

Add these to your `.env.local` file:

```env
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=your_access_token_from_meta_app_dashboard
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_from_whatsapp_setup
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_custom_secure_token
```

## 5. Testing Setup

### Add Test Numbers
1. In your Meta app dashboard, go to WhatsApp > Getting Started
2. Add test phone numbers (including your own)
3. These numbers can receive messages without approval

### Test the Integration
1. Navigate to `/whatsapp-test` in your admin dashboard
2. Enter a test phone number (must be added to your WhatsApp Business account)
3. Select a notification type
4. Click "Send Template Message"

## 6. Phone Number Format

The system automatically formats phone numbers, but ensure they include country code:
- ✅ Good: `919876543210`, `+91 98765 43210`, `91-9876543210`
- ❌ Bad: `9876543210` (missing country code)

## 7. Webhook Setup (Optional)

For delivery status and message status updates:

1. Set up a webhook endpoint: `/api/webhooks/whatsapp`
2. Configure webhook URL in Meta app dashboard
3. Use your `WHATSAPP_WEBHOOK_VERIFY_TOKEN` for verification

## 8. Production Checklist

Before going live:

- [ ] All templates approved by Meta
- [ ] Phone number verified and approved for business use
- [ ] Environment variables configured
- [ ] Test messages working
- [ ] Webhook configured (if needed)
- [ ] Business verification completed

## 9. Integration with Order System

The notification system is automatically integrated with your order management:

- **Order Placed**: Triggered when order status changes to `approved`
- **Order Shipped**: Triggered when order status changes to `shipped`
- **Order Picked**: Triggered when tracking status includes "picked"
- **Out for Delivery**: Triggered when tracking status includes "out for delivery"
- **Order Delivered**: Triggered when order status changes to `delivered`

## 10. Monitoring and Logs

- Check notification logs in Firestore collection: `notification_logs`
- Monitor WhatsApp API usage in Meta Business Manager
- View message delivery status in WhatsApp Manager

## Troubleshooting

### Common Issues:

1. **Template not found**: Ensure template is approved and name matches exactly
2. **Phone number invalid**: Check format includes country code
3. **Access token expired**: Regenerate token in Meta app dashboard
4. **Rate limits**: WhatsApp has messaging limits, check your tier
5. **Template rejected**: Review Meta's template guidelines

### Support Resources:
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Help Center](https://www.facebook.com/business/help)
- [Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines)

## Next Steps

1. Set up your Meta Business account and WhatsApp API
2. Create and submit templates for approval
3. Configure environment variables
4. Test with the provided test interface
5. Monitor and optimize based on delivery rates

Once templates are approved and environment variables are set, the system will automatically send notifications based on order status changes!