// /src/app/(dashboard)/customers/address-manager.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trash2, PlusCircle, Home } from 'lucide-react';
import type { Customer } from '@/types/customers';
import { authenticatedFetch } from '@/lib/api/utils'; // Import our utility

type Address = NonNullable<Customer['defaultAddress']>;

interface AddressManagerProps {
  defaultAddress: Address | undefined;
  savedAddresses: Address[];
  onAddressesUpdate: (newDefault: Address | undefined, newSaved: Address[]) => void;
}

const emptyAddress: Address = { street: '', city: '', state: '', zip: '', country: 'India', label: 'Home' };

export function AddressManager({ defaultAddress, savedAddresses, onAddressesUpdate }: AddressManagerProps) {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Address>(emptyAddress);
  const [pincode, setPincode] = useState('');

  // Pincode auto-fill effect
  useEffect(() => {
    if (pincode.length === 6) {
      const fetchPincodeData = async () => {
        try {
          // CORRECT: Use authenticatedFetch for the API call
          const result = await authenticatedFetch(`/api/pincode/${pincode}`);
          if (result.success) {
            setCurrentAddress(prev => ({ ...prev, city: result.data.city, state: result.data.state, zip: pincode }));
          } else {
            // The utility will throw an error on failure, but we keep this for specific API logic errors
            toast({ title: 'Info', description: result.error, variant: 'default' });
          }
        } catch (error: any) {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
      };
      fetchPincodeData();
    }
  }, [pincode, toast]);

  const handleSaveAddress = () => {
    if (!currentAddress.street || !currentAddress.zip) {
      toast({ title: 'Validation Error', description: 'Street and ZIP Code are required.', variant: 'destructive' });
      return;
    }
    const newSavedAddresses = [...savedAddresses, currentAddress];
    const newDefault = defaultAddress || currentAddress; // If no default, make this the new default
    onAddressesUpdate(newDefault, newSavedAddresses.filter(addr => addr !== newDefault));
    setIsFormOpen(false);
    setCurrentAddress(emptyAddress);
    setPincode('');
  };

  const handleSetDefault = (addressToSet: Address) => {
    const allAddresses = [defaultAddress, ...savedAddresses].filter(Boolean) as Address[];
    const newSaved = allAddresses.filter(addr => addr !== addressToSet);
    onAddressesUpdate(addressToSet, newSaved);
  };

  const handleDelete = (addressToDelete: Address) => {
    if (addressToDelete === defaultAddress) {
        toast({title: 'Action Denied', description: "Cannot delete the default address. Set another address as default first.", variant: 'destructive'});
        return;
    }
    const newSaved = savedAddresses.filter(addr => addr !== addressToDelete);
    onAddressesUpdate(defaultAddress, newSaved);
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg border-b pb-2 mt-4">Addresses</h4>
      
      {defaultAddress && (
        <Card className="bg-secondary">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Home className="h-4 w-4"/> Default Address</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{defaultAddress.street}, {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.zip}</p>
          </CardContent>
        </Card>
      )}

      {savedAddresses.map((addr, index) => (
        <Card key={index}>
          <CardContent className="pt-4">
            <p>{addr.street}, {addr.city}, {addr.state} - {addr.zip}</p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => handleSetDefault(addr)}>Set as Default</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(addr)}><Trash2 className="h-4 w-4"/></Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Add New Address</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Address</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pincode" className="text-right">Pincode</Label>
              <Input id="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} className="col-span-3" maxLength={6} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">City</Label>
              <Input id="city" value={currentAddress.city} onChange={e => setCurrentAddress(p => ({...p, city: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="state" className="text-right">State</Label>
              <Input id="state" value={currentAddress.state} onChange={e => setCurrentAddress(p => ({...p, state: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="street" className="text-right">Street</Label>
              <Input id="street" value={currentAddress.street} onChange={e => setCurrentAddress(p => ({...p, street: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">Label</Label>
              <Select value={currentAddress.label || 'Home'} onValueChange={v => setCurrentAddress(p => ({...p, label: v}))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Warehouse">Warehouse</SelectItem>
                  <SelectItem value="Billing">Billing Address</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAddress}>Save Address</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}