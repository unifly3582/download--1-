'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/utils';
import { RefreshCw, Database, Clock, Users } from 'lucide-react';

interface CacheStats {
  cached: boolean;
  count: number;
  lastUpdated: string | null;
  isExpired: boolean;
}

export default function CachePage() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const result = await authenticatedFetch('/api/admin/cache/customers');
      setStats(result.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to fetch cache stats: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCache = async () => {
    setIsRefreshing(true);
    try {
      const result = await authenticatedFetch('/api/admin/cache/customers', {
        method: 'POST',
        body: JSON.stringify({ limit: 1000 })
      });
      
      toast({
        title: 'Success',
        description: result.message
      });
      
      await fetchStats(); // Refresh stats
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to refresh cache: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="p-6">Loading cache stats...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customer Cache Management</h1>
        <Button onClick={refreshCache} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Cache'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.cached ? (
                <Badge variant="default">Active</Badge>
              ) : (
                <Badge variant="destructive">Empty</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.cached ? 'Cache is active and serving requests' : 'No cache data available'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cached Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Customers available for instant search
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.isExpired ? (
                <Badge variant="destructive">Expired</Badge>
              ) : (
                <Badge variant="default">Fresh</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.lastUpdated 
                ? new Date(stats.lastUpdated).toLocaleString()
                : 'Never updated'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Customer Cache Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-green-600">✅ With Cache (Current)</h4>
              <ul className="text-sm space-y-1 mt-2">
                <li>• Phone search: 0 Firestore reads (instant)</li>
                <li>• Name search: 0 Firestore reads (instant)</li>
                <li>• No quota limits</li>
                <li>• Sub-second response times</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-red-600">❌ Without Cache (Old Way)</h4>
              <ul className="text-sm space-y-1 mt-2">
                <li>• Phone search: 1,000+ Firestore reads</li>
                <li>• Name search: 1,000+ Firestore reads</li>
                <li>• Quota exceeded errors</li>
                <li>• 3-5 second response times</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800">💡 Cache Strategy</h4>
            <p className="text-sm text-blue-700 mt-1">
              The cache automatically updates when customers are created or modified. 
              It expires after 30 minutes to ensure data freshness. 
              Manual refresh fetches the 1,000 most active customers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}