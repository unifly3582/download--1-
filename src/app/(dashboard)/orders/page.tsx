'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Order } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, MoreHorizontal, AlertTriangle, Truck, RefreshCw, Search, Download, Filter, X, TrendingUp, Package, Clock, CheckCircle, Maximize2, Minimize2 } from 'lucide-react';
import { CreateOrderDialog } from './create-order-dialog';
import { ShipOrderDialog } from './ship-order-dialog';
import { UpdateDimensionsDialog } from './update-dimensions-dialog';
import { OrderDetailsDialog } from './order-details-dialog';
import { useVirtualizer } from '@tanstack/react-virtual';

import { authenticatedFetch } from '@/lib/api/utils';
import { useOptimizedOrders } from '@/hooks/useOptimizedOrders';


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
  const [activeTab, setActiveTab] = useState('to-approve');
  const { toast } = useToast();

  // Use optimized hook
  const {
    orders,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    updateOrder,
    removeOrder,
    addOrder
  } = useOptimizedOrders({
    status: activeTab,
    pageSize: 50,
    enableCache: true,
    autoRefresh: false // Disable auto-refresh to reduce reads
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isShipDialogOpen, setIsShipDialogOpen] = useState(false);
  const [isUpdateDimsOpen, setIsUpdateDimsOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDisplay | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [isBulkShipping, setIsBulkShipping] = useState(false);
  const [bulkShipCourier, setBulkShipCourier] = useState<'delhivery' | 'manual'>('delhivery');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [courierFilter, setCourierFilter] = useState<string>('all');

  // Sorting State
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // View State
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('expanded');
  const [useVirtualScroll, setUseVirtualScroll] = useState(false);

  // Error Retry State
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  // Virtual scrolling ref
  const parentRef = useRef<HTMLDivElement>(null);



  // Clear selections when switching tabs
  useEffect(() => {
    setSelectedOrders(new Set());
    setSearchQuery('');
    setPaymentFilter('all');
    setSourceFilter('all');
    setCourierFilter('all');
  }, [activeTab]);

  // Filtered orders based on search and filters
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderId.toLowerCase().includes(query) ||
        order.customerInfo.name.toLowerCase().includes(query) ||
        order.customerInfo.phone.includes(query) ||
        order.customerInfo.email?.toLowerCase().includes(query) ||
        order.shippingAddress.zip.includes(query) ||
        order.shipmentInfo?.awb?.toLowerCase().includes(query)
      );
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order =>
        order.paymentInfo.method.toLowerCase() === paymentFilter.toLowerCase()
      );
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(order =>
        order.orderSource === sourceFilter
      );
    }

    // Courier filter
    if (courierFilter !== 'all') {
      filtered = filtered.filter(order =>
        order.shipmentInfo?.courierPartner?.toLowerCase() === courierFilter.toLowerCase()
      );
    }

    return filtered;
  }, [orders, searchQuery, paymentFilter, sourceFilter, courierFilter]);

  // Sorted orders based on sort criteria
  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = a.pricingInfo.grandTotal - b.pricingInfo.grandTotal;
          break;
        case 'name':
          comparison = a.customerInfo.name.localeCompare(b.customerInfo.name);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredOrders, sortBy, sortOrder]);

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: sortedOrders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height in pixels
    overscan: 5, // Number of items to render outside visible area
  });

  // Auto-enable virtual scrolling for large datasets
  useEffect(() => {
    if (sortedOrders.length > 100 && !useVirtualScroll) {
      setUseVirtualScroll(true);
      toast({
        title: 'Virtual Scrolling Enabled',
        description: `Optimized view for ${sortedOrders.length} orders`,
      });
    }
  }, [sortedOrders.length, useVirtualScroll, toast]);

  // Quick Stats Calculation
  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.pricingInfo.grandTotal, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const codOrders = filteredOrders.filter(o => o.paymentInfo.method === 'COD').length;
    const prepaidOrders = filteredOrders.filter(o => o.paymentInfo.method === 'Prepaid').length;

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      codOrders,
      prepaidOrders
    };
  }, [filteredOrders]);

  // Enhanced error handling with retry
  useEffect(() => {
    if (error) {
      setLastError(error);
      toast({
        title: 'Error Fetching Orders',
        description: error,
        variant: 'destructive',
        action: retryCount < 3 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRetryCount(prev => prev + 1);
              refresh();
            }}
          >
            Retry
          </Button>
        ) : undefined
      });
    } else {
      setLastError(null);
      setRetryCount(0);
    }
  }, [error, toast, retryCount, refresh]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('order-search')?.focus();
      }

      // Ctrl/Cmd + A: Select all visible orders
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        handleSelectAll(true, sortedOrders);
      }

      // Escape: Clear selection
      if (e.key === 'Escape') {
        setSelectedOrders(new Set());
        setSearchQuery('');
      }

      // Ctrl/Cmd + R: Refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refresh();
      }

      // Ctrl/Cmd + E: Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }

      // Ctrl/Cmd + N: New order
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsCreateDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sortedOrders, refresh]);

  const handleShipOrderClick = (order: OrderDisplay) => {
    setSelectedOrder(order);
    setIsShipDialogOpen(true);
  };

  const handleUpdateDimsClick = (order: OrderDisplay) => {
    setSelectedOrder(order);
    setIsUpdateDimsOpen(true);
  };

  const handleViewDetailsClick = async (order: OrderDisplay) => {
    // For details dialog, we need full order data
    // Fetch it only when needed
    try {
      const result = await authenticatedFetch(`/api/orders/${order.id}`);
      setSelectedOrder(result.data);
      setIsDetailsDialogOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to load order details: ${error.message}`,
        variant: 'destructive',
      });
    }
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

      // Optimistic update
      updateOrder(order.orderId, {
        internalStatus: 'shipped',
        shipmentInfo: {
          ...order.shipmentInfo,
          courierPartner: 'manual',
          awb: manualAwb
        }
      });

      toast({
        title: 'Success',
        description: `Order ${order.orderId} shipped manually with AWB: ${manualAwb}`,
      });

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
      // Use optimized bulk API
      const result = await authenticatedFetch('/api/orders/bulk-optimized', {
        method: 'POST',
        body: JSON.stringify({
          action: 'cancel',
          orderIds: [orderId]
        }),
      });

      // Optimistic update
      removeOrder(orderId);

      toast({
        title: 'Success',
        description: 'Order cancelled successfully',
      });

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
      // Use optimized bulk API
      const result = await authenticatedFetch('/api/orders/bulk-optimized', {
        method: 'POST',
        body: JSON.stringify({
          action,
          orderIds: Array.from(selectedOrders)
        }),
      });

      // Optimistic updates
      const newStatus = action === 'approve' ? 'approved' : 'cancelled';
      selectedOrders.forEach(orderId => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          if (action === 'approve') {
            updateOrder(order.orderId, {
              internalStatus: newStatus,
              approval: {
                ...order.approval,
                status: 'approved'
              }
            });
          } else {
            removeOrder(order.orderId);
          }
        }
      });

      toast({
        title: 'Success',
        description: result.message,
      });

      setSelectedOrders(new Set());

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

          // Optimistic update
          const order = orders.find(o => o.id === orderId);
          if (order) {
            updateOrder(order.orderId, {
              internalStatus: 'shipped',
              shipmentInfo: {
                ...order.shipmentInfo,
                courierPartner: bulkShipCourier
              }
            });
          }

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
      // Use optimized bulk API
      const result = await authenticatedFetch('/api/orders/bulk-optimized', {
        method: 'POST',
        body: JSON.stringify({
          action: 'cancel',
          orderIds: Array.from(selectedOrders)
        }),
      });

      // Optimistic updates
      selectedOrders.forEach(orderId => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          removeOrder(order.orderId);
        }
      });

      toast({
        title: 'Success',
        description: result.message,
      });

      setSelectedOrders(new Set());

    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to cancel orders: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  // Export to CSV
  const handleExport = useCallback(() => {
    const ordersToExport = selectedOrders.size > 0
      ? sortedOrders.filter(o => selectedOrders.has(o.id))
      : sortedOrders;

    if (ordersToExport.length === 0) {
      toast({
        title: 'No Orders to Export',
        description: 'Please select orders or ensure filters return results.',
        variant: 'destructive',
      });
      return;
    }

    // CSV Headers
    const headers = [
      'Order ID', 'Customer Name', 'Phone', 'Email', 'Address', 'City', 'State', 'Pincode',
      'Order Source', 'Traffic Source', 'Campaign', 'Payment Method', 'Payment Status',
      'Coupon Code', 'Discount', 'Subtotal', 'Shipping', 'COD Charges', 'Grand Total',
      'Status', 'Courier', 'AWB', 'Tracking Status', 'Created At', 'Updated At'
    ];

    // CSV Rows
    const rows = ordersToExport.map(order => [
      order.orderId,
      order.customerInfo.name,
      order.customerInfo.phone,
      order.customerInfo.email || '',
      `"${order.shippingAddress.street}"`,
      order.shippingAddress.city,
      order.shippingAddress.state,
      order.shippingAddress.zip,
      order.orderSource,
      order.trafficSource?.source || '',
      order.trafficSource?.campaign || '',
      order.paymentInfo.method,
      order.paymentInfo.status,
      order.couponCode || '',
      order.pricingInfo.discount,
      order.pricingInfo.subtotal,
      order.pricingInfo.shippingCharges,
      order.pricingInfo.codCharges,
      order.pricingInfo.grandTotal,
      order.internalStatus,
      order.shipmentInfo?.courierPartner || '',
      order.shipmentInfo?.awb || '',
      order.shipmentInfo?.currentTrackingStatus || '',
      order.createdAt,
      order.updatedAt
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Successful',
      description: `Exported ${ordersToExport.length} orders to CSV`,
    });
  }, [sortedOrders, selectedOrders, activeTab, toast]);

  const handleApprovalAction = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      // Use optimized bulk API even for single operations
      const result = await authenticatedFetch('/api/orders/bulk-optimized', {
        method: 'POST',
        body: JSON.stringify({
          action,
          orderIds: [orderId]
        }),
      });

      // Optimistic update
      const order = orders.find(o => o.id === orderId);
      if (order) {
        if (action === 'approve') {
          updateOrder(order.orderId, {
            internalStatus: 'approved',
            approval: {
              ...order.approval,
              status: 'approved'
            }
          });
        } else {
          removeOrder(order.orderId);
        }
      }

      toast({
        title: 'Success',
        description: result.message || `Order successfully ${action === 'approve' ? 'approved' : 'rejected'}.`,
      });

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

  // Priority calculation for visual hierarchy
  const getOrderPriority = (order: OrderDisplay): 'urgent' | 'high' | 'normal' => {
    // Urgent: High value COD orders or orders with issues
    if (order.internalStatus === 'needs_manual_verification') return 'urgent';
    if (order.paymentInfo.method === 'COD' && order.pricingInfo.grandTotal > 5000) return 'urgent';

    // High: High value orders or prepaid
    if (order.pricingInfo.grandTotal > 3000) return 'high';
    if (order.paymentInfo.method === 'Prepaid') return 'high';

    return 'normal';
  };

  const getPriorityColor = (priority: 'urgent' | 'high' | 'normal'): string => {
    switch (priority) {
      case 'urgent': return 'border-l-4 border-l-red-500 bg-red-50/50';
      case 'high': return 'border-l-4 border-l-orange-500 bg-orange-50/50';
      default: return '';
    }
  };

  const getPriorityBadge = (priority: 'urgent' | 'high' | 'normal') => {
    if (priority === 'urgent') return <Badge variant="destructive" className="text-xs">URGENT</Badge>;
    if (priority === 'high') return <Badge variant="outline" className="text-xs border-orange-500 text-orange-700">HIGH VALUE</Badge>;
    return null;
  };

  // Render single order row (reusable for both virtual and regular tables)
  const renderOrderRow = (order: OrderDisplay) => {
    const priority = getOrderPriority(order);
    const priorityClass = getPriorityColor(priority);

    return (
      <TableRow key={order.id} className={priorityClass}>
        <TableCell>
          <input
            type="checkbox"
            checked={selectedOrders.has(order.id)}
            onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
            className="rounded"
          />
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex flex-col gap-1 items-start">
            <span className="text-sm">{order.orderId}</span>
            <div className="w-fit">
              {getPriorityBadge(priority)}
            </div>
          </div>
        </TableCell>

        {/* Date Info */}
        <TableCell>
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          </div>
        </TableCell>

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
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
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
    );
  };

  // Virtual scrolling table
  const renderVirtualTable = () => (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedOrders.size === sortedOrders.length && sortedOrders.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked, sortedOrders)}
                  className="rounded"
                />
              </TableHead>
              <TableHead className="w-20">Order ID</TableHead>
              <TableHead className="w-24">Date</TableHead>
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
        </Table>

        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height: '600px' }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            <Table>
              <TableBody>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const order = sortedOrders[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {renderOrderRow(order)}
                    </div>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More Orders'}
          </Button>
        </div>
      )}
    </div>
  );

  const renderTable = () => (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked, filteredOrders)}
                className="rounded"
              />
            </TableHead>
            <TableHead className="w-20">Order ID</TableHead>
            <TableHead className="w-24">Date</TableHead>
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
          {isLoading && sortedOrders.length === 0 ? (
            <TableRow><TableCell colSpan={11} className="text-center h-24">Loading...</TableCell></TableRow>
          ) : sortedOrders.length > 0 ? (
            sortedOrders.map((order) => renderOrderRow(order))
          ) : (
            <TableRow><TableCell colSpan={11} className="text-center h-24">No orders found in this category.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More Orders'}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Error Banner */}
      {lastError && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Failed to load orders</p>
                  <p className="text-sm text-red-700">{lastError}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {retryCount < 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRetryCount(prev => prev + 1);
                      refresh();
                    }}
                  >
                    Retry ({3 - retryCount} attempts left)
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLastError(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold text-foreground">Orders (Optimized)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Keyboard shortcuts: Ctrl+K (Search), Ctrl+A (Select All), Ctrl+E (Export), Ctrl+N (New Order)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export {selectedOrders.size > 0 ? `(${selectedOrders.size})` : ''}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseVirtualScroll(!useVirtualScroll)}
            title={useVirtualScroll ? 'Disable Virtual Scrolling' : 'Enable Virtual Scrolling'}
          >
            {useVirtualScroll ? <Minimize2 className="mr-2 h-4 w-4" /> : <Maximize2 className="mr-2 h-4 w-4" />}
            {useVirtualScroll ? 'Virtual' : 'Standard'}
          </Button>

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

      {/* Quick Stats Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {activeTab.replace(/-/g, ' ')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(stats.avgOrderValue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">COD Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.codOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalOrders > 0 ? Math.round((stats.codOrders / stats.totalOrders) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prepaid Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.prepaidOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalOrders > 0 ? Math.round((stats.prepaidOrders / stats.totalOrders) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedOrders.size}</div>
            <p className="text-xs text-muted-foreground">
              {filteredOrders.length > orders.length ? `${filteredOrders.length} filtered` : 'No filters'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="order-search"
                  placeholder="Search by Order ID, Name, Phone, Email, Pincode, AWB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Payment: {paymentFilter === 'all' ? 'All' : paymentFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Payment Method</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setPaymentFilter('all')}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPaymentFilter('COD')}>COD</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPaymentFilter('Prepaid')}>Prepaid</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Source: {sourceFilter === 'all' ? 'All' : sourceFilter.replace('_', ' ')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Order Source</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSourceFilter('all')}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSourceFilter('website')}>Website</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSourceFilter('whatsapp')}>WhatsApp</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSourceFilter('manual')}>Manual</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Courier: {courierFilter === 'all' ? 'All' : courierFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Courier Partner</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCourierFilter('all')}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCourierFilter('delhivery')}>Delhivery</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCourierFilter('manual')}>Manual</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sorting Controls */}
              <div className="flex items-center gap-1 border-l pl-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Sort: {sortBy === 'date' ? 'Date' : sortBy === 'amount' ? 'Amount' : 'Name'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy('date')}>Date Created</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('amount')}>Order Amount</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('name')}>Customer Name</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>

              {(searchQuery || paymentFilter !== 'all' || sourceFilter !== 'all' || courierFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setPaymentFilter('all');
                    setSourceFilter('all');
                    setCourierFilter('all');
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>

            {filteredOrders.length !== orders.length && (
              <p className="text-sm text-muted-foreground">
                Showing {filteredOrders.length} of {orders.length} orders
              </p>
            )}

            {/* Priority Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
              <span className="font-medium">Priority Indicators:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border-l-4 border-l-red-500 bg-red-50"></div>
                <span>Urgent (High value COD / Issues)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border-l-4 border-l-orange-500 bg-orange-50"></div>
                <span>High Value (₹3000+)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="to-approve">
        <TabsList>
          <TabsTrigger value="to-approve">To Approve</TabsTrigger>
          <TabsTrigger value="to-ship">To Ship</TabsTrigger>
          <TabsTrigger value="in-transit">In Transit</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>

        </TabsList>
        <TabsContent value="to-approve"><Card><CardContent className="p-0">{useVirtualScroll ? renderVirtualTable() : renderTable()}</CardContent></Card></TabsContent>
        <TabsContent value="to-ship"><Card><CardContent className="p-0">{useVirtualScroll ? renderVirtualTable() : renderTable()}</CardContent></Card></TabsContent>
        <TabsContent value="in-transit"><Card><CardContent className="p-0">{useVirtualScroll ? renderVirtualTable() : renderTable()}</CardContent></Card></TabsContent>
        <TabsContent value="completed"><Card><CardContent className="p-0">{useVirtualScroll ? renderVirtualTable() : renderTable()}</CardContent></Card></TabsContent>
        <TabsContent value="rejected"><Card><CardContent className="p-0">{useVirtualScroll ? renderVirtualTable() : renderTable()}</CardContent></Card></TabsContent>
        <TabsContent value="issues"><Card><CardContent className="p-0">{useVirtualScroll ? renderVirtualTable() : renderTable()}</CardContent></Card></TabsContent>

      </Tabs>

      <CreateOrderDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onOrderCreated={() => {
          setIsCreateDialogOpen(false);
          refresh(); // Refresh to show new order
        }}
      />
      {selectedOrder && (
        <>
          <ShipOrderDialog
            isOpen={isShipDialogOpen}
            onOpenChange={setIsShipDialogOpen}
            orderId={selectedOrder.id}
            onOrderShipped={() => {
              setIsShipDialogOpen(false);
              refresh();
            }}
          />
          <UpdateDimensionsDialog
            isOpen={isUpdateDimsOpen}
            onOpenChange={setIsUpdateDimsOpen}
            orderId={selectedOrder.id}
            onDimensionsUpdated={() => {
              setIsUpdateDimsOpen(false);
              refresh();
            }}
          />
        </>
      )}

      <OrderDetailsDialog
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        order={selectedOrder}
      />
    </div>
  );
}