'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Phone, Mail, Calendar, TrendingUp, AlertTriangle, Star, Package } from "lucide-react";
import type { Customer } from '@/types/customers';

interface CustomerProfile extends Customer {
  recentOrders?: Array<{
    orderId: string;
    createdAt: string;
    internalStatus: string;
    grandTotal: number;
  }>;
  stats?: {
    totalOrders: number;
    completedOrders: number;
    totalSpent: number;
    avgOrderValue: number;
  };
  memberSince?: string;
  lastOrderDate?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
}

interface CustomerProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerProfile | null;
  isLoading: boolean;
  onEdit?: () => void;
}

export function CustomerProfileDialog({ 
  isOpen, 
  onClose, 
  customer, 
  isLoading, 
  onEdit 
}: CustomerProfileDialogProps) {
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh]">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!customer) {
    return null;
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Customer Profile: {customer.name}
            {customer.isDubious && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                High Risk
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Comprehensive customer information and activity history
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[75vh] overflow-y-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {customer.stats?.totalOrders || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Orders</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ₹{customer.stats?.totalSpent?.toFixed(0) || '0'}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Spent</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ₹{customer.stats?.avgOrderValue?.toFixed(0) || '0'}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Order</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {customer.stats?.completedOrders || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Language:</span>
                      <Badge variant="outline">{customer.preferredLanguage || 'en'}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">WhatsApp:</span>
                      <Badge variant={customer.whatsappOptIn ? "default" : "secondary"}>
                        {customer.whatsappOptIn ? 'Opted In' : 'Opted Out'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Business Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">{customer.loyaltyTier}</Badge>
                      <span className="text-sm text-muted-foreground">Loyalty Tier</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary">{customer.customerSegment}</Badge>
                      <span className="text-sm text-muted-foreground">Segment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.region || 'Not specified'}</span>
                      <span className="text-sm text-muted-foreground">Region</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Trust Score:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{customer.trustScore || 50}/100</span>
                        <Badge 
                          variant="outline" 
                          className={getRiskColor(customer.riskLevel || 'Low')}
                        >
                          {customer.riskLevel || 'Low'} Risk
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tags and Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customer.tags && customer.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {customer.tags.map(tag => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags assigned</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Member since: {customer.memberSince ? 
                          new Date(customer.memberSince).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Last order: {customer.lastOrderDate ? 
                          new Date(customer.lastOrderDate).toLocaleDateString() : 'No orders yet'}
                      </span>
                    </div>
                    {customer.referralSource && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Found us via:</span>
                        <Badge variant="outline">{customer.referralSource}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              {customer.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="orders" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.recentOrders && customer.recentOrders.length > 0 ? (
                    <div className="space-y-3">
                      {customer.recentOrders.map(order => (
                        <div key={order.orderId} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <div className="font-mono text-sm font-medium">{order.orderId}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">₹{order.grandTotal.toFixed(2)}</div>
                            <Badge variant="secondary" className="text-xs">
                              {order.internalStatus}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No recent orders found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses" className="mt-4">
              <div className="space-y-4">
                {customer.defaultAddress && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Default Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        {customer.defaultAddress.street}<br />
                        {customer.defaultAddress.city}, {customer.defaultAddress.state}<br />
                        {customer.defaultAddress.zip}, {customer.defaultAddress.country}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {customer.savedAddresses && customer.savedAddresses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Saved Addresses</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {customer.savedAddresses.map((addr, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{addr.label || 'Other'}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {addr.street}, {addr.city}, {addr.state} - {addr.zip}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {!customer.defaultAddress && (!customer.savedAddresses || customer.savedAddresses.length === 0) && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No addresses on file</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Customer ID:</span>
                      <span className="font-mono text-sm">{customer.customerId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Created:</span>
                      <span className="text-sm">
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Updated:</span>
                      <span className="text-sm">
                        {customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    {customer.lastInteractionSource && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Last Interaction:</span>
                        <Badge variant="outline">{customer.lastInteractionSource}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {customer.preferredCourier && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Preferred Courier:</span>
                        <Badge variant="outline">{customer.preferredCourier}</Badge>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Return Rate:</span>
                      <span className="text-sm">{customer.returnRate || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Refunds:</span>
                      <span className="text-sm">{customer.refundsCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Lifetime Value:</span>
                      <span className="text-sm">₹{customer.lifetimeValue?.toFixed(2) || '0.00'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {customer.blacklistReason && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Risk Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{customer.blacklistReason}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              Edit Customer
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}