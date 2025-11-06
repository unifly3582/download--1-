'use client';

import { useState, useCallback, useMemo } from 'react';
import { useVirtualizedCustomers } from '@/hooks/useVirtualizedCustomers';
import type { Customer } from '@/types/customers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, MoreHorizontal, Loader2, ChevronDown, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { authenticatedFetch } from '@/lib/api/utils';
import { useDebounce } from '../../../hooks/useDebounce';
import { CustomerEditDialog } from './customer-edit-dialog';
import { CustomerProfileDialog } from './customer-profile-dialog';

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
}

export default function OptimizedCustomersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ tier: 'all', segment: 'all', region: 'all' });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerProfile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

  // Debounce search to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    customers,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalLoaded
  } = useVirtualizedCustomers({
    pageSize: 25,
    searchTerm: debouncedSearchTerm,
    filters
  });

  const handleFilterChange = useCallback((filterType: string, value: string) => {
    setSearchTerm(''); // Clear search when filtering
    setFilters(prev => ({ ...prev, [filterType]: value }));
  }, []);

  const handleOpenProfileDialog = useCallback(async (customer: Customer) => {
    setIsProfileOpen(true);
    setIsProfileLoading(true);
    setViewingCustomer(null);

    try {
      const result = await authenticatedFetch(`/api/customers/${customer.phone}/profile`);
      setViewingCustomer(result.data);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to load customer profile', 
        variant: 'destructive' 
      });
      setIsProfileOpen(false);
    } finally {
      setIsProfileLoading(false);
    }
  }, [toast]);

  const handleOpenEditDialog = useCallback((customer?: Customer) => {
    setEditingCustomer(customer);
    setIsEditOpen(true);
  }, []);

  const handleEditFromProfile = useCallback(() => {
    if (viewingCustomer) {
      setIsProfileOpen(false);
      setEditingCustomer(viewingCustomer);
      setIsEditOpen(true);
    }
  }, [viewingCustomer]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadMore();
    }
  }, [isLoading, hasMore, loadMore]);

  // Memoize table rows to prevent unnecessary re-renders
  const customerRows = useMemo(() => {
    return customers.map((customer) => (
      <TableRow key={customer.customerId}>
        <TableCell className="font-medium">{customer.name}</TableCell>
        <TableCell>
          <div>{customer.phone}</div>
          <div className="text-sm text-muted-foreground">{customer.email}</div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            <Badge variant="outline">{customer.loyaltyTier}</Badge>
            <Badge variant="secondary">{customer.customerSegment}</Badge>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {customer.tags?.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
            {customer.tags && customer.tags.length > 2 && (
              <Badge variant="outline">+{customer.tags.length - 2}</Badge>
            )}
          </div>
        </TableCell>
        <TableCell>{customer.region}</TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleOpenProfileDialog(customer)}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenEditDialog(customer)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));
  }, [customers, handleOpenProfileDialog]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading customers: {error}
            <Button onClick={refresh} className="ml-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer Dashboard (Optimized)</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {totalLoaded} customers loaded
              </span>
              <Button onClick={() => handleOpenEditDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <Input 
              placeholder="Search by name, phone, or email..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="max-w-xs" 
            />
            <Select 
              value={filters.tier} 
              onValueChange={(v) => handleFilterChange('tier', v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="repeat">Repeat</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={filters.segment} 
              onValueChange={(v) => handleFilterChange('segment', v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Dormant">Dormant</SelectItem>
                <SelectItem value="At Risk">At Risk</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={refresh}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Region</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                customerRows
              )}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-16">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {hasMore && !isLoading && (
            <div className="flex justify-center mt-4">
              <Button 
                variant="outline" 
                onClick={handleLoadMore}
                className="flex items-center gap-2"
              >
                <ChevronDown className="h-4 w-4" />
                Load More Customers
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Profile Dialog */}
      <CustomerProfileDialog
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        customer={viewingCustomer}
        isLoading={isProfileLoading}
        onEdit={handleEditFromProfile}
      />

      {/* Enhanced Edit Dialog */}
      <CustomerEditDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        customer={editingCustomer}
        onSave={() => {
          refresh();
          setIsEditOpen(false);
        }}
      />
    </div>
  );
}