'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Customer } from '@/types/customers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, MoreHorizontal, Loader2, Edit, Download, RefreshCw, Users, Filter as FilterIcon, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { authenticatedFetch } from '@/lib/api/utils';
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

export default function CustomersPage() {
  const { toast } = useToast();
  
  // Data state
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [minOrderValue, setMinOrderValue] = useState<string>('');
  const [maxOrderValue, setMaxOrderValue] = useState<string>('');
  const [minOrders, setMinOrders] = useState<string>('');
  const [lastOrderDays, setLastOrderDays] = useState<string>('');
  
  // Dialog state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerProfile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
  
  // Available states (extracted from data)
  const availableStates = useMemo(() => {
    const states = new Set<string>();
    allCustomers.forEach(customer => {
      if (customer.defaultAddress?.state) {
        states.add(customer.defaultAddress.state);
      }
    });
    return Array.from(states).sort();
  }, [allCustomers]);

  // Load all customers
  const loadAllCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      let allData: Customer[] = [];
      let hasMore = true;
      let cursor: string | undefined;
      let batchCount = 0;
      const maxBatches = 100; // Safety limit

      while (hasMore && batchCount < maxBatches) {
        const params = new URLSearchParams({
          limit: '100',
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
        
        if (cursor) {
          params.append('cursor', cursor);
        }

        const result = await authenticatedFetch(`/api/customers/paginated?${params}`);
        
        if (result.success && result.data.data) {
          allData = [...allData, ...result.data.data];
          hasMore = result.data.hasMore;
          cursor = result.data.nextCursor;
          batchCount++;
          
          // Update progress
          toast({
            title: 'Loading customers...',
            description: `Loaded ${allData.length} customers`,
          });
        } else {
          hasMore = false;
        }
      }

      setAllCustomers(allData);
      setIsDataLoaded(true);
      
      toast({
        title: 'Success!',
        description: `Loaded ${allData.length} customers`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load customers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Apply filters to loaded data
  const filteredCustomers = useMemo(() => {
    let filtered = [...allCustomers];

    // Search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.phone.includes(searchQuery) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.customerId.toLowerCase().includes(searchLower)
      );
    }

    // State filter
    if (stateFilter !== 'all') {
      filtered = filtered.filter(c => c.defaultAddress?.state === stateFilter);
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(c => c.loyaltyTier === tierFilter);
    }

    // Min order value
    if (minOrderValue) {
      const minValue = parseFloat(minOrderValue);
      if (!isNaN(minValue)) {
        filtered = filtered.filter(c => c.totalSpent >= minValue);
      }
    }

    // Max order value
    if (maxOrderValue) {
      const maxValue = parseFloat(maxOrderValue);
      if (!isNaN(maxValue)) {
        filtered = filtered.filter(c => c.totalSpent <= maxValue);
      }
    }

    // Min orders
    if (minOrders) {
      const minOrdersNum = parseInt(minOrders);
      if (!isNaN(minOrdersNum)) {
        filtered = filtered.filter(c => c.totalOrders >= minOrdersNum);
      }
    }

    // Last order days
    if (lastOrderDays) {
      const days = parseInt(lastOrderDays);
      if (!isNaN(days)) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filtered = filtered.filter(c => {
          if (!c.lastOrderAt) return false;
          return new Date(c.lastOrderAt) >= cutoffDate;
        });
      }
    }

    return filtered;
  }, [allCustomers, searchQuery, stateFilter, tierFilter, minOrderValue, maxOrderValue, minOrders, lastOrderDays]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStateFilter('all');
    setTierFilter('all');
    setMinOrderValue('');
    setMaxOrderValue('');
    setMinOrders('');
    setLastOrderDays('');
  }, []);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || stateFilter !== 'all' || tierFilter !== 'all' || 
    minOrderValue || maxOrderValue || minOrders || lastOrderDays;

  // Download CSV
  const handleDownloadCSV = useCallback(() => {
    if (filteredCustomers.length === 0) {
      toast({
        title: 'No Data',
        description: 'No customers to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      // CSV Headers
      const headers = [
        'Customer ID',
        'Name',
        'Phone',
        'Email',
        'Tier',
        'Segment',
        'Total Orders',
        'Total Spent',
        'Last Order Date',
        'Street Address',
        'City',
        'State',
        'Pincode',
        'Region',
        'Created At'
      ];

      // CSV Rows
      const rows = filteredCustomers.map(customer => [
        customer.customerId,
        `"${customer.name}"`,
        customer.phone,
        customer.email || '',
        customer.loyaltyTier,
        customer.customerSegment || '',
        customer.totalOrders,
        customer.totalSpent,
        customer.lastOrderAt || '',
        customer.defaultAddress ? `"${customer.defaultAddress.street}"` : '',
        customer.defaultAddress?.city || '',
        customer.defaultAddress?.state || '',
        customer.defaultAddress?.zip || '',
        customer.region || '',
        customer.createdAt || ''
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
      
      const filterSuffix = tierFilter !== 'all' ? `_${tierFilter}` : '';
      const stateSuffix = stateFilter !== 'all' ? `_${stateFilter}` : '';
      
      link.setAttribute('href', url);
      link.setAttribute('download', `customers${filterSuffix}${stateSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Download Complete',
        description: `Downloaded ${filteredCustomers.length} customers to CSV`,
      });
    } catch (error: any) {
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download CSV',
        variant: 'destructive',
      });
    }
  }, [filteredCustomers, tierFilter, stateFilter, toast]);

  // Open profile dialog
  const handleOpenProfile = useCallback(async (customer: Customer) => {
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

  // Open edit dialog
  const handleOpenEdit = useCallback((customer?: Customer) => {
    setEditingCustomer(customer);
    setIsEditOpen(true);
  }, []);

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customers</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isDataLoaded 
                  ? `${allCustomers.length} customers loaded • Showing ${filteredCustomers.length}`
                  : 'Load all customers to view and filter'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isDataLoaded ? (
                <Button onClick={loadAllCustomers} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Load All Customers
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={loadAllCustomers} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button variant="outline" onClick={handleDownloadCSV} disabled={filteredCustomers.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV ({filteredCustomers.length})
                  </Button>
                  <Button onClick={() => handleOpenEdit()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Customer
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        {isDataLoaded && (
          <CardContent>
            {/* Filters Section */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <FilterIcon className="h-4 w-4" />
                  Filters
                </h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Clear All Filters
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label>Search</Label>
                  <Input
                    placeholder="Name, phone, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* State Filter */}
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {availableStates.map(state => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tier Filter */}
                <div className="space-y-2">
                  <Label>Loyalty Tier</Label>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="Bronze">Bronze</SelectItem>
                      <SelectItem value="Silver">Silver</SelectItem>
                      <SelectItem value="Gold">Gold</SelectItem>
                      <SelectItem value="Platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Min Orders */}
                <div className="space-y-2">
                  <Label>Min Orders</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 3"
                    value={minOrders}
                    onChange={(e) => setMinOrders(e.target.value)}
                  />
                </div>

                {/* Min Spent */}
                <div className="space-y-2">
                  <Label>Min Total Spent (₹)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5000"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                  />
                </div>

                {/* Max Spent */}
                <div className="space-y-2">
                  <Label>Max Total Spent (₹)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 50000"
                    value={maxOrderValue}
                    onChange={(e) => setMaxOrderValue(e.target.value)}
                  />
                </div>

                {/* Last Order Days */}
                <div className="space-y-2">
                  <Label>Last Order Within (days)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 30"
                    value={lastOrderDays}
                    onChange={(e) => setLastOrderDays(e.target.value)}
                  />
                </div>
              </div>

              {/* Filter Summary */}
              {hasActiveFilters && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">
                    Showing {filteredCustomers.length} of {allCustomers.length} customers
                  </p>
                </div>
              )}
            </div>

            {/* Customers Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.customerId}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{customer.phone}</div>
                            {customer.email && (
                              <div className="text-muted-foreground">{customer.email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {customer.defaultAddress?.city && (
                              <div>{customer.defaultAddress.city}</div>
                            )}
                            {customer.defaultAddress?.state && (
                              <div className="text-muted-foreground">{customer.defaultAddress.state}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{customer.loyaltyTier}</Badge>
                        </TableCell>
                        <TableCell>{customer.totalOrders || 0}</TableCell>
                        <TableCell>₹{customer.totalSpent?.toLocaleString() || 0}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(customer.lastOrderAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenProfile(customer)}>
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(customer)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Customer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                        {hasActiveFilters ? 'No customers match the selected filters' : 'No customers found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}

        {!isDataLoaded && !isLoading && (
          <CardContent>
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Load Customer Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click "Load All Customers" to download all customer data once.
                <br />
                You can then filter and view customers without additional API calls.
              </p>
              <Button onClick={loadAllCustomers} size="lg">
                <Users className="mr-2 h-5 w-5" />
                Load All Customers
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Profile Dialog */}
      <CustomerProfileDialog
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        customer={viewingCustomer}
        isLoading={isProfileLoading}
        onEdit={() => {
          if (viewingCustomer) {
            setIsProfileOpen(false);
            handleOpenEdit(viewingCustomer);
          }
        }}
      />

      {/* Edit Dialog */}
      <CustomerEditDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        customer={editingCustomer}
        onSave={() => {
          loadAllCustomers(); // Refresh data after edit
          setIsEditOpen(false);
        }}
      />
    </div>
  );
}
