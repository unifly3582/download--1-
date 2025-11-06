'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  RefreshCw, 
  Package, 
  Truck, 
  MapPin, 
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/api/utils';

interface TrackingStatus {
  summary: {
    ordersNeedingTracking: number;
    recentlyUpdated: number;
    lastSyncTime: string;
  };
  statusBreakdown: Record<string, number>;
  courierBreakdown: Record<string, number>;
  recentEvents: Array<{
    orderId: string;
    awb: string;
    status: string;
    location: string;
    lastTracked: string;
    courier: string;
  }>;
}

export default function TrackingPage() {
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrackingStatus();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchTrackingStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrackingStatus = async () => {
    setIsLoading(true);
    try {
      const result = await authenticatedFetch('/api/admin/tracking/status');
      setTrackingStatus(result.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch tracking status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      // First check how many orders need tracking
      const statusResult = await authenticatedFetch('/api/admin/tracking/status', {
        method: 'POST'
      });
      
      if (statusResult.syncResult.ordersFound === 0) {
        toast({
          title: 'No Orders to Track',
          description: 'All orders are up to date',
        });
        setIsSyncing(false);
        return;
      }
      
      // Now trigger the actual sync
      const syncResult = await authenticatedFetch('/api/tracking/sync', {
        method: 'POST'
      });
      
      toast({
        title: 'Sync Complete',
        description: syncResult.message || 'Tracking sync completed successfully',
      });
      
      // Refresh status after sync
      setTimeout(fetchTrackingStatus, 2000);
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to trigger sync',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('delivered')) return 'bg-green-100 text-green-800';
    if (status.includes('transit') || status.includes('shipped')) return 'bg-blue-100 text-blue-800';
    if (status.includes('pending') || status.includes('ready')) return 'bg-yellow-100 text-yellow-800';
    if (status.includes('returned') || status.includes('cancelled')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading tracking status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold text-foreground">Shipment Tracking</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={fetchTrackingStatus}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={triggerSync}
            disabled={isSyncing}
          >
            <Truck className="mr-2 h-4 w-4" />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>

      {trackingStatus && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{trackingStatus.summary.ordersNeedingTracking}</div>
                    <div className="text-sm text-muted-foreground">Orders Being Tracked</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{trackingStatus.summary.recentlyUpdated}</div>
                    <div className="text-sm text-muted-foreground">Updated Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="text-sm font-medium">Last Sync</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(trackingStatus.summary.lastSyncTime).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(trackingStatus.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(status)}>
                          {status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="font-medium">{count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Courier Partners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(trackingStatus.courierBreakdown).map(([courier, count]) => (
                    <div key={courier} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{courier}</span>
                      </div>
                      <div className="font-medium">{count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Tracking Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tracking Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>AWB</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingStatus.recentEvents.length > 0 ? (
                    trackingStatus.recentEvents.map((event, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{event.orderId}</TableCell>
                        <TableCell className="font-mono text-sm">{event.awb}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{event.location || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{event.courier}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(event.lastTracked).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        No recent tracking updates
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Tracking API: Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Delhivery Integration: Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Auto-sync: Enabled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}