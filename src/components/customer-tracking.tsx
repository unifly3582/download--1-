'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  MapPin, 
  Clock,
  Truck,
  Search,
  Phone,
  Mail
} from 'lucide-react';

interface TrackingInfo {
  orderId: string;
  orderStatus: string;
  orderDate: string;
  itemCount: number;
  tracking: {
    courierPartner?: string;
    awb?: string;
    trackingUrl?: string;
    currentStatus?: string;
    currentLocation?: string;
    lastUpdate?: string;
    expectedDeliveryDate?: string;
    trackingEvents?: Array<{
      timestamp: string;
      status: string;
      description: string;
      location?: string;
    }>;
  };
  deliveryLocation: {
    city?: string;
    state?: string;
    zip?: string;
  };
  supportInfo?: {
    supportPhone?: string;
    supportEmail?: string;
  };
}

interface CustomerTrackingProps {
  className?: string;
  showHeader?: boolean;
}

export function CustomerTracking({ className = '', showHeader = true }: CustomerTrackingProps) {
  const [awbNumber, setAwbNumber] = useState('');
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const trackOrder = async () => {
    if (!awbNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an AWB number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/customer/tracking/${awbNumber.trim()}`);
      const result = await response.json();

      if (result.success) {
        setTrackingInfo(result.data);
      } else {
        setError(result.error);
        setTrackingInfo(null);
      }
    } catch (err: any) {
      setError('Failed to fetch tracking information. Please try again.');
      setTrackingInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('delivered')) return 'bg-green-100 text-green-800';
    if (status.includes('shipped') || status.includes('transit')) return 'bg-blue-100 text-blue-800';
    if (status.includes('processing') || status.includes('confirmed')) return 'bg-yellow-100 text-yellow-800';
    if (status.includes('cancelled') || status.includes('returned')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {showHeader && (
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Track Your Order</h1>
          <p className="text-muted-foreground">Enter your AWB number to track your shipment</p>
        </div>
      )}

      {/* Search Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-2">
            <Input
              placeholder="Enter AWB number (e.g., 1234567890)"
              value={awbNumber}
              onChange={(e) => setAwbNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && trackOrder()}
              className="font-mono"
            />
            <Button onClick={trackOrder} disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-600">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Order Not Found</h3>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking Results */}
      {trackingInfo && (
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Order ID</div>
                  <div className="font-medium">{trackingInfo.orderId}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Order Date</div>
                  <div className="font-medium">
                    {new Date(trackingInfo.orderDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Items</div>
                  <div className="font-medium">{trackingInfo.itemCount} item(s)</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge className={getStatusColor(trackingInfo.orderStatus)}>
                    {trackingInfo.orderStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          {trackingInfo.tracking && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trackingInfo.tracking.courierPartner && (
                    <div>
                      <div className="text-sm text-muted-foreground">Courier Partner</div>
                      <div className="font-medium capitalize">
                        {trackingInfo.tracking.courierPartner}
                      </div>
                    </div>
                  )}
                  
                  {trackingInfo.tracking.awb && (
                    <div>
                      <div className="text-sm text-muted-foreground">AWB Number</div>
                      <div className="font-mono text-sm">{trackingInfo.tracking.awb}</div>
                    </div>
                  )}
                  
                  {trackingInfo.tracking.currentStatus && (
                    <div>
                      <div className="text-sm text-muted-foreground">Current Status</div>
                      <Badge className={getStatusColor(trackingInfo.tracking.currentStatus)}>
                        {trackingInfo.tracking.currentStatus}
                      </Badge>
                    </div>
                  )}
                  
                  {trackingInfo.tracking.currentLocation && (
                    <div>
                      <div className="text-sm text-muted-foreground">Current Location</div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{trackingInfo.tracking.currentLocation}</span>
                      </div>
                    </div>
                  )}
                </div>

                {trackingInfo.tracking.expectedDeliveryDate && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium text-blue-900">Expected Delivery</div>
                        <div className="text-sm text-blue-700">
                          {new Date(trackingInfo.tracking.expectedDeliveryDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {trackingInfo.tracking.trackingUrl && (
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(trackingInfo.tracking.trackingUrl, '_blank')}
                    className="w-full"
                  >
                    Track on Courier Website
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tracking Timeline */}
          {trackingInfo.tracking?.trackingEvents && trackingInfo.tracking.trackingEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tracking Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trackingInfo.tracking.trackingEvents.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        {index < trackingInfo.tracking.trackingEvents!.length - 1 && (
                          <div className="w-px h-8 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{event.status}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        {event.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Support Information */}
          {trackingInfo.supportInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trackingInfo.supportInfo.supportPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Call Support</div>
                        <div className="font-medium">{trackingInfo.supportInfo.supportPhone}</div>
                      </div>
                    </div>
                  )}
                  
                  {trackingInfo.supportInfo.supportEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Email Support</div>
                        <div className="font-medium">{trackingInfo.supportInfo.supportEmail}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}