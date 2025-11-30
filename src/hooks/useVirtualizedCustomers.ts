import { useState, useEffect, useCallback, useMemo } from 'react';
import { Customer } from '@/types/customers';
import { authenticatedFetch } from '@/lib/api/utils';

interface UseVirtualizedCustomersProps {
  pageSize?: number;
  searchTerm?: string;
  filters?: {
    tier: string;
    segment: string;
    region: string;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minOrders?: number | null;
}

interface CustomerPage {
  data: Customer[];
  hasMore: boolean;
  nextCursor?: string;
}

export function useVirtualizedCustomers({
  pageSize = 25,
  searchTerm = '',
  filters = { tier: 'all', segment: 'all', region: 'all' },
  sortBy = 'createdAt',
  sortOrder = 'desc',
  minOrders = null
}: UseVirtualizedCustomersProps) {
  const [pages, setPages] = useState<CustomerPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Flatten all pages into single array
  const customers = useMemo(() => {
    return pages.flatMap(page => page.data);
  }, [pages]);

  const loadPage = useCallback(async (cursor?: string, reset = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        ...(cursor && { cursor }),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.tier !== 'all' && { tier: filters.tier }),
        ...(filters.segment !== 'all' && { segment: filters.segment }),
        ...(filters.region !== 'all' && { region: filters.region }),
        ...(minOrders !== null && { minOrders: minOrders.toString() }),
        sortBy,
        sortOrder,
      });

      const result = await authenticatedFetch(`/api/customers/paginated?${params}`);
      
      if (reset) {
        setPages([result.data]);
      } else {
        setPages(prev => [...prev, result.data]);
      }
      
      setHasMore(result.data.hasMore);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, searchTerm, filters, sortBy, sortOrder, minOrders, isLoading]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;
    
    const lastPage = pages[pages.length - 1];
    const cursor = lastPage?.nextCursor;
    
    loadPage(cursor);
  }, [hasMore, isLoading, pages, loadPage]);

  const refresh = useCallback(() => {
    setPages([]);
    setHasMore(true);
    loadPage(undefined, true);
  }, [loadPage]);

  // Reset and load first page when dependencies change
  useEffect(() => {
    refresh();
  }, [searchTerm, filters.tier, filters.segment, filters.region, sortBy, sortOrder, minOrders]);

  return {
    customers,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalLoaded: customers.length
  };
}