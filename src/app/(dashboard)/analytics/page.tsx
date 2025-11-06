'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/utils';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Globe,
  MousePointer,
  Smartphone,
  BarChart3
} from 'lucide-react';

interface TrafficSourceStats {
  source: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  uniqueCustomers: number;
}

interface AnalyticsData {
  totalStats: {
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    averageOrderValue: number;
  };
  trafficSources: TrafficSourceStats[];
  topCampaigns: Array<{
    campaign: string;
    orders: number;
    revenue: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const result = await authenticatedFetch(`/api/admin/analytics/traffic-sources?days=${dateRange}`);
      
      // Ensure we have the expected data structure
      if (result.success && result.data && result.data.totalStats) {
        setAnalytics(result.data);
        console.log('Analytics data loaded:', result.data);
      } else {
        console.error('Invalid API response:', result);
        setAnalytics(null);
        toast({
          title: 'Error',
          description: 'Invalid data received from server',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Analytics fetch error:', error);
      setAnalytics(null);
      toast({
        title: 'Error Fetching Analytics',
        description: error.message || 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₹${new Intl.NumberFormat('en-IN').format(amount)}`;

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'google_ads':
      case 'google':
        return <Globe className="h-4 w-4 text-blue-500" />;
      case 'meta_ads':
      case 'facebook':
      case 'instagram':
        return <Smartphone className="h-4 w-4 text-blue-600" />;
      case 'direct':
        return <MousePointer className="h-4 w-4 text-gray-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'google_ads':
      case 'google':
        return 'bg-blue-100 text-blue-800';
      case 'meta_ads':
      case 'facebook':
      case 'instagram':
        return 'bg-blue-100 text-blue-800';
      case 'direct':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold text-foreground">Analytics</h1>
        <div className="flex gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {analytics && analytics.totalStats && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{analytics.totalStats.totalOrders || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Orders</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{formatCurrency(analytics.totalStats.totalRevenue || 0)}</div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{analytics.totalStats.totalCustomers || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Customers</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{formatCurrency(analytics.totalStats.averageOrderValue || 0)}</div>
                    <div className="text-sm text-muted-foreground">Avg Order Value</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.trafficSources && analytics.trafficSources.length > 0 ? analytics.trafficSources.map((source, index) => (
                  <div key={source.source} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {getSourceIcon(source.source)}
                      <div>
                        <div className="font-medium capitalize">{source.source.replace('_', ' ')}</div>
                        <div className="text-sm text-muted-foreground">
                          {source.uniqueCustomers} customers
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6 text-right">
                      <div>
                        <div className="font-semibold">{source.totalOrders}</div>
                        <div className="text-sm text-muted-foreground">Orders</div>
                      </div>
                      <div>
                        <div className="font-semibold">{formatCurrency(source.totalRevenue)}</div>
                        <div className="text-sm text-muted-foreground">Revenue</div>
                      </div>
                      <div>
                        <div className="font-semibold">{formatCurrency(source.averageOrderValue)}</div>
                        <div className="text-sm text-muted-foreground">AOV</div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No traffic source data available for the selected period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Campaigns */}
          {analytics.topCampaigns && analytics.topCampaigns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topCampaigns.slice(0, 5).map((campaign, index) => (
                    <div key={campaign.campaign} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <div className="font-medium">{campaign.campaign || 'Unknown Campaign'}</div>
                        </div>
                      </div>
                      <div className="flex gap-6 text-right">
                        <div>
                          <div className="font-semibold">{campaign.orders}</div>
                          <div className="text-sm text-muted-foreground">Orders</div>
                        </div>
                        <div>
                          <div className="font-semibold">{formatCurrency(campaign.revenue)}</div>
                          <div className="text-sm text-muted-foreground">Revenue</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* No Data Message */}
      {analytics && analytics.totalStats && analytics.totalStats.totalOrders === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Data Available</h3>
              <p>No orders found for the selected time period.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State - No Analytics Data */}
      {!isLoading && !analytics && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Unable to Load Analytics</h3>
              <p>There was an error loading the analytics data. Please try refreshing the page.</p>
              <button 
                onClick={fetchAnalytics}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}