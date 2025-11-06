// Orders caching and optimization utilities
import { Order } from '@/types/order';

interface CachedOrdersData {
  orders: Order[];
  lastFetch: number;
  status: string;
}

class OrdersCache {
  private cache = new Map<string, CachedOrdersData>();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  get(status: string): Order[] | null {
    const cached = this.cache.get(status);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.lastFetch > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(status);
      return null;
    }
    
    return cached.orders;
  }

  set(status: string, orders: Order[]): void {
    this.cache.set(status, {
      orders,
      lastFetch: Date.now(),
      status
    });
  }

  invalidate(status?: string): void {
    if (status) {
      this.cache.delete(status);
    } else {
      this.cache.clear();
    }
  }

  // Update specific order in cache without refetching
  updateOrder(orderId: string, updates: Partial<Order>): void {
    for (const [status, cached] of this.cache.entries()) {
      const orderIndex = cached.orders.findIndex(o => o.orderId === orderId);
      if (orderIndex !== -1) {
        cached.orders[orderIndex] = { ...cached.orders[orderIndex], ...updates };
      }
    }
  }

  // Remove order from cache (when status changes)
  removeOrder(orderId: string, fromStatus: string): void {
    const cached = this.cache.get(fromStatus);
    if (cached) {
      cached.orders = cached.orders.filter(o => o.orderId !== orderId);
    }
  }

  // Add order to cache (when status changes)
  addOrder(order: Order, toStatus: string): void {
    const cached = this.cache.get(toStatus);
    if (cached) {
      cached.orders.unshift(order); // Add to beginning (most recent first)
    }
  }
}

export const ordersCache = new OrdersCache();