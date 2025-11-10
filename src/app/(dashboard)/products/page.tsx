'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
// REMOVED: All direct Firestore imports
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { ProductForm, ProductFormValues } from './product-form';
import { CategoryManager } from './category-manager';
import type { Product } from '@/types/products';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/utils';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      // CORRECTED: authenticatedFetch already returns parsed JSON
      const result = await authenticatedFetch('/api/products');
      setProducts(result.data || []); // Use result.data
    } catch (error: any) {
      console.error("Error fetching products: ", error);
      toast({ title: 'Error', description: error.message || 'Failed to fetch products.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddProduct = () => {
    setSelectedProduct(undefined);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  // CORRECTED: This now calls our secure back-end API
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    try {
      await authenticatedFetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      toast({ title: 'Success', description: 'Product deleted successfully.' });
      fetchProducts(); // Refresh the list
    } catch (error: any) {
      console.error("Error deleting product: ", error);
      toast({ title: 'Error', description: error.message || 'Failed to delete product.', variant: 'destructive' });
    }
  };

  // CORRECTED: This now calls our secure back-end API for create/update
  const handleFormSubmit = async (values: ProductFormValues) => {
    try {
      if (selectedProduct) {
        // Update existing product
        await authenticatedFetch(`/api/products/admin/update/${selectedProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(values),
        });
        toast({ title: 'Success', description: 'Product updated successfully.' });
      } else {
        // Create new product
        await authenticatedFetch('/api/products/admin/create', {
          method: 'POST',
          body: JSON.stringify(values),
        });
        toast({ title: 'Success', description: 'Product created successfully.' });
      }
      
      setIsFormOpen(false);
      fetchProducts(); // Refresh the list
    } catch (error: any) {
      console.error("Error saving product: ", error);
      toast({ title: 'Error', description: error.message || 'Failed to save product.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h1 className="font-headline text-3xl font-bold text-foreground">Products</h1>
            <div className="flex items-center gap-2">
                <CategoryManager />
                <Button onClick={handleAddProduct}><PlusCircle className="mr-2 h-4 w-4" /> Add Product</Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Inventory</CardTitle>
                <CardDescription>Manage your product catalog and variations.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-center">Variations</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center">Loading products...</TableCell></TableRow>
                        ) : products.map((product) => {
                            const mainImage = product.media?.find(m => m.type === 'image')?.url || '/placeholder.svg';
                            return (
                                <TableRow key={product.id}>
                                    <TableCell className="hidden sm:table-cell">
                                        <Image
                                            alt={product.name}
                                            className="aspect-square rounded-md object-cover"
                                            height="64"
                                            src={mainImage}
                                            width="64"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={product.isActive ? 'default' : 'outline'}>{product.isActive ? 'Active' : 'Draft'}</Badge>
                                    </TableCell>
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell className="text-center">{product.variations?.length || 0}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEditProduct(product)}>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProduct(product.id)}>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <ProductForm
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            product={selectedProduct}
            onSubmit={handleFormSubmit}
        />
    </div>
  );
}