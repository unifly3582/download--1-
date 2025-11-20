'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
    Package,
    User,
    MapPin,
    CreditCard,
    Truck,
    Tag,
    Calendar,
    Phone,
    Mail,
    Copy,
    ExternalLink,
    ClipboardList,
    Plus
} from 'lucide-react';
import type { Order } from '@/types/order';
import { AddActionLogDialog } from './add-action-log-dialog';

interface OrderDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    order: Order & { id: string } | null;
    onRefresh?: () => void;
}

export function OrderDetailsDialog({ isOpen, onOpenChange, order, onRefresh }: OrderDetailsDialogProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [showActionLogDialog, setShowActionLogDialog] = useState(false);

    if (!order) return null;

    const formatCurrency = (amount: number) => `₹${new Intl.NumberFormat('en-IN').format(amount)}`;

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getStatusColor = (status: string) => {
        if (status.includes('delivered') || status.includes('approved')) return 'bg-green-100 text-green-800';
        if (status.includes('cancelled') || status.includes('rejected')) return 'bg-red-100 text-red-800';
        if (status.includes('shipped') || status.includes('transit')) return 'bg-blue-100 text-blue-800';
        if (status.includes('pending')) return 'bg-yellow-100 text-yellow-800';
        return 'bg-gray-100 text-gray-800';
    };

    const getActionTypeLabel = (actionType: string) => {
        const labels: Record<string, string> = {
            call_placed: '📞 Call Placed',
            call_attempted: '📵 Call Attempted',
            whatsapp_sent: '💬 WhatsApp Sent',
            email_sent: '📧 Email Sent',
            sms_sent: '📱 SMS Sent',
            ticket_raised: '🎫 Ticket Raised',
            address_verified: '📍 Address Verified',
            address_updated: '🔄 Address Updated',
            payment_verified: '💳 Payment Verified',
            payment_issue: '⚠️ Payment Issue',
            refund_initiated: '💰 Refund Initiated',
            courier_contacted: '🚚 Courier Contacted',
            shipment_delayed: '⏰ Shipment Delayed',
            delivery_rescheduled: '📅 Delivery Rescheduled',
            customer_complaint: '😟 Customer Complaint',
            quality_issue: '⚠️ Quality Issue',
            return_requested: '↩️ Return Requested',
            replacement_sent: '🔄 Replacement Sent',
            follow_up: '👀 Follow-up',
            internal_note: '📝 Internal Note',
            other: '📋 Other'
        };
        return labels[actionType] || actionType;
    };

    const getOutcomeColor = (outcome: string) => {
        const colors: Record<string, string> = {
            resolved: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            escalated: 'bg-orange-100 text-orange-800',
            no_response: 'bg-gray-100 text-gray-800'
        };
        return colors[outcome] || 'bg-gray-100 text-gray-800';
    };

    // Action log is now available for all orders, not just pending ones
    const hasActionLog = order.shipmentInfo?.actionLog && order.shipmentInfo.actionLog.length > 0;
    const actionLogCount = order.shipmentInfo?.actionLog?.length || 0;
    
    // Calculate action log summary
    const actionLogSummary = order.shipmentInfo?.actionLog ? {
        total: order.shipmentInfo.actionLog.length,
        resolved: order.shipmentInfo.actionLog.filter(log => log.outcome === 'resolved').length,
        pending: order.shipmentInfo.actionLog.filter(log => log.outcome === 'pending').length,
        escalated: order.shipmentInfo.actionLog.filter(log => log.outcome === 'escalated').length,
        noResponse: order.shipmentInfo.actionLog.filter(log => log.outcome === 'no_response').length,
        lastAction: order.shipmentInfo.actionLog.length > 0 
            ? order.shipmentInfo.actionLog.sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              )[0]
            : null,
        pendingActions: order.shipmentInfo.actionLog.filter(log => 
            log.nextAction && log.outcome !== 'resolved'
        ).length
    } : null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Order Details: {order.orderId}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Customer Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <div className="font-medium">{order.customerInfo.name}</div>
                                <div className="text-sm text-muted-foreground">Customer ID: {order.customerInfo.customerId}</div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono">{order.customerInfo.phone}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(order.customerInfo.phone, 'phone')}
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>

                            {order.customerInfo.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{order.customerInfo.email}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(order.customerInfo.email!, 'email')}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Shipping Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-sm">
                                <div>{order.shippingAddress.street}</div>
                                <div>{order.shippingAddress.city}, {order.shippingAddress.state}</div>
                                <div className="font-medium">PIN: {order.shippingAddress.zip}</div>
                                <div>{order.shippingAddress.country}</div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(
                                    `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zip}`,
                                    'address'
                                )}
                            >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Address
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Payment Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Payment Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Badge variant={order.paymentInfo.status === 'Completed' ? 'default' : 'secondary'}>
                                    {order.paymentInfo.method}
                                </Badge>
                                <Badge variant="outline">
                                    {order.paymentInfo.status}
                                </Badge>
                            </div>

                            {order.paymentInfo.transactionId && (
                                <div>
                                    <div className="text-sm text-muted-foreground">Transaction ID:</div>
                                    <div className="font-mono text-sm flex items-center gap-2">
                                        {order.paymentInfo.transactionId}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(order.paymentInfo.transactionId!, 'txn')}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Coupon Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                Coupon & Discounts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {order.couponCode ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono">
                                            {order.couponCode}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(order.couponCode!, 'coupon')}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    {order.couponDetails && (
                                        <div className="space-y-1">
                                            <div className="text-sm text-muted-foreground">Discount Applied:</div>
                                            <div className="text-lg font-medium text-green-600">
                                                -{formatCurrency(order.couponDetails.discountAmount)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Type: {order.couponDetails.couponType}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">No coupon applied</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Shipping Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                Shipping Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {order.shipmentInfo?.courierPartner && (
                                <div>
                                    <div className="text-sm text-muted-foreground">Courier Partner:</div>
                                    <div className="font-medium">{order.shipmentInfo.courierPartner}</div>
                                </div>
                            )}

                            {order.shipmentInfo?.awb && (
                                <div>
                                    <div className="text-sm text-muted-foreground">AWB Number:</div>
                                    <div className="font-mono flex items-center gap-2">
                                        {order.shipmentInfo.awb}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(order.shipmentInfo.awb!, 'awb')}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {order.shipmentInfo?.trackingUrl && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(order.shipmentInfo.trackingUrl, '_blank')}
                                >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Track Package
                                </Button>
                            )}

                            {order.shipmentInfo?.currentTrackingStatus && (
                                <div>
                                    <div className="text-sm text-muted-foreground">Current Status:</div>
                                    <Badge className={getStatusColor(order.shipmentInfo.currentTrackingStatus)}>
                                        {order.shipmentInfo.currentTrackingStatus}
                                    </Badge>
                                </div>
                            )}

                            {order.shipmentInfo?.trackingLocation && (
                                <div>
                                    <div className="text-sm text-muted-foreground">Current Location:</div>
                                    <div className="text-sm font-medium">{order.shipmentInfo.trackingLocation}</div>
                                </div>
                            )}

                            {order.shipmentInfo?.trackingInstructions && (
                                <div>
                                    <div className="text-sm text-muted-foreground">Instructions:</div>
                                    <div className="text-sm">{order.shipmentInfo.trackingInstructions}</div>
                                </div>
                            )}

                            {order.shipmentInfo?.lastTrackedAt && (
                                <div>
                                    <div className="text-sm text-muted-foreground">Last Tracked:</div>
                                    <div className="text-sm">
                                        {new Date(order.shipmentInfo.lastTrackedAt).toLocaleString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </div>
                                </div>
                            )}

                            {order.shipmentInfo?.shippedAt && (
                                <div>
                                    <div className="text-sm text-muted-foreground">Shipped On:</div>
                                    <div className="text-sm">
                                        {new Date(order.shipmentInfo.shippedAt).toLocaleString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Order Status & Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <div className="text-sm text-muted-foreground">Internal Status:</div>
                                <Badge className={getStatusColor(order.internalStatus)}>
                                    {order.internalStatus.replace(/_/g, ' ')}
                                </Badge>
                            </div>

                            {order.customerFacingStatus && (
                                <div>
                                    <div className="text-sm text-muted-foreground">Customer Status:</div>
                                    <Badge variant="outline">
                                        {order.customerFacingStatus}
                                    </Badge>
                                </div>
                            )}

                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">Order Date:</div>
                                <div className="text-sm">
                                    {typeof order.createdAt === 'string'
                                        ? new Date(order.createdAt).toLocaleString()
                                        : order.createdAt.toDate().toLocaleString()
                                    }
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">Last Updated:</div>
                                <div className="text-sm">
                                    {typeof order.updatedAt === 'string'
                                        ? new Date(order.updatedAt).toLocaleString()
                                        : order.updatedAt.toDate().toLocaleString()
                                    }
                                </div>
                            </div>

                            {order.deliveryEstimate?.expectedDate && (
                                <div className="space-y-1 pt-2 border-t">
                                    <div className="text-sm text-muted-foreground">Expected Delivery:</div>
                                    <div className="text-sm font-medium text-green-600">
                                        {new Date(order.deliveryEstimate.expectedDate).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                        {order.deliveryEstimate.timeSlot && (
                                            <span className="ml-2 text-xs">
                                                ({order.deliveryEstimate.timeSlot})
                                            </span>
                                        )}
                                    </div>
                                    {order.deliveryEstimate.confidence && (
                                        <div className="text-xs text-muted-foreground">
                                            Confidence: {order.deliveryEstimate.confidence}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Order Items */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                    <div className="space-y-1">
                                        <div className="font-medium">{item.productName}</div>
                                        <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                                        {item.hsnCode && (
                                            <div className="text-xs text-muted-foreground">HSN: {item.hsnCode}</div>
                                        )}
                                    </div>
                                    <div className="text-right space-y-1">
                                        <div className="font-medium">Qty: {item.quantity}</div>
                                        <div className="text-sm">{formatCurrency(item.unitPrice)} each</div>
                                        <div className="font-medium">{formatCurrency(item.quantity * item.unitPrice)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Pricing Breakdown */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Pricing Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(order.pricingInfo.subtotal)}</span>
                            </div>

                            {order.pricingInfo.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount:</span>
                                    <span>-{formatCurrency(order.pricingInfo.discount)}</span>
                                </div>
                            )}

                            {order.pricingInfo.shippingCharges > 0 && (
                                <div className="flex justify-between">
                                    <span>Shipping:</span>
                                    <span>{formatCurrency(order.pricingInfo.shippingCharges)}</span>
                                </div>
                            )}

                            {order.pricingInfo.codCharges > 0 && (
                                <div className="flex justify-between">
                                    <span>COD Charges:</span>
                                    <span>{formatCurrency(order.pricingInfo.codCharges)}</span>
                                </div>
                            )}

                            {order.pricingInfo.taxes > 0 && (
                                <div className="flex justify-between">
                                    <span>Taxes:</span>
                                    <span>{formatCurrency(order.pricingInfo.taxes)}</span>
                                </div>
                            )}

                            <Separator />

                            <div className="flex justify-between font-bold text-lg">
                                <span>Grand Total:</span>
                                <span>{formatCurrency(order.pricingInfo.grandTotal)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Log - Available for All Orders */}
                <Card className="mt-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            Action Log
                            {actionLogCount > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {actionLogCount} {actionLogCount === 1 ? 'entry' : 'entries'}
                                </Badge>
                            )}
                        </CardTitle>
                        <Button
                            size="sm"
                            onClick={() => setShowActionLogDialog(true)}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Action
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {/* Action Log Summary */}
                        {actionLogSummary && actionLogSummary.total > 0 && (
                            <div className="mb-6 p-4 bg-muted rounded-lg">
                                <div className="text-sm font-medium mb-3">Summary</div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {actionLogSummary.resolved}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Resolved</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-yellow-600">
                                            {actionLogSummary.pending}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Pending</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {actionLogSummary.escalated}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Escalated</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-600">
                                            {actionLogSummary.noResponse}
                                        </div>
                                        <div className="text-xs text-muted-foreground">No Response</div>
                                    </div>
                                </div>
                                
                                {actionLogSummary.lastAction && (
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="text-xs text-muted-foreground mb-1">Last Action</div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="text-xs">
                                                {getActionTypeLabel(actionLogSummary.lastAction.actionType)}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(actionLogSummary.lastAction.timestamp).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            <Badge className={`text-xs ${getOutcomeColor(actionLogSummary.lastAction.outcome)}`}>
                                                {actionLogSummary.lastAction.outcome.replace(/_/g, ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                                
                                {actionLogSummary.pendingActions > 0 && (
                                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                        <span className="font-medium text-yellow-800">
                                            ⚠️ {actionLogSummary.pendingActions} pending {actionLogSummary.pendingActions === 1 ? 'action' : 'actions'} requiring follow-up
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Action Log Entries */}
                        {hasActionLog ? (
                                <div className="space-y-4">
                                    {order.shipmentInfo?.actionLog
                                        ?.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                        .map((log) => (
                                            <div key={log.actionId} className="border rounded-lg p-4 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline">
                                                                {getActionTypeLabel(log.actionType)}
                                                            </Badge>
                                                            <Badge className={getOutcomeColor(log.outcome)}>
                                                                {log.outcome.replace(/_/g, ' ')}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(log.timestamp).toLocaleString('en-IN', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                            {' • '}
                                                            by {log.actionBy}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div>
                                                        <div className="text-sm font-medium text-muted-foreground">Action Taken:</div>
                                                        <div className="text-sm">{log.actionDetails}</div>
                                                    </div>

                                                    {log.customerResponse && (
                                                        <div>
                                                            <div className="text-sm font-medium text-muted-foreground">Customer Response:</div>
                                                            <div className="text-sm">{log.customerResponse}</div>
                                                        </div>
                                                    )}

                                                    {log.nextAction && (
                                                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                                            <div className="text-sm font-medium text-yellow-800">Next Action:</div>
                                                            <div className="text-sm text-yellow-700">{log.nextAction}</div>
                                                            {log.nextActionBy && (
                                                                <div className="text-xs text-yellow-600 mt-1">
                                                                    Follow up by: {new Date(log.nextActionBy).toLocaleString('en-IN', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        hour12: true
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {log.notes && (
                                                        <div>
                                                            <div className="text-sm font-medium text-muted-foreground">Notes:</div>
                                                            <div className="text-sm text-muted-foreground italic">{log.notes}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No actions logged yet</p>
                                    <p className="text-sm">Click "Add Action" to log your first action</p>
                                </div>
                            )}
                    </CardContent>
                </Card>

                {/* Traffic Source (if available) */}
                {order.trafficSource && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Traffic Source</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Source:</span>
                                    <span className="ml-2 font-medium">{order.trafficSource.source}</span>
                                </div>
                                {order.trafficSource.medium && (
                                    <div>
                                        <span className="text-muted-foreground">Medium:</span>
                                        <span className="ml-2">{order.trafficSource.medium}</span>
                                    </div>
                                )}
                                {order.trafficSource.campaign && (
                                    <div>
                                        <span className="text-muted-foreground">Campaign:</span>
                                        <span className="ml-2">{order.trafficSource.campaign}</span>
                                    </div>
                                )}
                                {order.trafficSource.referrer && (
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground">Referrer:</span>
                                        <span className="ml-2 text-xs break-all">{order.trafficSource.referrer}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </DialogContent>

            {/* Add Action Log Dialog */}
            <AddActionLogDialog
                isOpen={showActionLogDialog}
                onOpenChange={setShowActionLogDialog}
                orderId={order.orderId}
                onSuccess={() => {
                    if (onRefresh) {
                        onRefresh();
                    }
                }}
            />
        </Dialog>
    );
}