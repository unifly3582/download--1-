'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, doc, writeBatch, query, where, getDocs as getDbDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Category {
    id: string;
    name: string;
}

export function CategoryManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [updatedName, setUpdatedName] = useState('');
    const { toast } = useToast();

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const categoriesCol = collection(db, 'categories');
            const categorySnapshot = await getDocs(categoriesCol);
            const categoryList = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(categoryList);
        } catch (error) {
            toast({ title: 'Error', description: 'Could not load categories.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleEditClick = (category: Category) => {
        setSelectedCategory(category);
        setUpdatedName(category.name);
        setIsEditDialogOpen(true);
    };

    const handleDeleteClick = (category: Category) => {
        setSelectedCategory(category);
        setIsDeleteDialogOpen(true);
    };

    const handleUpdateCategory = async () => {
        if (!selectedCategory || updatedName.trim().length < 2) {
            toast({ title: 'Error', description: 'Category name is too short.', variant: 'destructive' });
            return;
        }

        const batch = writeBatch(db);
        const categoryRef = doc(db, 'categories', selectedCategory.id);

        // Find all products with the old category name and update them
        const productsQuery = query(collection(db, "products"), where("category", "==", selectedCategory.name));
        const productsSnapshot = await getDbDocs(productsQuery);
        productsSnapshot.forEach(productDoc => {
            const productRef = doc(db, 'products', productDoc.id);
            batch.update(productRef, { category: updatedName });
        });

        batch.update(categoryRef, { name: updatedName });

        try {
            await batch.commit();
            toast({ title: 'Success', description: 'Category updated successfully.' });
            fetchCategories();
            setIsEditDialogOpen(false);
            setSelectedCategory(null);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update category.', variant: 'destructive' });
        }
    };

    const handleDeleteCategory = async () => {
        if (!selectedCategory) return;

        try {
            // Disassociate category from products
            const productsQuery = query(collection(db, "products"), where("category", "==", selectedCategory.name));
            const productsSnapshot = await getDbDocs(productsQuery);
            const batch = writeBatch(db);
            productsSnapshot.forEach(productDoc => {
                const productRef = doc(db, 'products', productDoc.id);
                batch.update(productRef, { category: '' });
            });
            await batch.commit();

            // Delete the category
            await deleteDoc(doc(db, 'categories', selectedCategory.id));

            toast({ title: 'Success', description: 'Category deleted successfully.' });
            fetchCategories();
            setIsDeleteDialogOpen(false);
            setSelectedCategory(null);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete category.', variant: 'destructive' });
        }
    };

    return (
        <Dialog onOpenChange={fetchCategories}>
            <DialogTrigger asChild>
                <Button variant="outline">Manage Categories</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Manage Categories</DialogTitle>
                    <DialogDescription>Edit or delete your product categories.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell className="text-center">Loading...</TableCell></TableRow>
                            ) : (
                                categories.map(category => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditClick(category)}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteClick(category)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                        <DialogDescription>Update the category name.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input value={updatedName} onChange={e => setUpdatedName(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateCategory}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogDescription>
                        This will delete the category from your store. Products using this category will be updated.
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCategory}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
