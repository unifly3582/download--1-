'use client';

import { useEffect, useState, useCallback, type ComponentProps } from 'react';
import { useForm, useFieldArray, useFormContext, FieldPath } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Trash2, Loader2 } from 'lucide-react';
import type { Product } from '@/types/products';
import { CategoryCombobox } from './category-combobox';
import { ImageUpload } from '@/components/core/image-upload';
import { debounce } from 'lodash';
import { authenticatedFetch } from '@/lib/api/utils';

// --- SCHEMAS ---
const mediaSchema = z.object({
  type: z.enum(['image', 'video']),
  url: z.string().url({ message: "Please enter a valid URL." }).min(1, 'Image is required.'),
});

const variationSchema = z.object({
  name: z.string().min(2, 'Variation name is required'),
  sku: z.string().min(2, 'SKU is required'),
  hsnCode: z.string().optional(),
  regularPrice: z.coerce.number().min(0.01, 'Price is required'),
  salePrice: z.coerce.number().optional(),
  stock: z.coerce.number().int().min(0, 'Stock must be non-negative'),
  weight: z.coerce.number().int().min(0, 'Weight must be non-negative'),
  length: z.coerce.number().min(0, 'Length must be non-negative'),
  b: z.coerce.number().min(0, 'Width must be non-negative'), // Using 'b' for width
  height: z.coerce.number().min(0, 'Height must be non-negative'),
});

const formSchema = z.object({
  name: z.string().min(2, { message: 'Product name must be at least 2 characters.' }),
  slug: z.string().min(2, { message: 'URL slug must be at least 2 characters.' }),
  description: z.string().optional(),
  category: z.string().min(1, { message: 'Category is required.' }),
  tags: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isCodAvailable: z.boolean().optional(),
  media: z.array(mediaSchema).optional(),
  variations: z.array(variationSchema).min(1, 'At least one product variation is required.'),
}).refine(data => {
  const skus = data.variations.map(v => v.sku).filter(Boolean);
  return new Set(skus).size === skus.length;
}, {
  message: "SKUs must be unique within this product.",
  path: ["variations"],
});

export type ProductFormValues = z.infer<typeof formSchema>;


// --- SKU INPUT COMPONENT ---
const SkuInput = (props: ComponentProps<typeof Input> & { productId?: string, fieldName: FieldPath<ProductFormValues> }) => {
  const { productId, fieldName, ...rest } = props;
  const { setError, clearErrors, getValues } = useFormContext<ProductFormValues>();

  const debouncedValidation = useCallback(
    debounce(async (sku: string) => {
      if (sku.length < 2) return;

      const allSkus = getValues("variations").map(v => v.sku);
      if (allSkus.filter(s => s === sku).length > 1) {
        setError(fieldName, { type: "manual", message: "SKU is a duplicate in this product." });
        return;
      }
      
      try {
        const url = `/api/products/sku-check?sku=${encodeURIComponent(sku)}` + (productId ? `&productId=${productId}` : '');
        const result = await authenticatedFetch(url);

        if (result.success && !result.data.isUnique) {
          setError(fieldName, { type: "manual", message: `SKU already exists.` });
        } else {
          clearErrors(fieldName);
        }
      } catch (error: any) {
        console.error("SKU validation error:", error.message);
      }
    }, 500),
    [productId, fieldName, setError, clearErrors, getValues]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(props.onChange) props.onChange(e);
    debouncedValidation(e.target.value);
  };

  return <Input {...rest} onChange={handleChange} />;
};


// --- MAIN FORM COMPONENT ---
interface ProductFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product?: Product;
  onSubmit: (values: ProductFormValues) => void;
}

