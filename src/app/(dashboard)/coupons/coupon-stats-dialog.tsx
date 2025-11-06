'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/utils';
import type { Coupon } from '@/types/coupon';
import {
    TrendingUp,
    Users,
    ShoppingCart,
    DollarSign,
    Calendar,
    Percent,
    Target
} from 'lucide-react';

interface CouponStats {
    totalUsage: number;
    totalDiscountGiven: number;
    totalRevenue: number;
    uniqueUsers: number;
    averageOrderValue: number;
    usageByDate: Array<{
        date: string;
        count: number;
        revenue: number;
    }>;
    recentOrders: Array<{
        orderId: string;
        customerName: string;
        orderValue: number;
        discountAmount: number;
        createdAt: string;
    }>;
}

interface CouponStatsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    coupon: Coupon & { id: string };
}

export function CouponStatsDialog({ isOpen, onOpenChange, coupon }: CouponStatsDialogProps) {
    const [stats, setStats] = useState<CouponStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && coupon) {
            fetchStats();
        }
    }, [isOpen, coupon]);

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            const result = await authenticatedFetch(`/api/admin/coupons/${coupon.id}/stats`);
            setStats(result.data);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to fetch coupon statistics',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => `₹${new Intl.NumberFormat('en-IN').format(amount)}`;

    const getCouponTypeDisplay = () => {
        switch (coupon.type) {
            case 'percentage':
                return `${coupon.value}% off`;
            case 'fixed_amount':
                return `${formatCurrency(coupon.value)} off`;
            case 'free_shipping':
                return 'Free shipping';
            default:
                return coupon.type;
        }
    };

    const getUsageProgress = () => {
        if (coupon.usageType === 'single_use') return 100;
        if (!coupon.maxUsageCount) return 0;
        return Math.min(((coupon.currentUsageCount || 0) / coupon.maxUsageCount) * 100, 100);
    };

    if (!coupon) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span>Coupon Statistics: </span>
                        <code className="bg-muted px-2 py-1 rounded text-sm">{coupon.code}</code>
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p>Loading statistics...</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Coupon Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Coupon Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-primary">{getCouponTypeDisplay()}</div>
                                        <div className="text-sm text-muted-foreground">Discount</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold">
                                            {coupon.currentUsageCount || 0}
                                            {coupon.maxUsageCount && `/${coupon.maxUsageCount}`}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Usage</div>
                                    </div>
                                    <div className="text-center">
                                        <Badge variant={coupon.isActive ? 'default' : 'destructive'}>
                                            {coupon.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <div className="text-sm text-muted-foreground mt-1">Status</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm font-medium">
                                            {new Date(coupon.validUntil).toLocaleDateString()}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Expires</div>
                                    </div>
                                </div>

                                {/* Usage Progress Bar */}
                                {coupon.maxUsageCount && (
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Usage Progress</span>
                                            <span>{Math.round(getUsageProgress())}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${getUsageProgress()}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Statistics Cards */}
                        {stats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2">
                                            <ShoppingCart className="h-5 w-5 text-blue-500" />
                                            <div>
                                                <div className="text-2xl font-bold">{stats.totalUsage}</div>
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
                                                <div className="text-2xl font-bold">{formatCurrency(stats.totalDiscountGiven)}</div>
                                                <div className="text-sm text-muted-foreground">Total Discount</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-purple-500" />
                                            <div>
                                                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                                                <div className="text-sm text-muted-foreground">Total Revenue</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-orange-500" />
                                            <div>
                                                <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
                                                <div className="text-sm text-muted-foreground">Unique Users</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Additional Metrics */}
                        {stats && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Performance Metrics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="text-center">
                                            <div className="text-xl font-semibold">{formatCurrency(stats.averageOrderValue)}</div>
                                            <div className="text-sm text-muted-foreground">Average Order Value</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-semibold">
                                                {stats.totalUsage > 0 ? Math.round((stats.totalDiscountGiven / stats.totalRevenue) * 100) : 0}%
                                            </div>
                                            <div className="text-sm text-muted-foreground">Discount Rate</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-semibold">
                                                {stats.uniqueUsers > 0 ? Math.round(stats.totalUsage / stats.uniqueUsers * 100) / 100 : 0}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Avg Uses per User</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Orders */}
                        {stats && stats.recentOrders.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Orders</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {stats.recentOrders.slice(0, 5).map((order, index) => (
                                            <div key={order.orderId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                                <div>
                                                    <div className="font-medium">{order.orderId}</div>
                                                    <div className="text-sm text-muted-foreground">{order.customerName}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium">{formatCurrency(order.orderValue)}</div>
                                                    <div className="text-sm text-green-600">-{formatCurrency(order.discountAmount)}</div>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* No Data Message */}
                        {stats && stats.totalUsage === 0 && (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <div className="text-muted-foreground">
                                        <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <h3 className="text-lg font-medium mb-2">No Usage Yet</h3>
                                        <p>This coupon hasn't been used by any customers yet.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}