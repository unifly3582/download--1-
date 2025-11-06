'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/utils'; // Import the utility

interface UpdateDimensionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  orderId: string;
  onDimensionsUpdated: () => void;
}

export function UpdateDimensionsDialog({ isOpen, onOpenChange, orderId, onDimensionsUpdated }: UpdateDimensionsDialogProps) {
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!weight || !length || !width || !height) {
      toast({ title: 'Error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // CORRECT: Use authenticatedFetch
      const result = await authenticatedFetch(`/api/orders/${orderId}/update-dimensions`, {
        method: 'POST',
        body: JSON.stringify({
          weight: parseFloat(weight),
          dimensions: {
            l: parseFloat(length),
            // IMPORTANT: The backend API expects 'w' for width, not 'b'.
            w: parseFloat(width),
            h: parseFloat(height),
          },
        }),
      });

      toast({ title: 'Success', description: result.message || 'Order dimensions have been updated.' });
      onDimensionsUpdated(); // This will refresh the orders list
      onOpenChange(false);   // Close the dialog
    } catch (error: any) {
      toast({ title: 'Submission Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enter Weight & Dimensions</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="weight" className="text-right">Weight (g)</Label>
            <Input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="col-span-3" placeholder="e.g., 1100" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="length" className="text-right">Length (cm)</Label>
            <Input id="length" type="number" value={length} onChange={(e) => setLength(e.target.value)} className="col-span-3" placeholder="e.g., 22"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="width" className="text-right">Width (cm)</Label>
            <Input id="width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} className="col-span-3" placeholder="e.g., 18"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="height" className="text-right">Height (cm)</Label>
            <Input id="height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="col-span-3" placeholder="e.g., 12"/>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save and Move to Approval'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}