export function ProductForm({ isOpen, onOpenChange, product, onSubmit }: ProductFormProps) {
    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          name: '', slug: '', description: '', category: '', tags: '',
          seoTitle: '', seoDescription: '', isActive: true, isFeatured: false,
          isCodAvailable: true, media: [], variations: [],
        },
        mode: 'onChange',
      });
    
      const { reset } = form;
      const { fields: mediaFields, append: appendMedia, remove: removeMedia } = useFieldArray({ control: form.control, name: 'media' });
      const { fields: variationFields, append: appendVariation, remove: removeVariation } = useFieldArray({ control: form.control, name: 'variations' });
    
      useEffect(() => {
        if (isOpen) {
          if (product) {
            reset({
              name: product.name,
              slug: product.slug || '',
              description: product.description || '',
              category: product.category,
              tags: product.tags?.join(', ') || '',
              seoTitle: product.seoTitle || '',
              seoDescription: product.seoDescription || '',
              isActive: product.isActive ?? true,
              isFeatured: product.isFeatured ?? false,
              isCodAvailable: product.isCodAvailable ?? true,
              media: product.media || [],
              variations: product.variations?.map(v => ({
                name: v.name,
                sku: v.sku,
                hsnCode: v.hsnCode || '',
                regularPrice: v.price,
                salePrice: v.salePrice || 0,
                stock: v.stock,
                weight: v.weight,
                length: v.dimensions?.l || 0,
                b: v.dimensions?.b || 0,
                height: v.dimensions?.h || 0,
              })) || [],
            });
          } else {
            reset({
              name: '', slug: '', description: '', category: '', tags: '',
              seoTitle: '', seoDescription: '', isActive: true, isFeatured: false,
              isCodAvailable: true, media: [],
              variations: [{
                name: 'Default', sku: '', regularPrice: 0, salePrice: undefined,
                stock: 0, weight: 0, length: 0, b: 0, height: 0, hsnCode: ''
              }]
            });
          }
        }
      }, [isOpen, product, reset]);
    
      return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                <DialogDescription>Manage your product details.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4 pr-2">
                
                {/* Product Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="slug" render={({ field }) => (<FormItem><FormLabel>URL Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><CategoryCombobox value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="tags" render={({ field }) => (<FormItem><FormLabel>Tags</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Comma-separated</FormDescription><FormMessage /></FormItem>)} />
                  </div>
                  <div className="space-y-4">
                    <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="resize-none h-40" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="space-y-4 rounded-md border p-4">
                      <FormField control={form.control} name="isActive" render={({ field }) => (<FormItem className="flex items-center justify-between"><FormLabel>Active in store</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="isFeatured" render={({ field }) => (<FormItem className="flex items-center justify-between"><FormLabel>Featured product</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                      <FormField control={form.control} name="isCodAvailable" render={({ field }) => (<FormItem className="flex items-center justify-between"><FormLabel>Cash on Delivery</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* SEO Section */}
                <div>
                  <h3 className="text-lg font-medium">SEO</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <FormField control={form.control} name="seoTitle" render={({ field }) => (<FormItem><FormLabel>SEO Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="seoDescription" render={({ field }) => (<FormItem><FormLabel>SEO Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                </div>

                <Separator />

                {/* Media Section */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Media</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendMedia({ type: 'image', url: '' })}>Add Image</Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                    {mediaFields.map((field, index) => (
                      <div key={field.id} className="relative">
                        <FormField
                          control={form.control}
                          name={`media.${index}.url`}
                          render={({ field: urlField }) => (
                            <FormItem>
                              <FormControl>
                                <ImageUpload
                                  initialUrl={urlField.value}
                                  onUploadSuccess={urlField.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 z-10" onClick={() => removeMedia(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <FormField control={form.control} name="media" render={() => (<FormItem><FormMessage /></FormItem>)} />
                </div>
                
                <Separator />

                {/* Variations Section */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Variations</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendVariation({ name: '', sku: '', hsnCode: '', regularPrice: 0, salePrice: 0, stock: 0, weight: 0, length: 0, b: 0, height: 0 })}>
                      Add Variation
                    </Button>
                  </div>
                  <div className="space-y-6 mt-4">
                    {variationFields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-md space-y-4">
                        <div className="flex justify-between items-start">
                          <FormField control={form.control} name={`variations.${index}.name`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Variation Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeVariation(index)} className="ml-4"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <FormField
                                control={form.control}
                                name={`variations.${index}.sku`}
                                render={({ field }) => {
                                    const { isSubmitting } = form.formState; // Use isSubmitting to show loader
                                    return (
                                    <FormItem>
                                        <FormLabel>SKU</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <SkuInput {...field} productId={product?.id} fieldName={`variations.${index}.sku`} />
                                            </FormControl>
                                            {isSubmitting && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin" />}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                    );
                                }}
                            />
                          <FormField control={form.control} name={`variations.${index}.hsnCode`} render={({ field }) => (<FormItem><FormLabel>HSN Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name={`variations.${index}.stock`} render={({ field }) => (<FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name={`variations.${index}.regularPrice`} render={({ field }) => (<FormItem><FormLabel>Regular Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name={`variations.${index}.salePrice`} render={({ field }) => (<FormItem><FormLabel>Sale Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name={`variations.${index}.weight`} render={({ field }) => (<FormItem><FormLabel>Weight (gm)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name={`variations.${index}.length`} render={({ field }) => (<FormItem><FormLabel>Length (cm)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name={`variations.${index}.b`} render={({ field }) => (<FormItem><FormLabel>Width (cm)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name={`variations.${index}.height`} render={({ field }) => (<FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                      </div>
                    ))}
                    <FormField control={form.control} name="variations" render={() => (<FormItem><FormMessage /></FormItem>)} />
                  </div>
                </div>
                
                <DialogFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Saving...' : 'Save Product'}
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      );
}