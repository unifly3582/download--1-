# Logger Quick Reference Card

## Import
```typescript
import { logger } from '@/lib/logger';
```

## Basic Usage

### Info (Development only, unless ENABLE_LOGGING=true)
```typescript
logger.info('User logged in', { userId: '123', email: 'user@example.com' });
```

### Warning (Development only, unless ENABLE_LOGGING=true)
```typescript
logger.warn('API rate limit approaching', { remaining: 10, limit: 100 });
```

### Error (ALWAYS logged, even in production)
```typescript
logger.error('Payment processing failed', error, { 
  orderId: 'ORD_123', 
  amount: 1500 
});
```

### Debug (Development only)
```typescript
logger.debug('Processing batch', { batchSize: 50, itemCount: 200 });
```

## Environment Control

### Development (.env.local)
```env
NODE_ENV=development
ENABLE_LOGGING=true  # All logs shown
```

### Production (.env.production)
```env
NODE_ENV=production
ENABLE_LOGGING=false  # Only errors logged
```

### Production Debug Mode
```env
NODE_ENV=production
ENABLE_LOGGING=true  # Temporarily enable all logs for debugging
```

## Log Levels

| Level | Production | Development | Use For |
|-------|-----------|-------------|---------|
| `debug` | ❌ | ✅ | Detailed debugging |
| `info` | ⚠️ Optional | ✅ | General info |
| `warn` | ⚠️ Optional | ✅ | Warnings |
| `error` | ✅ Always | ✅ | Errors |

## Common Patterns

### Order Processing
```typescript
logger.info('Order created', { orderId, customerId, amount });
logger.warn('Low stock detected', { productId, remaining: 5 });
logger.error('Order creation failed', error, { customerId, items });
```

### API Calls
```typescript
logger.info('API request', { endpoint: '/api/orders', method: 'POST' });
logger.error('API error', error, { endpoint, statusCode: 500 });
```

### Database Operations
```typescript
logger.info('Database query', { collection: 'orders', count: 50 });
logger.error('Database write failed', error, { collection, docId });
```

### WhatsApp Notifications
```typescript
logger.info('WhatsApp message sent', { orderId, phone, messageId });
logger.error('WhatsApp API error', error, { orderId, phone });
```

## Migration Pattern

### Before (Console)
```typescript
console.log(`[MODULE] Processing order ${orderId}`);
console.error(`[MODULE] Failed to process:`, error);
```

### After (Logger)
```typescript
logger.info('Processing order', { orderId });
logger.error('Failed to process order', error, { orderId });
```

## Best Practices

### ✅ Do
- Use structured context objects
- Include relevant IDs (orderId, customerId, etc.)
- Log errors with full context
- Use appropriate log levels
- Keep messages concise

### ❌ Don't
- Log sensitive data (passwords, tokens, credit cards)
- Use string interpolation in messages
- Log in tight loops
- Include PII without sanitization
- Use console.log directly

## Examples by Module

### Shipping
```typescript
logger.info('Shipment created', { orderId, courier, awb });
logger.error('Shipment creation failed', error, { orderId, courier });
```

### Payments
```typescript
logger.info('Payment initiated', { orderId, amount, gateway: 'razorpay' });
logger.error('Payment failed', error, { orderId, amount, reason });
```

### Customer Management
```typescript
logger.info('Customer created', { customerId, phone });
logger.warn('Duplicate customer detected', { phone, existingId });
```

### Notifications
```typescript
logger.info('Notification sent', { orderId, channel: 'whatsapp', status: 'sent' });
logger.error('Notification failed', error, { orderId, channel: 'whatsapp' });
```

## Testing

### Check Logs in Development
```bash
npm run dev
# All logs should appear
```

### Check Logs in Production Build
```bash
npm run build
npm run start
# Only errors should appear (unless ENABLE_LOGGING=true)
```

## Troubleshooting

### Logs not appearing in development
- Check `NODE_ENV` is not set to 'production'
- Verify logger import is correct

### Too many logs in production
- Set `ENABLE_LOGGING=false` in production environment
- Check `NODE_ENV=production` is set

### Errors not being logged
- Errors are ALWAYS logged regardless of settings
- Check error is being passed correctly to logger.error()

## Integration with Monitoring

### Sentry (Recommended)
```typescript
// In src/lib/logger.ts
if (this.isProduction && level === 'error') {
  Sentry.captureException(new Error(message), { extra: context });
}
```

### LogRocket
```typescript
if (this.isProduction && level === 'error') {
  LogRocket.captureException(error, { extra: context });
}
```

## Quick Commands

```bash
# Type check
npm run typecheck

# Build for production
npm run build

# Start production server
npm run start

# Development server
npm run dev
```

---

**Remember:** Errors are ALWAYS logged in production. Other log levels are controlled by `ENABLE_LOGGING` environment variable.
