// Custom hook for optimized order fetching with caching and pagination
import { useState, useEffect, useCallback, useRef } from 'react';
import { Order } from '@/types/order';
import { ordersCache } from '@/lib/cache/ordersCache';
import { authenticatedFetch } from '@/lib/api/utils';

type OrderDisplay = Omit<Order, 'createdAt' | 'updatedAt' | 'approval'> & {
  id: string;
  createdAt: string;
  updatedAt: string;
  approval: Omit<Order['approval'], 'approvedAt'> & {
    approvedAt?: string;
  }
}

interface UseOptimizedOrdersOptions {
  status: string;
  pageSize?: number;
  enableCache?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseOptimizedOrdersReturn {
  orders: OrderDisplay[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  updateOrder: (orderId: string, updates: Partial<OrderDisplay>) => void;
  removeOrder: (orderId: string) => void;
  addOrder: (order: OrderDisplay) => void;
}

export function useOptimizedOrders({
  status,
  pageSize = 50,
  enableCache = true,
  autoRefresh = false,
  refreshInterval = 30000
}: UseOptimizedOrdersOptions): UseOptimizedOrdersReturn {
  
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchOrders = useCallback(async (reset = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first (only for initial load)
      if (enableCache && reset) {
        const cachedOrders = ordersCache.get(status);
        if (cachedOrders) {
          setOrders(cachedOrders as OrderDisplay[]);
          setIsLoading(false);
          return;
        }
      }

      const params = new URLSearchParams({
        status,
        limit: pageSize.toString()
        // Note: Removed field selection to ensure all functionality works
        // The main optimization comes from pagination and caching
      });

      if (!reset && lastOrderId) {
        params.append('lastOrderId', lastOrderId);
      }

      const result = await authenticatedFetch(
        `/api/orders/optimized?${params}`,
        { signal: abortControllerRef.current?.signal }
      );

      const newOrders = result.data as OrderDisplay[];
      
      if (reset) {
        setOrders(newOrders);
        // Cache the results
        if (enableCache) {
          ordersCache.set(status, newOrders as Order[]);
        }
      } else {
        setOrders(prev => [...prev, ...newOrders]);
      }
      
      setHasMore(result.hasMore);
      setLastOrderId(result.lastOrderId);

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        console.error('Error fetching orders:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [status, pageSize, enableCache, lastOrderId]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchOrders(false);
  }, [hasMore, isLoading, fetchOrders]);

  const refresh = useCallback(async () => {
    setLastOrderId(null);
    if (enableCache) {
      ordersCache.invalidate(status);
    }
    await fetchOrders(true);
  }, [fetchOrders, enableCache, status]);

  // Optimistic updates
  const updateOrder = useCallback((orderId: string, updates: Partial<OrderDisplay>) => {
    setOrders(prev => prev.map(order => 
      order.orderId === orderId ? { ...order, ...updates } : order
    ));
    
    if (enableCache) {
      ordersCache.updateOrder(orderId, updates as Partial<Order>);
    }
  }, [enableCache]);

  const removeOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(order => order.orderId !== orderId));
    
    if (enableCache) {
      ordersCache.removeOrder(orderId, status);
    }
  }, [enableCache, status]);

  const addOrder = useCallback((order: OrderDisplay) => {
    setOrders(prev => [order, ...prev]);
    
    if (enableCache) {
      ordersCache.addOrder(order as Order, status);
    }
  }, [enableCache, status]);

  // Initial fetch and status change handling
  useEffect(() => {
    setLastOrderId(null);
    fetchOrders(true);
  }, [status]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(refresh, refreshInterval);
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, refresh]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    orders,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    updateOrder,
    removeOrder,
    addOrder
  };
}