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
    ExternalLink
} from 'lucide-react';
import type { Order } from '@/types/order';

interface OrderDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    order: Order & { id: string } | null;
}

export function OrderDetailsDialog({ isOpen, onOpenChange, order }: OrderDetailsDialogProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

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
        </Dialog>
    );
}