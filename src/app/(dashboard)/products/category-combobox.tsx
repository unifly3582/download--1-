'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
}

interface CategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategoryCombobox({ value, onChange }: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesCol = collection(db, 'categories');
        const categorySnapshot = await getDocs(categoriesCol);
        const categoryList = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(categoryList);
      } catch (error) {
        toast({ title: 'Error', description: 'Could not load categories.', variant: 'destructive' });
      }
    };
    fetchCategories();
  }, [toast]);

  const handleAddNewCategory = async () => {
    if (newCategoryName.trim().length < 2) {
      toast({ title: 'Error', description: 'Category name is too short.', variant: 'destructive' });
      return;
    }
    try {
      const categoriesCol = collection(db, 'categories');
      const docRef = await addDoc(categoriesCol, { 
        name: newCategoryName, 
        slug: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp(),
      });
      const newCategory = { id: docRef.id, name: newCategoryName };
      setCategories(prev => [...prev, newCategory]);
      onChange(newCategory.name);
      toast({ title: 'Success', description: 'New category created.' });
      setIsDialogOpen(false);
      setNewCategoryName('');
      setOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create category.', variant: 'destructive' });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value ? categories.find(c => c.name === value)?.name : 'Select category...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search category..." />
          <CommandList>
            <CommandEmpty>
                <div className='p-4 text-sm'>No category found.</div>
                <Button
                    className='w-[calc(100%-2rem)] mx-4 mb-4'
                    onClick={() => {
                        setOpen(false);
                        setIsDialogOpen(true);
                    }}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Category
                </Button>
            </CommandEmpty>
            <CommandGroup>
              {categories.map(category => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  onSelect={currentValue => {
                    onChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check className={`mr-2 h-4 w-4 ${value === category.name ? 'opacity-100' : 'opacity-0'}`} />
                  {category.name}
                </CommandItem>
              ))}
                <CommandItem 
                    value='new-category'
                    onSelect={() => {
                        setOpen(false);
                        setIsDialogOpen(true);
                    }}
                    className='text-primary'
                >
                     <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Category
                </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add New Category</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
                <Input placeholder="New category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
            </div>
            <DialogFooter>
                <Button type="button" onClick={handleAddNewCategory}>Save Category</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </Popover>
  );
}
