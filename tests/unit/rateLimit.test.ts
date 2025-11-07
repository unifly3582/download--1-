/**
 * Unit Tests for Rate Limiting
 */

import { NextRequest } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/middleware/rateLimit';

describe('Rate Limiting', () => {
  describe('rateLimitConfigs', () => {
    it('should have strict configuration', () => {
      expect(rateLimitConfigs.strict).toBeDefined();
      expect(rateLimitConfigs.strict.maxRequests).toBe(5);
      expect(rateLimitConfigs.strict.windowMs).toBe(15 * 60 * 1000);
    });

    it('should have standard configuration', () => {
      expect(rateLimitConfigs.standard).toBeDefined();
      expect(rateLimitConfigs.standard.maxRequests).toBe(60);
      expect(rateLimitConfigs.standard.windowMs).toBe(60 * 1000);
    });

    it('should have relaxed configuration', () => {
      expect(rateLimitConfigs.relaxed).toBeDefined();
      expect(rateLimitConfigs.relaxed.maxRequests).toBe(120);
    });

    it('should have order creation configuration', () => {
      expect(rateLimitConfigs.orderCreation).toBeDefined();
      expect(rateLimitConfigs.orderCreation.maxRequests).toBe(10);
    });

    it('should have whatsapp configuration', () => {
      expect(rateLimitConfigs.whatsapp).toBeDefined();
      expect(rateLimitConfigs.whatsapp.maxRequests).toBe(5);
    });
  });

  describe('rateLimit middleware', () => {
    it('should allow requests within limit', async () => {
      const middleware = rateLimit({
        windowMs: 60000,
        maxRequests: 10,
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const result = await middleware(request);
      expect(result).toBeNull(); // Null means request is allowed
    });
  });
});
