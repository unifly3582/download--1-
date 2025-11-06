'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/utils';
import type { Coupon } from '@/types/coupon';

const editCouponSchema = z.object({
  maxUsageCount: z.number().optional(),
  maxUsagePerUser: z.number().optional(),
  minimumOrderValue: z.number().optional(),
  maximumDiscountAmount: z.number().optional(),
  validUntil: z.string(),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type EditCouponForm = z.infer<typeof editCouponSchema>;

interface EditCouponDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon & { id: string };
  onCouponUpdated: () => void;
}

export function EditCouponDialog({ isOpen, onOpenChange, coupon, onCouponUpdated }: EditCouponDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditCouponForm>({
    resolver: zodResolver(editCouponSchema),
    defaultValues: {
      maxUsageCount: undefined,
      maxUsagePerUser: undefined,
      minimumOrderValue: undefined,
      maximumDiscountAmount: undefined,
      validUntil: '',
      description: '',
      isActive: true,
    },
  });

  // Reset form when coupon changes
  useEffect(() => {
    if (coupon) {
      form.reset({
        maxUsageCount: coupon.maxUsageCount || undefined,
        maxUsagePerUser: coupon.maxUsagePerUser || undefined,
        minimumOrderValue: coupon.minimumOrderValue || undefined,
        maximumDiscountAmount: coupon.maximumDiscountAmount || undefined,
        validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
        description: coupon.description || '',
        isActive: coupon.isActive,
      });
    }
  }, [coupon, form]);

  const onSubmit = async (data: EditCouponForm) => {
    setIsSubmitting(true);
    try {
      const updateData = {
        ...data,
        validUntil: new Date(data.validUntil + 'T23:59:59').toISOString(),
      };

      await authenticatedFetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      toast({
        title: 'Success',
        description: 'Coupon updated successfully',
      });

      onCouponUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update coupon',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!coupon) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Coupon: {coupon.code}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Read-only Information */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Code:</span> 
                  <span className="ml-2 font-mono">{coupon.code}</span>
                </div>
                <div>
                  <span className="font-medium">Type:</span> 
                  <span className="ml-2">
                    {coupon.type === 'percentage' && `${coupon.value}% off`}
                    {coupon.type === 'fixed_amount' && `₹${coupon.value} off`}
                    {coupon.type === 'free_shipping' && 'Free shipping'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Usage:</span> 
                  <span className="ml-2">
                    {coupon.usageType === 'single_use' ? 'Single use' : 'Multi use'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Current Usage:</span> 
                  <span className="ml-2">{coupon.currentUsageCount || 0} times</span>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4">
              {/* Active Status */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Enable or disable this coupon
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Usage Limit (only for multi-use coupons) */}
              {coupon.usageType === 'multi_use' && (
                <FormField
                  control={form.control}
                  name="maxUsageCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Usage Count</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="100"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>Leave empty for unlimited usage</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Per-User Usage Limit */}
              <FormField
                control={form.control}
                name="maxUsagePerUser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Usage Per User</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>How many times each user can use this coupon</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Order Value Restrictions */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minimumOrderValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Order Value (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="500"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {coupon.type === 'percentage' && (
                  <FormField
                    control={form.control}
                    name="maximumDiscountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Discount (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="200"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>Cap for percentage discounts</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Validity Period */}
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Until</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Current: {new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validUntil).toLocaleDateString()}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="20% off on all orders above ₹500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Coupon'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}