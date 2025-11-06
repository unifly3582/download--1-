'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authenticatedFetch } from '@/lib/api/utils'; // Import our utility

interface CheckoutSettings {
  codCharges: {
    type: 'fixed' | 'percentage';
    value: number;
  };
  prepaidDiscount: {
    type: 'fixed' | 'percentage';
    value: number;
  };
}

export default function CheckoutSettingsPage() {
  const [settings, setSettings] = useState<CheckoutSettings>({ codCharges: { type: 'fixed', value: 0 }, prepaidDiscount: { type: 'fixed', value: 0 } });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Use a separate state for saving
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        // CORRECT: Use authenticatedFetch for the GET request
        const result = await authenticatedFetch('/api/settings/checkout');
        if (result.success && result.data) {
          setSettings(result.data);
        }
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to fetch settings.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // CORRECT: Use authenticatedFetch for the POST request
      const result = await authenticatedFetch('/api/settings/checkout', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
      toast({ title: "Success", description: result.message || "Settings saved successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
            <p>Loading settings...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-3xl font-bold text-foreground">Checkout Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>COD & Prepaid</CardTitle>
          <CardDescription>Define rules for COD charges and discounts on prepaid orders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 border rounded-lg">
            <h4 className="text-lg font-semibold md:col-span-3">Cash on Delivery (COD)</h4>
            <div>
                <Label>Charge Type</Label>
                <Select 
                    value={settings.codCharges.type} 
                    onValueChange={(value) => setSettings(s => ({...s, codCharges: {...s.codCharges, type: value as 'fixed' | 'percentage'}}))}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label>Charge Value</Label>
                <Input 
                    type="number" 
                    value={settings.codCharges.value} 
                    onChange={(e) => setSettings(s => ({...s, codCharges: {...s.codCharges, value: Number(e.target.value)}}))}
                />
            </div>
            <div className="text-sm text-muted-foreground">
                {settings.codCharges.type === 'fixed' 
                    ? `Adds a flat fee of ₹${settings.codCharges.value} to all COD orders.`
                    : `Adds ${settings.codCharges.value}% of the order subtotal as a fee to all COD orders.`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 border rounded-lg">
            <h4 className="text-lg font-semibold md:col-span-3">Prepaid Orders</h4>
            <div>
                <Label>Discount Type</Label>
                <Select 
                    value={settings.prepaidDiscount.type} 
                    onValueChange={(value) => setSettings(s => ({...s, prepaidDiscount: {...s.prepaidDiscount, type: value as 'fixed' | 'percentage'}}))}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label>Discount Value</Label>
                <Input 
                    type="number" 
                    value={settings.prepaidDiscount.value} 
                    onChange={(e) => setSettings(s => ({...s, prepaidDiscount: {...s.prepaidDiscount, value: Number(e.target.value)}}))}
                />
            </div>
            <div className="text-sm text-muted-foreground">
                {settings.prepaidDiscount.type === 'fixed'
                    ? `Applies a flat discount of ₹${settings.prepaidDiscount.value} to all prepaid orders.`
                    : `Applies a ${settings.prepaidDiscount.value}% discount to the subtotal of all prepaid orders.`
                }
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}