'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Coupon } from '@/types/coupon';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, MoreHorizontal, Edit, Trash2, BarChart3 } from 'lucide-react';
import { CreateCouponDialog } from '@/app/(dashboard)/coupons/create-coupon-dialog';
import { EditCouponDialog } from '@/app/(dashboard)/coupons/edit-coupon-dialog';
import { CouponStatsDialog } from '@/app/(dashboard)/coupons/coupon-stats-dialog';
import { authenticatedFetch } from '@/lib/api/utils';

type CouponDisplay = Coupon & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponDisplay | null>(null);

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const isActive = activeTab === 'active' ? 'true' : activeTab === 'inactive' ? 'false' : null;
      const params = new URLSearchParams();
      if (isActive !== null) params.append('isActive', isActive);
      
      const result = await authenticatedFetch(`/api/admin/coupons?${params.toString()}`);
      setCoupons(result.data);
    } catch (error: any) {
      toast({ 
        title: 'Error Fetching Coupons', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, activeTab]);

  useEffect(() => { 
    fetchCoupons(); 
  }, [fetchCoupons]);

  const handleEditClick = (coupon: CouponDisplay) => {
    setSelectedCoupon(coupon);
    setIsEditDialogOpen(true);
  };

  const handleStatsClick = (coupon: CouponDisplay) => {
    setSelectedCoupon(coupon);
    setIsStatsDialogOpen(true);
  };

  const handleDeactivate = async (couponId: string) => {
    try {
      await authenticatedFetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
      });
      
      toast({
        title: 'Success',
        description: 'Coupon deactivated successfully',
      });
      fetchCoupons();
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to deactivate coupon: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => `₹${new Intl.NumberFormat('en-IN').format(amount)}`;
  
  const getCouponTypeDisplay = (coupon: CouponDisplay) => {
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

  const getUsageDisplay = (coupon: CouponDisplay) => {
    if (coupon.usageType === 'single_use') {
      return `Single use (${coupon.currentUsageCount || 0} used)`;
    }
    
    let display = `${coupon.currentUsageCount || 0}/${coupon.maxUsageCount || '∞'} used`;
    
    if (coupon.maxUsagePerUser) {
      display += ` • Max ${coupon.maxUsagePerUser}/user`;
    }
    
    return display;
  };

  const getStatusVariant = (isActive: boolean, validUntil: string): "default" | "secondary" | "destructive" => {
    if (!isActive) return 'destructive';
    if (new Date(validUntil) < new Date()) return 'secondary';
    return 'default';
  };

  const getStatusText = (isActive: boolean, validUntil: string) => {
    if (!isActive) return 'Inactive';
    if (new Date(validUntil) < new Date()) return 'Expired';
    return 'Active';
  };

  const renderTable = (couponList: CouponDisplay[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Usage</TableHead>
          <TableHead>Valid Until</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Min Order</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center h-24">Loading...</TableCell>
          </TableRow>
        ) : couponList.length > 0 ? (
          couponList.map((coupon) => (
            <TableRow key={coupon.id}>
              <TableCell className="font-medium font-mono">{coupon.code}</TableCell>
              <TableCell>{getCouponTypeDisplay(coupon)}</TableCell>
              <TableCell className="text-sm">{getUsageDisplay(coupon)}</TableCell>
              <TableCell>{new Date(coupon.validUntil).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(coupon.isActive, coupon.validUntil)}>
                  {getStatusText(coupon.isActive, coupon.validUntil)}
                </Badge>
              </TableCell>
              <TableCell>
                {coupon.minimumOrderValue ? formatCurrency(coupon.minimumOrderValue) : 'None'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4"/>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleStatsClick(coupon)}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Stats
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditClick(coupon)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {coupon.isActive && (
                      <DropdownMenuItem 
                        onClick={() => handleDeactivate(coupon.id)} 
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="text-center h-24">
              No coupons found in this category.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold text-foreground">Coupons</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> 
          Create Coupon
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <Card>
            <CardContent className="p-0">
              {renderTable(coupons)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inactive">
          <Card>
            <CardContent className="p-0">
              {renderTable(coupons)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              {renderTable(coupons)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateCouponDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCouponCreated={fetchCoupons}
      />

      {selectedCoupon && (
        <EditCouponDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          coupon={selectedCoupon}
          onCouponUpdated={fetchCoupons}
        />
      )}

      {selectedCoupon && (
        <CouponStatsDialog
          isOpen={isStatsDialogOpen}
          onOpenChange={setIsStatsDialogOpen}
          coupon={selectedCoupon}
        />
      )}
    </div>
  );
}