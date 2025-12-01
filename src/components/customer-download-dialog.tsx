'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Filter, Users, Calendar } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api/utils';

interface Customer {
  customerId: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyTier: string;
  customerSegment?: string;
  region?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
  createdAt: string;
  defaultAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  savedAddresses?: Array<{
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }>;
}

interface CustomerDownloadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDownloadDialog({ isOpen, onOpenChange }: CustomerDownloadDialogProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  
  // Filters
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [minOrderValue, setMinOrderValue] = useState<string>('');
  const [maxOrderValue, setMaxOrderValue] = useState<string>('');
  const [minOrders, setMinOrders] = useState<string>('');
  const [lastOrderDays, setLastOrderDays] = useState<string>('');
  
  // Available states (will be populated from data)
  const [availableStates, setAvailableStates] = useState<string[]>([]);

  // Fetch all customers when dialog opens
  useEffect(() => {
    if (isOpen && customers.length === 0) {
      fetchAllCustomers();
    }
  }, [isOpen]);

  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters();
  }, [customers, tierFilter, stateFilter, minOrderValue, maxOrderValue, minOrders, lastOrderDays]);

  const fetchAllCustomers = async () => {
    setIsFetching(true);
    try {
      let allCustomers: Customer[] = [];
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
          allCustomers = [...allCustomers, ...result.data.data];
          hasMore = result.data.hasMore;
          cursor = result.data.nextCursor;
          batchCount++;
          
          // Update progress
          toast({
            title: 'Fetching customers...',
            description: `Loaded ${allCustomers.length} customers`,
          });
        } else {
          hasMore = false;
        }
      }

      setCustomers(allCustomers);
      
      // Extract unique states from defaultAddress and savedAddresses
      const states = new Set<string>();
      allCustomers.forEach(customer => {
        // Check default address
        if (customer.defaultAddress?.state) {
          states.add(customer.defaultAddress.state);
        }
        // Check saved addresses
        if (customer.savedAddresses && customer.savedAddresses.length > 0) {
          customer.savedAddresses.forEach(addr => {
            if (addr.state) {
              states.add(addr.state);
            }
          });
        }
      });
      setAvailableStates(Array.from(states).sort());

      toast({
        title: 'Success',
        description: `Loaded ${allCustomers.length} customers`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch customers',
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...customers];

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(c => c.loyaltyTier === tierFilter);
    }

    // State filter - check both defaultAddress and savedAddresses
    if (stateFilter !== 'all') {
      filtered = filtered.filter(c => {
        // Check default address
        if (c.defaultAddress?.state === stateFilter) return true;
        // Check saved addresses
        if (c.savedAddresses && c.savedAddresses.some(addr => addr.state === stateFilter)) return true;
        return false;
      });
    }

    // Min order value filter
    if (minOrderValue) {
      const minValue = parseFloat(minOrderValue);
      if (!isNaN(minValue)) {
        filtered = filtered.filter(c => c.totalSpent >= minValue);
      }
    }

    // Max order value filter
    if (maxOrderValue) {
      const maxValue = parseFloat(maxOrderValue);
      if (!isNaN(maxValue)) {
        filtered = filtered.filter(c => c.totalSpent <= maxValue);
      }
    }

    // Min orders filter
    if (minOrders) {
      const minOrdersNum = parseInt(minOrders);
      if (!isNaN(minOrdersNum)) {
        filtered = filtered.filter(c => c.totalOrders >= minOrdersNum);
      }
    }

    // Last order days filter
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

    setFilteredCustomers(filtered);
  }, [customers, tierFilter, stateFilter, minOrderValue, maxOrderValue, minOrders, lastOrderDays]);

  const handleDownloadCSV = () => {
    if (filteredCustomers.length === 0) {
      toast({
        title: 'No Data',
        description: 'No customers match the selected filters',
        variant: 'destructive',
      });
      return;
    }

    setIsDownloading(true);

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
      const rows = filteredCustomers.map(customer => {
        const address = customer.defaultAddress || (customer.savedAddresses && customer.savedAddresses[0]);
        return [
          customer.customerId,
          `"${customer.name}"`,
          customer.phone,
          customer.email || '',
          customer.loyaltyTier,
          customer.customerSegment || '',
          customer.totalOrders,
          customer.totalSpent,
          customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString('en-IN') : '',
          address ? `"${address.street}"` : '',
          address?.city || '',
          address?.state || '',
          address?.zip || '',
          customer.region || '',
          new Date(customer.createdAt).toLocaleDateString('en-IN')
        ];
      });

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

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download CSV',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClearFilters = () => {
    setTierFilter('all');
    setStateFilter('all');
    setMinOrderValue('');
    setMaxOrderValue('');
    setMinOrders('');
    setLastOrderDays('');
  };

  const hasActiveFilters = tierFilter !== 'all' || stateFilter !== 'all' || 
    minOrderValue || maxOrderValue || minOrders || lastOrderDays;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Download Customer Data
          </DialogTitle>
          <DialogDescription>
            Download all customer data locally and apply filters before exporting to CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {isFetching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Fetching customers...</span>
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {customers.length} customers loaded
                  </span>
                </>
              )}
            </div>
            {customers.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAllCustomers}
                disabled={isFetching}
              >
                Refresh Data
              </Button>
            )}
          </div>

          {/* Filters */}
          {customers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter Customers
                </h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Tier Filter */}
                <div className="space-y-2">
                  <Label>Loyalty Tier</Label>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger>
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

                {/* Min Order Value */}
                <div className="space-y-2">
                  <Label>Min Total Spent (₹)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 1000"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                  />
                </div>

                {/* Max Order Value */}
                <div className="space-y-2">
                  <Label>Max Total Spent (₹)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 50000"
                    value={maxOrderValue}
                    onChange={(e) => setMaxOrderValue(e.target.value)}
                  />
                </div>

                {/* Min Orders */}
                <div className="space-y-2">
                  <Label>Min Number of Orders</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 3"
                    value={minOrders}
                    onChange={(e) => setMinOrders(e.target.value)}
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

              {/* Filter Results */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Filtered Results: {filteredCustomers.length} customers
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {hasActiveFilters 
                        ? `Filtered from ${customers.length} total customers`
                        : 'No filters applied - showing all customers'
                      }
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    {filteredCustomers.length}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isFetching || isDownloading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDownloadCSV}
            disabled={isFetching || isDownloading || filteredCustomers.length === 0}
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download CSV ({filteredCustomers.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
