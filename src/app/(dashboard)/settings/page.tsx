'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch } from '@/lib/api/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; // Use standard Switch component

const settingsSchema = z.object({
  maxAutoApprovalValue: z.coerce.number().min(0, 'Must be a positive number'),
  minCustomerAgeDays: z.coerce.number().int().min(0, 'Must be a positive integer'),
  allowNewCustomers: z.boolean(),
  requireVerifiedDimensions: z.boolean(),
  enableLearningMode: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AutoApprovalSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      maxAutoApprovalValue: 0,
      minCustomerAgeDays: 0,
      allowNewCustomers: false,
      requireVerifiedDimensions: false,
      enableLearningMode: false,
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        // CORRECT: Use authenticatedFetch
        const result = await authenticatedFetch('/api/settings/auto-approval');
        if (result.success && result.data) {
          reset(result.data); // Populate form
        }
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Failed to fetch settings.', variant: 'destructive'});
      }
      setIsLoading(false);
    };

    fetchSettings();
  }, [reset, toast]);

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      // CORRECT: Use authenticatedFetch
      const result = await authenticatedFetch('/api/settings/auto-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      toast({ title: 'Success', description: result.message || 'Settings saved successfully.' });
      reset(data); // Re-populate form with saved data
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save settings.', variant: 'destructive'});
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-3xl font-bold text-foreground">Auto-Approval Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Order Approval Rules</CardTitle>
          <CardDescription>Configure the rules for automatic order approval.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
            
            <div className="space-y-2">
              <Label htmlFor="maxAutoApprovalValue">Maximum Order Value for Auto-Approval</Label>
              <Controller
                name="maxAutoApprovalValue"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="number" id="maxAutoApprovalValue" />
                )}
              />
              {errors.maxAutoApprovalValue && <p className="text-sm text-destructive">{errors.maxAutoApprovalValue.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minCustomerAgeDays">Minimum Customer Age (in days)</Label>
              <Controller
                name="minCustomerAgeDays"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="number" id="minCustomerAgeDays" />
                )}
              />
              {errors.minCustomerAgeDays && <p className="text-sm text-destructive">{errors.minCustomerAgeDays.message}</p>}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Controller name="allowNewCustomers" control={control} render={({ field }) => ( <Switch id="allowNewCustomers" checked={field.value} onCheckedChange={field.onChange} /> )} />
                <Label htmlFor="allowNewCustomers">Allow New Customers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Controller name="requireVerifiedDimensions" control={control} render={({ field }) => ( <Switch id="requireVerifiedDimensions" checked={field.value} onCheckedChange={field.onChange} /> )} />
                <Label htmlFor="requireVerifiedDimensions">Require Verified Dimensions</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Controller name="enableLearningMode" control={control} render={({ field }) => ( <Switch id="enableLearningMode" checked={field.value} onCheckedChange={field.onChange} /> )} />
                <Label htmlFor="enableLearningMode">Enable Learning Mode</Label>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}