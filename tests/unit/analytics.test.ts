/**
 * Unit Tests for Analytics
 */

import {
  trackOrderCreated,
  trackOrderShipped,
  trackPaymentCompleted,
  trackProductView,
  trackAddToCart,
} from '@/lib/monitoring/analytics';

// Mock window.gtag
declare global {
  interface Window {
    gtag: jest.Mock;
  }
}

describe('Analytics', () => {
  beforeEach(() => {
    window.gtag = jest.fn();
  });

  afterEach(() => {
    delete (window as any).gtag;
  });

  describe('trackOrderCreated', () => {
    it('should track order created event', () => {
      trackOrderCreated('ORD_123', 1500);
      
      expect(window.gtag).toHaveBeenCalledWith('event', 'order_created', {
        order_id: 'ORD_123',
        value: 1500,
        currency: 'INR',
      });
    });
  });

  describe('trackOrderShipped', () => {
    it('should track order shipped event', () => {
      trackOrderShipped('ORD_123');
      
      expect(window.gtag).toHaveBeenCalledWith('event', 'order_shipped', {
        order_id: 'ORD_123',
      });
    });
  });

  describe('trackPaymentCompleted', () => {
    it('should track payment completed event', () => {
      trackPaymentCompleted('ORD_123', 1500, 'razorpay');
      
      expect(window.gtag).toHaveBeenCalledWith('event', 'payment_completed', {
        order_id: 'ORD_123',
        value: 1500,
        currency: 'INR',
        payment_method: 'razorpay',
      });
    });
  });

  describe('trackProductView', () => {
    it('should track product view event', () => {
      trackProductView('PROD_123', 'Test Product');
      
      expect(window.gtag).toHaveBeenCalledWith('event', 'view_item', {
        item_id: 'PROD_123',
        item_name: 'Test Product',
      });
    });
  });

  describe('trackAddToCart', () => {
    it('should track add to cart event', () => {
      trackAddToCart('PROD_123', 'Test Product', 500);
      
      expect(window.gtag).toHaveBeenCalledWith('event', 'add_to_cart', {
        item_id: 'PROD_123',
        item_name: 'Test Product',
        value: 500,
        currency: 'INR',
      });
    });
  });
});
