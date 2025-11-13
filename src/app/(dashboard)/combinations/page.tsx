'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Search, Edit, Trash2, RefreshCw, X, Box } from 'lucide-react';
import { EditCombinationDialog } from './edit-combination-dialog';
import { authenticatedFetch } from '@/lib/api/utils';

interface CombinationItem {
  productId: string;
  variationId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  sku: string;
}

interface Combination {
  combinationHash: string;
  items: CombinationItem[];
  weight: number;
  dimensions: {
    l: number;
    b: number;
    h: number;
  };
  verifiedBy: string;
  verifiedAt: string;
  notes?: string;
  isActive: boolean;
  usageCount: number;
  totalItems: number;
  uniqueProducts: number;
  lastUsedAt?: string;
}

export default function CombinationsPage() {
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCombination, setSelectedCombination] = useState<Combination | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchCombinations = async () => {
    setIsLoading(true);
    try {
      const result = await authenticatedFetch('/api/combinations');
      setCombinations(result.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to load combinations: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCombinations();
  }, []);

  const filteredCombinations = useMemo(() => {
    if (!searchQuery.trim()) return combinations;
    
    const query = searchQuery.toLowerCase();
    return combinations.filter(combo =>
      combo.items.some(item => 
        item.productName.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query)
      ) ||
      combo.combinationHash.toLowerCase().includes(query)
    );
  }, [combinations, searchQuery]);

  const handleEdit = (combination: Combination) => {
    setSelectedCombination(combination);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (combinationHash: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this combination? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await authenticatedFetch(`/api/combinations/${combinationHash}`, {
        method: 'DELETE',
      });

      toast({
        title: 'Success',
        description: 'Combination deleted successfully',
      });

      fetchCombinations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to delete combination: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (combinationHash: string, isActive: boolean) => {
    try {
      await authenticatedFetch(`/api/combinations/${combinationHash}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !isActive }),
      });

      toast({
        title: 'Success',
        description: `Combination ${!isActive ? 'activated' : 'deactivated'} successfully`,
      });

      fetchCombinations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to update combination: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const stats = useMemo(() => {
    const total = combinations.length;
    const active = combinations.filter(c => c.isActive).length;
    const totalUsage = combinations.reduce((sum, c) => sum + c.usageCount, 0);
    
    return { total, active, totalUsage };
  }, [combinations]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold text-foreground">Product Combinations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage verified product combinations with weight and dimensions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCombinations} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Combinations</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              Times used in orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Usage</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? (stats.totalUsage / stats.total).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per combination
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name, SKU, or hash..."
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
          {filteredCombinations.length !== combinations.length && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing {filteredCombinations.length} of {combinations.length} combinations
            </p>
          )}
        </CardContent>
      </Card>

      {/* Combinations Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Products</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Dimensions (L×B×H)</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    Loading combinations...
                  </TableCell>
                </TableRow>
              ) : filteredCombinations.length > 0 ? (
                filteredCombinations.map((combo) => (
                  <TableRow key={combo.combinationHash}>
                    <TableCell>
                      <div className="space-y-2">
                        {combo.items.map((item, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-xs text-muted-foreground">
                              SKU: {item.sku} × {item.quantity}
                            </div>
                          </div>
                        ))}
                        <div className="text-xs text-muted-foreground pt-1 border-t">
                          {combo.totalItems} items, {combo.uniqueProducts} unique products
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{combo.weight}g</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {combo.dimensions.l} × {combo.dimensions.b} × {combo.dimensions.h} cm
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="secondary">{combo.usageCount} times</Badge>
                        {combo.lastUsedAt && (
                          <div className="text-xs text-muted-foreground">
                            Last: {new Date(combo.lastUsedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={combo.isActive ? 'default' : 'outline'}>
                        {combo.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {new Date(combo.verifiedAt).toLocaleDateString()}
                        </div>
                        {combo.notes && (
                          <div className="text-xs text-muted-foreground">
                            {combo.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(combo)}
                          title="Edit combination"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(combo.combinationHash, combo.isActive)}
                          title={combo.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Package className={`h-4 w-4 ${combo.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(combo.combinationHash)}
                          title="Delete combination"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No combinations found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedCombination && (
        <EditCombinationDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          combination={selectedCombination}
          onCombinationUpdated={() => {
            setIsEditDialogOpen(false);
            fetchCombinations();
          }}
        />
      )}
    </div>
  );
}
