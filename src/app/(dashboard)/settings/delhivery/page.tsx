'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast"; // Use the standard toast for consistency
import { authenticatedFetch } from '@/lib/api/utils'; // Import our utility
import { Button } from '@/components/ui/button'; // Use standard UI components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Zod schema for validation
const delhiverySettingsSchema = z.object({
  apiKey: z.string().trim().min(1, 'API Key is required'),
  pickupLocationName: z.string().trim().min(1, 'Pickup Location Name is required'),
});

type DelhiverySettingsFormValues = z.infer<typeof delhiverySettingsSchema>;

export default function DelhiverySettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const { 
    control, 
    handleSubmit, 
    reset, 
    formState: { isSubmitting, errors } 
  } = useForm<DelhiverySettingsFormValues>({
    resolver: zodResolver(delhiverySettingsSchema),
    defaultValues: {
      apiKey: '',
      pickupLocationName: '',
    }
  });

  // Fetch existing settings on component mount
  useEffect(() => {
    const fetchDelhiverySettings = async () => {
      setIsLoading(true);
      try {
        // CORRECT: Use authenticatedFetch for GET request
        const result = await authenticatedFetch('/api/settings/delhivery');
        if (result.success && result.data) {
          reset(result.data); // Populate form with fetched data
        }
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Failed to fetch settings.', variant: 'destructive'});
      }
      setIsLoading(false);
    };

    fetchDelhiverySettings();
  }, [reset, toast]);

  // Handle form submission
  const onSubmit = async (data: DelhiverySettingsFormValues) => {
    try {
      // CORRECT: Use authenticatedFetch for POST request
      const result = await authenticatedFetch('/api/settings/delhivery', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      toast({ title: 'Success', description: result.message || 'Settings saved successfully.' });
      reset(data); // Keep form populated with saved data
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save settings.', variant: 'destructive'});
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading Delhivery settings...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-3xl font-bold text-foreground">Delhivery Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>Enter your Delhivery API Key and primary pickup location name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
            
            <div className="space-y-2">
              <Label htmlFor="apiKey">Delhivery API Key</Label>
              <Controller
                name="apiKey"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="text" id="apiKey" placeholder="Enter your Delhivery API Key" />
                )}
              />
              {errors.apiKey && <p className="text-sm text-destructive">{errors.apiKey.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupLocationName">Pickup Location Name</Label>
              <Controller
                name="pickupLocationName"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="text" id="pickupLocationName" placeholder="e.g., Warehouse-A (must match Delhivery dashboard)" />
                )}
              />
              {errors.pickupLocationName && <p className="text-sm text-destructive">{errors.pickupLocationName.message}</p>}
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