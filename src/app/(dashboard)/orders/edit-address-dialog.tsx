'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/utils';
import { Loader2 } from 'lucide-react';

interface EditAddressDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  onAddressUpdated: () => void;
}

export function EditAddressDialog({
  isOpen,
  onOpenChange,
  orderId,
  currentAddress,
  onAddressUpdated
}: EditAddressDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState(currentAddress);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!address.street.trim() || !address.city.trim() || !address.state.trim() || !address.zip.trim()) {
      toast({
        title: 'Validation Error',
        description: 'All address fields are required',
        variant: 'destructive'
      });
      return;
    }

    if (address.zip.length !== 6) {
      toast({
        title: 'Validation Error',
        description: 'Pincode must be 6 digits',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authenticatedFetch(`/api/orders/${orderId}/update-address`, {
        method: 'PATCH',
        body: JSON.stringify({ shippingAddress: address })
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Address updated successfully'
        });
        onAddressUpdated();
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update address',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update address',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Shipping Address</DialogTitle>
          <DialogDescription>
            Update the shipping address for order {orderId}. Make sure the address is complete and accurate.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address / House No. / Landmark *</Label>
              <Input
                id="street"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                placeholder="Enter complete street address"
                disabled={isSubmitting}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="City"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  placeholder="State"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zip">Pincode *</Label>
                <Input
                  id="zip"
                  value={address.zip}
                  onChange={(e) => setAddress({ ...address, zip: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="6-digit pincode"
                  disabled={isSubmitting}
                  maxLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={address.country}
                  onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  placeholder="Country"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-900 mb-1">📍 Address Preview:</p>
              <p className="text-blue-800">
                {address.street}<br />
                {address.city}, {address.state} - {address.zip}<br />
                {address.country}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Address
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
