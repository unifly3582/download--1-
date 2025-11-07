/**
 * Analytics Configuration
 * Tracks user behavior and application metrics
 */

import { logger } from '@/lib/logger';

// Google Analytics 4
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Track page views
export const pageview = (url: string) => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;
  
  try {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  } catch (error) {
    logger.error('Analytics pageview error', error);
  }
};

// Track custom events
export const event = (action: string, params?: Record<string, any>) => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;
  
  try {
    window.gtag('event', action, params);
  } catch (error) {
    logger.error('Analytics event error', error, { action, params });
  }
};

// Business-specific events
export const trackOrderCreated = (orderId: string, amount: number) => {
  event('order_created', {
    order_id: orderId,
    value: amount,
    currency: 'INR',
  });
};

export const trackOrderShipped = (orderId: string) => {
  event('order_shipped', {
    order_id: orderId,
  });
};

export const trackPaymentCompleted = (orderId: string, amount: number, method: string) => {
  event('payment_completed', {
    order_id: orderId,
    value: amount,
    currency: 'INR',
    payment_method: method,
  });
};

export const trackProductView = (productId: string, productName: string) => {
  event('view_item', {
    item_id: productId,
    item_name: productName,
  });
};

export const trackAddToCart = (productId: string, productName: string, price: number) => {
  event('add_to_cart', {
    item_id: productId,
    item_name: productName,
    value: price,
    currency: 'INR',
  });
};

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}
