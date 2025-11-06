'use client';

import { useState } from 'react';
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

import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/utils';

const createCouponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20, 'Code must be at most 20 characters'),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
  value: z.number().min(0, 'Value must be positive'),
  usageType: z.enum(['single_use', 'multi_use', 'unlimited']),
  maxUsageCount: z.number().optional(),
  maxUsagePerUser: z.number().optional(),
  applicableUsers: z.enum(['all', 'new_users_only', 'specific_users']),
  specificPhones: z.string().optional(),
  applicableProducts: z.string().optional(),
  excludedProducts: z.string().optional(),
  minimumOrderValue: z.number().optional(),
  maximumDiscountAmount: z.number().optional(),
  validFrom: z.string(),
  validUntil: z.string(),
  description: z.string().optional(),
});

type CreateCouponForm = z.infer<typeof createCouponSchema>;

interface CreateCouponDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCouponCreated: () => void;
}

export function CreateCouponDialog({ isOpen, onOpenChange, onCouponCreated }: CreateCouponDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateCouponForm>({
    resolver: zodResolver(createCouponSchema),
    defaultValues: {
      code: '',
      type: 'percentage',
      value: 0,
      usageType: 'multi_use',
      maxUsageCount: undefined,
      maxUsagePerUser: undefined,
      applicableUsers: 'all',
      specificPhones: '',
      applicableProducts: '',
      excludedProducts: '',
      minimumOrderValue: undefined,
      maximumDiscountAmount: undefined,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      description: '',
    },
  });

  const watchType = form.watch('type');
  const watchUsageType = form.watch('usageType');
  const watchApplicableUsers = form.watch('applicableUsers');

  const onSubmit = async (data: CreateCouponForm) => {
    setIsSubmitting(true);
    try {
      // Process the form data
      const couponData = {
        ...data,
        isActive: true, // Ensure isActive is set
        validFrom: new Date(data.validFrom).toISOString(),
        validUntil: new Date(data.validUntil + 'T23:59:59').toISOString(),
        specificPhones: data.specificPhones ? data.specificPhones.split(',').map(p => p.trim()).filter(p => p) : undefined,
        applicableProducts: data.applicableProducts ? data.applicableProducts.split(',').map(p => p.trim()).filter(p => p) : undefined,
        excludedProducts: data.excludedProducts ? data.excludedProducts.split(',').map(p => p.trim()).filter(p => p) : undefined,
      };

      console.log('Submitting coupon data:', couponData);

      const response = await authenticatedFetch('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(couponData),
      });

      console.log('Coupon creation response:', response);

      toast({
        title: 'Success',
        description: 'Coupon created successfully',
      });

      form.reset();
      onCouponCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Coupon creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create coupon',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Coupon</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coupon Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="SAVE20" 
                        {...field} 
                        className="font-mono uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                        <SelectItem value="free_shipping">Free Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Value */}
            {watchType !== 'free_shipping' && (
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {watchType === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={watchType === 'percentage' ? '20' : '100'}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Usage Settings */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="usageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select usage type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single_use">Single Use</SelectItem>
                        <SelectItem value="multi_use">Multi Use</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchUsageType === 'multi_use' && (
                <FormField
                  control={form.control}
                  name="maxUsageCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Usage Count</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="100"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>Leave empty for unlimited</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

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
                  <FormDescription>How many times each user can use this coupon (leave empty for no per-user limit)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4">
            </div>

            {/* User Restrictions */}
            <FormField
              control={form.control}
              name="applicableUsers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applicable Users</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="new_users_only">New Users Only</SelectItem>
                      <SelectItem value="specific_users">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchApplicableUsers === 'specific_users' && (
              <FormField
                control={form.control}
                name="specificPhones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Numbers</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="9876543210, 9876543211, ..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Comma-separated phone numbers</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

              {watchType === 'percentage' && (
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid From</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Until</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {isSubmitting ? 'Creating...' : 'Create Coupon'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}