'use client';

import { useState, useCallback } from 'react';
import type { Customer } from '@/types/customers';
import { AddressManager } from './address-manager';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/utils';

type CustomerFormData = Omit<Customer, 'customerId' | 'createdAt' | 'updatedAt' | 'totalOrders' | 'totalSpent' | 'trustScore' | 'avgOrderValue' | 'refundsCount' | 'returnRate' | 'lifetimeValue' | 'tags'> & {
  tags: string;
};

const initialFormState: CustomerFormData = {
  name: '', phone: '', email: '', preferredLanguage: 'en', whatsappOptIn: true,
  defaultAddress: undefined, savedAddresses: [],
  loyaltyTier: 'new', customerSegment: 'Active', tags: '', notes: '', isDubious: false,
  preferredCourier: undefined, region: undefined, referralSource: undefined,
  blacklistReason: undefined, lastInteractionSource: undefined, lastInteractionAt: undefined,
  inactiveSince: undefined, orderFrequencyDays: undefined, preferredProducts: undefined,
  purchaseHistory: undefined, avgDeliveryTime: undefined, lastOrderAt: undefined
};

interface CustomerEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
  onSave: () => void;
}

export function CustomerEditDialog({ isOpen, onClose, customer, onSave }: CustomerEditDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerFormData>(() => {
    if (customer) {
      return {
        ...customer,
        phone: customer.phone.startsWith('+91') ? customer.phone.slice(3) : customer.phone,
        tags: customer.tags?.join(', ') || '',
        savedAddresses: customer.savedAddresses || [],
      };
    }
    return initialFormState;
  });

  const handleFormChange = useCallback((name: keyof CustomerFormData, value: any) => {
    setEditingCustomer(prev => {
      if (name === 'phone') {
        const numericValue = value.replace(/[^\d]/g, '');
        if (numericValue.length <= 10) {
          return { ...prev, [name]: numericValue };
        }
        return prev;
      }
      return { ...prev, [name]: value };
    });
  }, []);

  const handleSaveCustomer = async () => {
    if (!editingCustomer.name || !editingCustomer.phone || editingCustomer.phone.length !== 10) {
      toast({ 
        title: 'Validation Error', 
        description: 'Name and a 10-digit Phone number are required.', 
        variant: 'destructive' 
      });
      return;
    }
    
    setIsSaving(true);
    
    const fullPhoneNumber = `+91${editingCustomer.phone}`;
    const isNewCustomer = !customer;
    const url = isNewCustomer ? `/api/customers/create` : `/api/customers/${customer?.phone}/update`;
    const method = isNewCustomer ? 'POST' : 'PUT';

    const payload = {
      ...editingCustomer,
      phone: fullPhoneNumber,
      tags: editingCustomer.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    };

    try {
      const result = await authenticatedFetch(url, {
        method: method,
        body: JSON.stringify(payload),
      });

      toast({ 
        title: 'Success!', 
        description: result.message || `Customer has been ${isNewCustomer ? 'created' : 'updated'}.` 
      });
      onClose();
      onSave();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setEditingCustomer(customer ? {
      ...customer,
      phone: customer.phone.startsWith('+91') ? customer.phone.slice(3) : customer.phone,
      tags: customer.tags?.join(', ') || '',
      savedAddresses: customer.savedAddresses || [],
    } : initialFormState);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {customer ? `Edit: ${customer.name}` : 'Create New Customer'}
          </DialogTitle>
          <DialogDescription>
            Manage customer details, addresses, and business information.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input 
                  id="name" 
                  value={editingCustomer.name} 
                  onChange={(e) => handleFormChange('name', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={editingCustomer.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    className="rounded-l-none" 
                    maxLength={10}
                    disabled={!!customer} // Disable editing phone for existing customers
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={editingCustomer.email || ''} 
                  onChange={(e) => handleFormChange('email', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredLanguage">Preferred Language</Label>
                <Select 
                  value={editingCustomer.preferredLanguage} 
                  onValueChange={(v) => handleFormChange('preferredLanguage', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="ta">Tamil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select 
                  value={editingCustomer.region || ''} 
                  onValueChange={(v) => handleFormChange('region', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north">North India</SelectItem>
                    <SelectItem value="south">South India</SelectItem>
                    <SelectItem value="east">East India</SelectItem>
                    <SelectItem value="west">West India</SelectItem>
                    <SelectItem value="central">Central India</SelectItem>
                    <SelectItem value="northeast">Northeast India</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referralSource">Referral Source</Label>
                <Select 
                  value={editingCustomer.referralSource || ''} 
                  onValueChange={(v) => handleFormChange('referralSource', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How did they find us?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google Search</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="referral">Friend Referral</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="direct">Direct Visit</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="whatsappOptIn"
                checked={editingCustomer.whatsappOptIn} 
                onCheckedChange={(c) => handleFormChange('whatsappOptIn', c)} 
              />
              <Label htmlFor="whatsappOptIn">WhatsApp Notifications</Label>
            </div>
          </TabsContent>

          <TabsContent value="addresses" className="mt-4">
            <AddressManager
              defaultAddress={editingCustomer.defaultAddress}
              savedAddresses={editingCustomer.savedAddresses || []}
              onAddressesUpdate={(newDefault, newSaved) => {
                handleFormChange('defaultAddress', newDefault);
                handleFormChange('savedAddresses', newSaved);
              }}
            />
          </TabsContent>

          <TabsContent value="business" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loyaltyTier">Loyalty Tier</Label>
                <Select 
                  value={editingCustomer.loyaltyTier} 
                  onValueChange={(v) => handleFormChange('loyaltyTier', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="repeat">Repeat</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerSegment">Customer Segment</Label>
                <Select 
                  value={editingCustomer.customerSegment || ''} 
                  onValueChange={(v) => handleFormChange('customerSegment', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Dormant">Dormant</SelectItem>
                    <SelectItem value="At Risk">At Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredCourier">Preferred Courier</Label>
              <Select 
                value={editingCustomer.preferredCourier || ''} 
                onValueChange={(v) => handleFormChange('preferredCourier', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a courier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delhivery">Delhivery</SelectItem>
                  <SelectItem value="amazon">Amazon Shipping</SelectItem>
                  <SelectItem value="bluedart">BlueDart</SelectItem>
                  <SelectItem value="dtdc">DTDC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input 
                id="tags" 
                value={editingCustomer.tags} 
                onChange={(e) => handleFormChange('tags', e.target.value)} 
                placeholder="vip, wholesale, friend, bulk-buyer"
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple tags with commas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                value={editingCustomer.notes || ''} 
                onChange={(e) => handleFormChange('notes', e.target.value)} 
                placeholder="Any special notes about this customer..."
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="isDubious"
                checked={editingCustomer.isDubious} 
                onCheckedChange={(c) => handleFormChange('isDubious', c)} 
              />
              <Label htmlFor="isDubious">Mark as Dubious (High Risk)</Label>
            </div>

            {editingCustomer.isDubious && (
              <div className="space-y-2">
                <Label htmlFor="blacklistReason">Reason for Risk Flag</Label>
                <Textarea 
                  id="blacklistReason" 
                  value={editingCustomer.blacklistReason || ''} 
                  onChange={(e) => handleFormChange('blacklistReason', e.target.value)} 
                  placeholder="Explain why this customer is marked as high risk..."
                  rows={2}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="lastInteractionSource">Last Interaction Source</Label>
              <Select 
                value={editingCustomer.lastInteractionSource || ''} 
                onValueChange={(v) => handleFormChange('lastInteractionSource', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interaction source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="ai_agent">AI Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {customer && (
              <div className="space-y-2">
                <Label>Read-Only Information</Label>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm text-muted-foreground">Customer ID:</span>
                    <p className="font-mono text-sm">{customer.customerId}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Trust Score:</span>
                    <p>{customer.trustScore}/100</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Total Orders:</span>
                    <p>{customer.totalOrders || 0}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Total Spent:</span>
                    <p>₹{customer.totalSpent?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveCustomer} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}