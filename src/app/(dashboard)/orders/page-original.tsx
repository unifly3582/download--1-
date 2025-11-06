'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Order } from '@/types/order';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, MoreHorizontal, AlertTriangle, Truck } from 'lucide-react';
import { CreateOrderDialog } from './create-order-dialog';
import { ShipOrderDialog } from './ship-order-dialog';
import { UpdateDimensionsDialog } from './update-dimensions-dialog';
import { OrderDetailsDialog } from './order-details-dialog';

import { authenticatedFetch } from '@/lib/api/utils'; // Import our new utility


// FIX: Define the display type to reflect that all timestamps from the API are strings.
type OrderDisplay = Omit<Order, 'createdAt' | 'updatedAt' | 'approval'> & {
    id: string; // Add the document ID
    createdAt: string;
    updatedAt: string;
    approval: Omit<Order['approval'], 'approvedAt'> & {
        approvedAt?: string;
    }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('to-approve');
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isShipDialogOpen, setIsShipDialogOpen] = useState(false);
  const [isUpdateDimsOpen, setIsUpdateDimsOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDisplay | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [isBulkShipping, setIsBulkShipping] = useState(false);
  const [bulkShipCourier, setBulkShipCourier] = useState<'delhivery' | 'manual'>('delhivery');

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      // CORRECT: Use authenticatedFetch to get the orders
      const result = await authenticatedFetch(`/api/orders?status=${activeTab}`);
      // The utility already checks for success, so we can use the data directly
      setOrders(result.data.map((order: Order) => ({...order, id: order.orderId})));
    } catch (error: any) {
      toast({ title: 'Error Fetching Orders', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast, activeTab]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  
  // Clear selections when switching tabs
  useEffect(() => {
    setSelectedOrders(new Set());
  }, [activeTab]);
  
  const handleShipOrderClick = (order: OrderDisplay) => {
    setSelectedOrder(order);
    setIsShipDialogOpen(true);
  };

  const handleUpdateDimsClick = (order: OrderDisplay) => {
    setSelectedOrder(order);
    setIsUpdateDimsOpen(true);
  };

  const handleViewDetailsClick = (order: OrderDisplay) => {
    setSelectedOrder(order);
    setIsDetailsDialogOpen(true);
  };

  const handleManualShipClick = async (order: OrderDisplay) => {
    const manualAwb = prompt('Enter manual AWB number:');
    if (!manualAwb) return;
    
    try {
      const result = await authenticatedFetch(`/api/orders/${order.id}/ship`, {
        method: 'POST',
        body: JSON.stringify({ 
          courier: 'manual',
          manualAwb: manualAwb
        }),
      });
      
      toast({
        title: 'Success',
        description: `Order ${order.orderId} shipped manually with AWB: ${manualAwb}`,
      });
      fetchOrders();
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to ship order: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirmed = window.confirm('Are you sure you want to cancel this order? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      const result = await authenticatedFetch('/api/orders/bulk', {
        method: 'POST',
        body: JSON.stringify({
          action: 'cancel',
          orderIds: [orderId]
        }),
      });
      
      toast({
        title: 'Success',
        description: 'Order cancelled successfully',
      });
      fetchOrders();
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to cancel order: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = (checked: boolean, orderList: OrderDisplay[]) => {
    if (checked) {
      setSelectedOrders(new Set(orderList.map(order => order.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleBulkApproval = async (action: 'approve' | 'reject') => {
    if (selectedOrders.size === 0) return;
    
    setIsBulkApproving(true);
    try {
      const result = await authenticatedFetch('/api/orders/bulk', {
        method: 'POST',
        body: JSON.stringify({
          action,
          orderIds: Array.from(selectedOrders)
        }),
      });
      
      toast({
        title: 'Success',
        description: result.message,
      });
      
      setSelectedOrders(new Set());
      fetchOrders();
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to ${action} orders: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsBulkApproving(false);
    }
  };

  const handleBulkShipping = async () => {
    if (selectedOrders.size === 0) return;
    
    const confirmed = window.confirm(
      `🚚 BULK SHIPPING CONFIRMATION\n\n` +
      `You are about to ship ${selectedOrders.size} orders via ${bulkShipCourier.toUpperCase()}.\n\n` +
      `This will create actual shipments and generate AWB numbers.\n\n` +
      `Do you want to continue?`
    );
    
    if (!confirmed) return;
    
    setIsBulkShipping(true);
    let successCount = 0;
    let failureCount = 0;
    const failures: string[] = [];
    
    try {
      // Process orders individually for actual shipping
      for (const orderId of Array.from(selectedOrders)) {
        try {
          await authenticatedFetch(`/api/orders/${orderId}/ship`, {
            method: 'POST',
            body: JSON.stringify({
              courier: bulkShipCourier,
              ...(bulkShipCourier === 'manual' && { manualAwb: `MANUAL_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` })
            }),
          });
          successCount++;
        } catch (error: any) {
          failureCount++;
          failures.push(`${orderId}: ${error.message}`);
        }
      }
      
      toast({
        title: 'Bulk Shipping Complete',
        description: `${successCount} orders shipped successfully, ${failureCount} failed`,
        variant: failureCount > 0 ? 'destructive' : 'default'
      });
      
      if (failures.length > 0) {
        console.error('Bulk shipping failures:', failures);
      }
      
      setSelectedOrders(new Set());
      fetchOrders();
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Bulk shipping failed: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsBulkShipping(false);
    }
  };

  const handleBulkCancel = async () => {
    if (selectedOrders.size === 0) return;
    
    const confirmed = window.confirm(
      `⚠️ CANCEL ORDERS CONFIRMATION\n\n` +
      `You are about to cancel ${selectedOrders.size} orders.\n\n` +
      `This action cannot be undone.\n\n` +
      `Do you want to continue?`
    );
    
    if (!confirmed) return;
    
    try {
      const result = await authenticatedFetch('/api/orders/bulk', {
        method: 'POST',
        body: JSON.stringify({
          action: 'cancel',
          orderIds: Array.from(selectedOrders)
        }),
      });
      
      toast({
        title: 'Success',
        description: result.message,
      });
      
      setSelectedOrders(new Set());
      fetchOrders();
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to cancel orders: ${error.message}`,
        variant: 'destructive',
      });
    }
  };
  
  const handleApprovalAction = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      // CORRECT: Use authenticatedFetch for the approval action
      const result = await authenticatedFetch(`/api/orders/${orderId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      
      toast({
        title: 'Success',
        description: result.message || `Order successfully ${action === 'approve' ? 'approved' : 'rejected'}.`,
      });
      fetchOrders(); // Refresh the list
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to ${action} order: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  // ... (The rest of the component's JSX and helper functions remain exactly the same) ...
  const formatCurrency = (amount: number) => `₹${new Intl.NumberFormat('en-IN').format(amount)}`;
  
  const getStatusVariant = (status: Order['internalStatus']): "default" | "secondary" | "destructive" | "outline" => {
    if (status.includes('delivered') || status.includes('shipped') || status.includes('in_transit')) return 'default';
    if (status.includes('cancelled') || status.includes('rejected') || status.includes('returned')) return 'destructive';
    if (status.includes('approved')) return 'secondary';
    if (status.includes('needs_manual_verification')) return 'destructive';
    return 'outline';
  };

  const getPaymentBadgeVariant = (status: Order['paymentInfo']['status']): "default" | "secondary" => {
      return status === 'Completed' ? 'default' : 'secondary';
  }

  const renderTable = (orderList: OrderDisplay[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <input
              type="checkbox"
              checked={selectedOrders.size === orderList.length && orderList.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked, orderList)}
              className="rounded"
            />
          </TableHead>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Address & Pincode</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Coupon</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? ( 
          <TableRow><TableCell colSpan={10} className="text-center h-24">Loading...</TableCell></TableRow> 
        ) : orderList.length > 0 ? (
          orderList.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedOrders.has(order.id)}
                  onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                  className="rounded"
                />
              </TableCell>
              <TableCell className="font-medium">{order.orderId}</TableCell>
              
              {/* Customer Info */}
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{order.customerInfo.name}</div>
                  <div className="text-sm text-muted-foreground">{order.customerInfo.phone}</div>
                  {order.customerInfo.email && (
                    <div className="text-xs text-muted-foreground">{order.customerInfo.email}</div>
                  )}
                </div>
              </TableCell>
              
              {/* Order Source */}
              <TableCell>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs">
                    {order.orderSource.replace('_', ' ')}
                  </Badge>
                  {order.trafficSource?.source && (
                    <div className="text-xs text-muted-foreground">
                      {order.trafficSource.source}
                    </div>
                  )}
                  {order.trafficSource?.campaign && (
                    <div className="text-xs text-blue-600">
                      {order.trafficSource.campaign}
                    </div>
                  )}
                </div>
              </TableCell>
              
              {/* Address & Pincode */}
              <TableCell>
                <div className="space-y-1 max-w-[200px]">
                  <div className="text-sm">{order.shippingAddress.street}</div>
                  <div className="text-sm">{order.shippingAddress.city}, {order.shippingAddress.state}</div>
                  <div className="text-sm font-medium">PIN: {order.shippingAddress.zip}</div>
                  {order.shipmentInfo?.courierPartner && (
                    <div className="text-xs text-blue-600">
                      Courier: {order.shipmentInfo.courierPartner}
                    </div>
                  )}
                </div>
              </TableCell>
              
              {/* Payment Info */}
              <TableCell>
                <div className="space-y-1">
                  <Badge variant={getPaymentBadgeVariant(order.paymentInfo.status)}>
                    {order.paymentInfo.method}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {order.paymentInfo.status}
                  </div>
                  {order.paymentInfo.transactionId && (
                    <div className="text-xs font-mono">
                      {order.paymentInfo.transactionId}
                    </div>
                  )}
                </div>
              </TableCell>
              
              {/* Coupon Info */}
              <TableCell>
                {order.couponCode ? (
                  <div className="space-y-1">
                    <Badge variant="outline" className="font-mono text-xs">
                      {order.couponCode}
                    </Badge>
                    {order.couponDetails && (
                      <div className="text-xs text-green-600">
                        -{formatCurrency(order.couponDetails.discountAmount)}
                      </div>
                    )}
                    {order.pricingInfo.discount > 0 && !order.couponDetails && (
                      <div className="text-xs text-green-600">
                        -{formatCurrency(order.pricingInfo.discount)}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">No coupon</span>
                )}
              </TableCell>
              
              {/* Status */}
              <TableCell>
                <div className="space-y-1">
                  <Badge variant={getStatusVariant(order.internalStatus)}>
                    {order.internalStatus.replace(/_/g, ' ')}
                  </Badge>
                  {order.shipmentInfo?.awb && (
                    <div className="text-xs font-mono">
                      AWB: {order.shipmentInfo.awb}
                    </div>
                  )}
                  {order.shipmentInfo?.currentTrackingStatus && (
                    <div className="text-xs text-muted-foreground">
                      {order.shipmentInfo.currentTrackingStatus}
                    </div>
                  )}
                </div>
              </TableCell>
              
              {/* Total with Breakdown */}
              <TableCell className="text-right">
                <div className="space-y-1">
                  <div className="font-medium">{formatCurrency(order.pricingInfo.grandTotal)}</div>
                  <div className="text-xs text-muted-foreground">
                    Sub: {formatCurrency(order.pricingInfo.subtotal)}
                  </div>
                  {order.pricingInfo.discount > 0 && (
                    <div className="text-xs text-green-600">
                      Disc: -{formatCurrency(order.pricingInfo.discount)}
                    </div>
                  )}
                  {order.pricingInfo.shippingCharges > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Ship: {formatCurrency(order.pricingInfo.shippingCharges)}
                    </div>
                  )}
                  {order.pricingInfo.codCharges > 0 && (
                    <div className="text-xs text-muted-foreground">
                      COD: {formatCurrency(order.pricingInfo.codCharges)}
                    </div>
                  )}
                </div>
              </TableCell>
              
              {/* Actions */}
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleViewDetailsClick(order)}>
                      View Full Details
                    </DropdownMenuItem>
                    {order.internalStatus === 'created_pending' && (
                      <>
                        <DropdownMenuItem onClick={() => handleApprovalAction(order.id, 'approve')}>
                          Approve Order
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleApprovalAction(order.id, 'reject')} className="text-red-600">
                          Reject Order
                        </DropdownMenuItem>
                      </>
                    )}
                    {order.internalStatus === 'needs_manual_verification' && (
                        <DropdownMenuItem onClick={() => handleUpdateDimsClick(order)} className="text-orange-600">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Enter Dimensions
                        </DropdownMenuItem>
                    )}
                    {order.internalStatus === 'approved' && (
                      <>
                        <DropdownMenuItem onClick={() => handleShipOrderClick(order)}>
                          <Truck className="mr-2 h-4 w-4" />
                          Ship via Delhivery
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManualShipClick(order)}>
                          📦 Ship Manually
                        </DropdownMenuItem>
                      </>
                    )}
                    {(order.internalStatus === 'created_pending' || order.internalStatus === 'approved' || order.internalStatus === 'shipped') && (
                      <DropdownMenuItem onClick={() => handleCancelOrder(order.id)} className="text-red-600">
                        ❌ Cancel Order
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : ( 
          <TableRow><TableCell colSpan={10} className="text-center h-24">No orders found in this category.</TableCell></TableRow> 
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold text-foreground">Orders</h1>
        <div className="flex items-center gap-2">
          {selectedOrders.size > 0 && (
            <>
              <Badge variant="secondary">{selectedOrders.size} selected</Badge>
              
              {/* To Approve Tab Actions */}
              {activeTab === 'to-approve' && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkApproval('approve')}
                    disabled={isBulkApproving}
                  >
                    {isBulkApproving ? 'Approving...' : 'Bulk Approve'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkApproval('reject')}
                    disabled={isBulkApproving}
                    className="text-red-600 hover:text-red-700"
                  >
                    {isBulkApproving ? 'Rejecting...' : 'Bulk Reject'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleBulkCancel}
                    className="text-red-600 hover:text-red-700"
                  >
                    Cancel Orders
                  </Button>
                </>
              )}
              
              {/* To Ship Tab Actions */}
              {activeTab === 'to-ship' && (
                <>
                  <select 
                    value={bulkShipCourier} 
                    onChange={(e) => setBulkShipCourier(e.target.value as 'delhivery' | 'manual')}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value="delhivery">Delhivery</option>
                    <option value="manual">Manual</option>
                  </select>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleBulkShipping}
                    disabled={isBulkShipping}
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    {isBulkShipping ? 'Shipping...' : `Bulk Ship (${bulkShipCourier})`}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleBulkCancel}
                    className="text-red-600 hover:text-red-700"
                  >
                    Cancel Orders
                  </Button>
                </>
              )}
              
              {/* In Transit Tab Actions */}
              {activeTab === 'in-transit' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBulkCancel}
                  className="text-red-600 hover:text-red-700"
                >
                  Cancel Orders
                </Button>
              )}
            </>
          )}
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Order
          </Button>
        </div>
      </div>
      


      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="to-approve">
        <TabsList>
          <TabsTrigger value="to-approve">To Approve</TabsTrigger>
          <TabsTrigger value="to-ship">To Ship</TabsTrigger>
          <TabsTrigger value="in-transit">In Transit</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>

        </TabsList>
        <TabsContent value="to-approve"><Card><CardContent className="p-0">{renderTable(orders)}</CardContent></Card></TabsContent>
        <TabsContent value="to-ship"><Card><CardContent className="p-0">{renderTable(orders)}</CardContent></Card></TabsContent>
        <TabsContent value="in-transit"><Card><CardContent className="p-0">{renderTable(orders)}</CardContent></Card></TabsContent>
        <TabsContent value="completed"><Card><CardContent className="p-0">{renderTable(orders)}</CardContent></Card></TabsContent>
        <TabsContent value="rejected"><Card><CardContent className="p-0">{renderTable(orders)}</CardContent></Card></TabsContent>
        <TabsContent value="issues"><Card><CardContent className="p-0">{renderTable(orders)}</CardContent></Card></TabsContent>

      </Tabs>

      <CreateOrderDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onOrderCreated={fetchOrders}
      />
      {selectedOrder && (
        <ShipOrderDialog
          isOpen={isShipDialogOpen}
          onOpenChange={setIsShipDialogOpen}
          orderId={selectedOrder.id}
          onOrderShipped={fetchOrders}
        />
      )}
      {selectedOrder && (
        <UpdateDimensionsDialog
          isOpen={isUpdateDimsOpen}
          onOpenChange={setIsUpdateDimsOpen}
          orderId={selectedOrder.id}
          onDimensionsUpdated={fetchOrders}
        />
      )}

      <OrderDetailsDialog
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        order={selectedOrder}
      />
    </div>
  );
}