'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/utils'; // Import the utility

interface ShipOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  orderId: string;
  onOrderShipped: () => void;
}

export function ShipOrderDialog({ isOpen, onOpenChange, orderId, onOrderShipped }: ShipOrderDialogProps) {
  const [courier, setCourier] = useState('');
  const [manualAwb, setManualAwb] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleShip = async () => {
    if (!courier) {
      toast({ title: 'Error', description: 'Please select a courier.', variant: 'destructive' });
      return;
    }
    if (courier === 'manual' && !manualAwb) {
      toast({ title: 'Error', description: 'Please enter the AWB number.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // CORRECT: Use authenticatedFetch
      const result = await authenticatedFetch(`/api/orders/${orderId}/ship`, {
        method: 'POST',
        body: JSON.stringify({ courier, manualAwb }),
      });

      // The utility already handles non-OK responses, so we can just use the result
      toast({ title: 'Success', description: result.message || 'Order shipped successfully.' });
      onOrderShipped();
      onOpenChange(false);
      
    } catch (error: any) {
      // The utility formats the error for us
      toast({ title: 'Shipping Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ship Order</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select onValueChange={setCourier} value={courier}>
            <SelectTrigger>
              <SelectValue placeholder="Select Courier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delhivery">Delhivery</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          {courier === 'manual' && (
            <Input
              placeholder="Enter AWB Number"
              value={manualAwb}
              onChange={(e) => setManualAwb(e.target.value)}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleShip} disabled={isSubmitting}>
            {isSubmitting ? 'Shipping...' : 'Ship'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}