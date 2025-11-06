'use client';

import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { OrderItem, CreateOrder, PricingInfoSchema } from '@/types/order';
import type { Customer } from '@/types/customers';
import { Badge } from '@/components/ui/badge';
import { authenticatedFetch } from '@/lib/api/utils';

// ... (interfaces remain the same) ...
interface SearchableVariation {
  productId: string;
  parentName: string;
  variationId: string;
  variationName: string;
  sku: string;
  price: number;
  stock: number;
  weight: number;
  dimensions: { l: number; b: number; h: number; };
}

interface OrderItemWithMeta extends OrderItem {
  stock: number;
}

interface CreateOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onOrderCreated: () => void;
}

type AdminPricingInfo = z.infer<typeof PricingInfoSchema>;

interface DialogFormData {
  orderSource: 'admin_form';
  customerInfo: { customerId?: string; name: string; phone: string; email?: string; };
  shippingAddress: { street: string; city: string; state: string; zip: string; country: string; };
  items: OrderItemWithMeta[];
  paymentInfo: { method: 'COD' | 'Prepaid', status: string };
  adminPricingInfo: AdminPricingInfo;
  couponCode?: string;
  trafficSource?: {
    source: "email" | "direct" | "google_search" | "google_ads" | "meta_ads" | "instagram" | "facebook" | "youtube" | "sms" | "referral" | "organic_social" | "other";
    medium?: string;
    campaign?: string;
    referrer?: string;
  };
}

const initialFormData: DialogFormData = {
  orderSource: 'admin_form',
  customerInfo: { name: '', phone: '' },
  shippingAddress: { street: '', city: '', state: '', zip: '', country: 'India' },
  items: [],
  adminPricingInfo: { subtotal: 0, discount: 0, shippingCharges: 0, codCharges: 0, taxes: 0, grandTotal: 0 },
  paymentInfo: { method: 'COD', status: 'Pending' },
};

export function CreateOrderDialog({ isOpen, onOpenChange, onOrderCreated }: CreateOrderDialogProps) {
  // ... (state hooks remain the same) ...
  const [formData, setFormData] = useState<DialogFormData>(initialFormData);
  const [internalItems, setInternalItems] = useState<OrderItemWithMeta[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [foundProducts, setFoundProducts] = useState<SearchableVariation[]>([]);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const { toast } = useToast();

  // ... (useEffect hooks remain the same) ...
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setInternalItems([]);
      setPhoneNumber('');
      setFoundCustomer(null);
      setProductSearch('');
      setFoundProducts([]);
      setStep(1);
      setIsNewCustomer(false);
      setIsEditingAddress(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const subtotal = internalItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const codCharges = formData.paymentInfo.method === 'COD' ? formData.adminPricingInfo.codCharges || 0 : 0;
    const grandTotal = subtotal + formData.adminPricingInfo.shippingCharges + formData.adminPricingInfo.taxes + codCharges;

    setFormData(prev => ({
      ...prev,
      items: internalItems,
      adminPricingInfo: { ...prev.adminPricingInfo, subtotal, grandTotal },
    }));
  }, [internalItems, formData.adminPricingInfo.shippingCharges, formData.adminPricingInfo.taxes, formData.adminPricingInfo.codCharges, formData.paymentInfo.method]);

  // Remove auto-search, only search on button click

  useEffect(() => {
    const handler = setTimeout(() => {
      if (productSearch.length >= 3) searchProducts();
    }, 300);
    return () => clearTimeout(handler);
  }, [productSearch]);

  useEffect(() => {
    const zip = formData.shippingAddress.zip;
    if (zip.length === 6) fetchPincodeData(zip);
  }, [formData.shippingAddress.zip]);

  const fetchPincodeData = async (pincode: string) => {
    setIsPincodeLoading(true);
    try {
      const result = await authenticatedFetch(`/api/pincode/${pincode}`);
      if (result.success && result.data) {
        setFormData(p => ({ ...p, shippingAddress: { ...p.shippingAddress, city: result.data.city, state: result.data.state } }));
      }
    } catch (error: any) {
      toast({ title: 'Pincode Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsPincodeLoading(false);
    }
  }

  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]/.test(cleaned);
  };

  const searchCustomer = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit mobile number starting with 6-9',
        variant: 'destructive'
      });
      return;
    }

    setIsSearchingCustomer(true);
    try {
      // Use the phone-specific endpoint since customers are stored with phone as document ID
      const formattedPhone = `+91${phoneNumber}`;
      const result = await authenticatedFetch(`/api/customers/${formattedPhone}`);

      if (result.success && result.data) {
        const customer = result.data;
        setFoundCustomer(customer);
        setIsNewCustomer(false);
        setFormData(prev => ({
          ...prev,
          customerInfo: {
            customerId: customer.customerId,
            name: customer.name,
            phone: customer.phone,
            email: customer.email || ''
          }
        }));

        // Set default address if available
        if (customer.defaultAddress) {
          setFormData(prev => ({
            ...prev,
            shippingAddress: { ...customer.defaultAddress, country: 'India' }
          }));
        } else if (customer.savedAddresses && customer.savedAddresses.length > 0) {
          setFormData(prev => ({
            ...prev,
            shippingAddress: { ...customer.savedAddresses[0], country: 'India' }
          }));
        }

        toast({ title: 'Customer Found', description: `Found: ${customer.name}` });
      } else {
        // Customer not found
        setFoundCustomer(null);
        setIsNewCustomer(true);
        toast({ title: 'New Customer', description: 'No customer found with this phone number.' });
      }
    } catch (error: any) {
      // If 404, it means customer doesn't exist
      if (error.message.includes('404') || error.message.includes('not found')) {
        setFoundCustomer(null);
        setIsNewCustomer(true);
        toast({ title: 'New Customer', description: 'No customer found. Please enter details.' });
      } else {
        toast({ title: 'Search Error', description: error.message, variant: 'destructive' });
      }
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const searchProducts = async () => {
    if (productSearch.length < 3) return;
    try {
      const result = await authenticatedFetch(`/api/products?search=${productSearch}`);
      setFoundProducts(result.data || []);
    } catch (error: any) {
      toast({ title: 'Product Search Error', description: error.message, variant: 'destructive' });
    }
  };

  const updateItemPrice = (sku: string, newPrice: number) => {
    setInternalItems(items =>
      items.map(item =>
        item.sku === sku ? { ...item, unitPrice: newPrice } : item
      )
    );
  };

  // ... (addProductToOrder, updateItemQuantity, handleSaveOrder functions remain the same) ...
  const addProductToOrder = (variation: SearchableVariation) => {
    const existingItem = internalItems.find(item => item.sku === variation.sku);
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      if (newQuantity > existingItem.stock) {
        toast({ title: 'Stock Alert', description: `Cannot add more than ${existingItem.stock} units for ${variation.variationName}.`, variant: 'destructive' });
        return;
      }
      setInternalItems(items => items.map(item => item.sku === variation.sku ? { ...item, quantity: newQuantity } : item));
    } else {
      if (1 > variation.stock) {
        toast({ title: 'Stock Alert', description: `Cannot add ${variation.variationName}, it is out of stock.`, variant: 'destructive' });
        return;
      }
      const newItem: OrderItemWithMeta = {
        productId: variation.productId,
        variationId: variation.variationId || null,
        productName: variation.variationName,
        quantity: 1,
        unitPrice: variation.price,
        sku: variation.sku,
        stock: variation.stock,
        weight: variation.weight,
        dimensions: variation.dimensions,
      };
      setInternalItems(items => [...items, newItem]);
    }
    setProductSearch('');
    setFoundProducts([]);
  };

  const updateItemQuantity = (sku: string, quantity: number) => {
    const itemToUpdate = internalItems.find(item => item.sku === sku);
    if (!itemToUpdate) return;

    if (quantity > itemToUpdate.stock) {
      toast({ title: 'Stock Alert', description: `Only ${itemToUpdate.stock} units available.` });
      setInternalItems(items => items.map(item => item.sku === sku ? { ...item, quantity: itemToUpdate.stock } : item));
      return;
    }

    if (quantity <= 0) {
      setInternalItems(items => items.filter(item => item.sku !== sku));
    } else {
      setInternalItems(items => items.map(item => item.sku === sku ? { ...item, quantity } : item));
    }
  };

  const handleSaveOrder = useCallback(async () => {
    if (formData.items.length === 0) {
      toast({ title: 'Validation Error', description: 'Cannot create an order with no items.', variant: 'destructive' });
      return;
    }

    const { status, ...paymentInfoForPayload } = formData.paymentInfo;
    const formattedPhone = `+91${phoneNumber}`;

    // Prepare customer info, excluding empty email to avoid Firestore undefined values
    const customerInfo: any = {
      ...formData.customerInfo,
      phone: formattedPhone,
    };

    // Only include email if it's not empty (Firestore doesn't allow undefined values)
    if (formData.customerInfo.email && formData.customerInfo.email.trim()) {
      customerInfo.email = formData.customerInfo.email.trim();
    } else {
      // Remove email field entirely if empty to avoid undefined in Firestore
      delete customerInfo.email;
    }

    const payload: CreateOrder = {
      orderSource: 'admin_form',
      customerInfo,
      shippingAddress: formData.shippingAddress,
      items: formData.items.map(({ stock, ...item }) => item),
      paymentInfo: paymentInfoForPayload,
      manualPricingInfo: formData.adminPricingInfo,
      ...(formData.couponCode && { couponCode: formData.couponCode }),
      ...(formData.trafficSource && { trafficSource: formData.trafficSource }),
    };

    setIsSaving(true);
    try {
      const result = await authenticatedFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      toast({ title: 'Success!', description: `Order ${result.orderId} created.` });
      onOrderCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [formData, onOrderCreated, onOpenChange, toast]);

  // ... (the rest of the component's JSX remains exactly the same) ...
  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const getTrustScoreVariant = (score: number = 0): "default" | "secondary" | "destructive" => {
    if (score > 75) return 'default';
    if (score > 40) return 'secondary';
    return 'destructive';
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>Step {step} of 3</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="py-4 space-y-4">
            <h4 className="font-semibold">Customer Search</h4>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter 10-digit mobile number"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                className="flex-1"
              />
              <Button
                onClick={searchCustomer}
                disabled={isSearchingCustomer || !validatePhoneNumber(phoneNumber)}
              >
                {isSearchingCustomer ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {foundCustomer && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-green-800">{foundCustomer.name}</p>
                    <p className="text-sm text-green-600">{foundCustomer.phone} • {foundCustomer.email}</p>
                    <p className="text-xs text-green-600">
                      {foundCustomer.totalOrders} orders • Trust: {foundCustomer.trustScore}% • {foundCustomer.loyaltyTier}
                    </p>
                  </div>
                  <Badge variant={getTrustScoreVariant(foundCustomer.trustScore)}>
                    {foundCustomer.trustScore}% Trusted
                  </Badge>
                </div>

                {/* Address Selection for Existing Customer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Shipping Address</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingAddress(!isEditingAddress)}
                    >
                      {isEditingAddress ? 'Cancel' : 'Edit Address'}
                    </Button>
                  </div>

                  {!isEditingAddress ? (
                    <div className="p-2 bg-white border rounded text-sm">
                      {formData.shippingAddress.street ? (
                        <>
                          {formData.shippingAddress.street}<br />
                          {formData.shippingAddress.city}, {formData.shippingAddress.state} - {formData.shippingAddress.zip}
                        </>
                      ) : (
                        <span className="text-muted-foreground">No address available. Click Edit to add.</span>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <Input
                          placeholder="Street address"
                          value={formData.shippingAddress.street}
                          onChange={e => setFormData(p => ({ ...p, shippingAddress: { ...p.shippingAddress, street: e.target.value } }))}
                        />
                      </div>
                      <Input
                        placeholder="PIN Code"
                        value={formData.shippingAddress.zip}
                        onChange={e => setFormData(p => ({ ...p, shippingAddress: { ...p.shippingAddress, zip: e.target.value } }))}
                        maxLength={6}
                      />
                      <Input
                        placeholder="City"
                        value={formData.shippingAddress.city}
                        onChange={e => setFormData(p => ({ ...p, shippingAddress: { ...p.shippingAddress, city: e.target.value } }))}
                        disabled={isPincodeLoading}
                      />
                      <div className="col-span-2">
                        <Input
                          placeholder="State"
                          value={formData.shippingAddress.state}
                          onChange={e => setFormData(p => ({ ...p, shippingAddress: { ...p.shippingAddress, state: e.target.value } }))}
                          disabled={isPincodeLoading}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isNewCustomer && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h5 className="font-semibold text-blue-800 mb-3">New Customer Details</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name *</Label><Input value={formData.customerInfo.name} onChange={e => setFormData(p => ({ ...p, customerInfo: { ...p.customerInfo, name: e.target.value } }))} /></div>
                  <div><Label>Email</Label><Input value={formData.customerInfo.email || ''} onChange={e => setFormData(p => ({ ...p, customerInfo: { ...p.customerInfo, email: e.target.value } }))} /></div>
                  <div className="col-span-2"><Label>Street Address *</Label><Input value={formData.shippingAddress.street} onChange={e => setFormData(p => ({ ...p, shippingAddress: { ...p.shippingAddress, street: e.target.value } }))} /></div>
                  <div><Label>PIN Code *</Label><Input value={formData.shippingAddress.zip} onChange={e => setFormData(p => ({ ...p, shippingAddress: { ...p.shippingAddress, zip: e.target.value } }))} maxLength={6} /></div>
                  <div><Label>City *</Label><Input value={formData.shippingAddress.city} onChange={e => setFormData(p => ({ ...p, shippingAddress: { ...p.shippingAddress, city: e.target.value } }))} disabled={isPincodeLoading} /></div>
                  <div className="col-span-2"><Label>State *</Label><Input value={formData.shippingAddress.state} onChange={e => setFormData(p => ({ ...p, shippingAddress: { ...p.shippingAddress, state: e.target.value } }))} disabled={isPincodeLoading} /></div>
                </div>
                {isPincodeLoading && <p className="text-sm text-muted-foreground mt-2">Fetching city & state...</p>}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className='py-4 space-y-4'>
            <h4 className='font-semibold'>Order Items</h4>
            <div className='flex gap-2'>
              <Input placeholder='Search by product name, variation, or SKU...' value={productSearch} onChange={e => setProductSearch(e.target.value)} />
            </div>
            {foundProducts.length > 0 && (
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {foundProducts.map(p => (
                  <button key={p.sku} onClick={() => addProductToOrder(p)} className="block w-full text-left p-2 hover:bg-slate-100">
                    <p className="font-semibold">{p.variationName}</p>
                    <p className="text-sm text-muted-foreground">SKU: {p.sku} | Price: {p.price} | Stock: {p.stock}</p>
                  </button>
                ))}
              </div>
            )}
            <div className='border rounded-md mt-4'>
              <div className='grid grid-cols-6 p-2 font-semibold border-b text-sm'>
                <div className="col-span-2">Product</div><div>Price</div><div>Qty</div><div className="text-right">Total</div><div></div>
              </div>
              {internalItems.length === 0 ? (
                <p className='text-center text-muted-foreground p-4'>No items added yet.</p>
              ) : internalItems.map(item => (
                <div key={item.sku} className='grid grid-cols-6 p-2 items-center gap-2'>
                  <div className="col-span-2">
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div>
                    <Input
                      type='number'
                      value={item.unitPrice}
                      onChange={(e) => updateItemPrice(item.sku, parseFloat(e.target.value) || 0)}
                      className='w-20 h-8 text-sm'
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Input
                      type='number'
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(item.sku, parseInt(e.target.value) || 0)}
                      className='w-16 h-8 text-sm'
                    />
                  </div>
                  <div className="text-right text-sm font-medium">₹{(item.unitPrice * item.quantity).toFixed(2)}</div>
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInternalItems(items => items.filter(i => i.sku !== item.sku))}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="py-4 space-y-4">
            <h4 className="font-semibold">Review & Finalize</h4>
            <div className='grid grid-cols-2 gap-8'>
              <div>
                <h5 className='font-semibold mb-2'>Customer & Shipping</h5>
                <p>{formData.customerInfo.name}</p>
                <p>{formData.customerInfo.phone}</p>
                <p>{formData.shippingAddress.street}, {formData.shippingAddress.city}, {formData.shippingAddress.state} - {formData.shippingAddress.zip}</p>

                <h5 className='font-semibold mb-2 mt-4'>Coupon & Marketing</h5>
                <div className="space-y-2">
                  <div>
                    <Label>Coupon Code (Optional)</Label>
                    <Input
                      placeholder="SAVE20"
                      value={formData.couponCode || ''}
                      onChange={e => setFormData(p => ({ ...p, couponCode: e.target.value.toUpperCase() }))}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label>Traffic Source</Label>
                    <Select
                      value={formData.trafficSource?.source || ''}
                      onValueChange={v => setFormData(p => ({ ...p, trafficSource: { ...p.trafficSource, source: v as any } }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="google_ads">Google Ads</SelectItem>
                        <SelectItem value="meta_ads">Meta Ads</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.trafficSource?.source && (
                    <div>
                      <Label>Campaign (Optional)</Label>
                      <Input
                        placeholder="summer_sale_2024"
                        value={formData.trafficSource?.campaign || ''}
                        onChange={e => setFormData(p => ({
                          ...p,
                          trafficSource: {
                            ...p.trafficSource,
                            source: p.trafficSource?.source || 'direct',
                            campaign: e.target.value
                          }
                        }))}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h5 className='font-semibold mb-2'>Payment</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Shipping</Label><Input type='number' value={formData.adminPricingInfo.shippingCharges} onChange={e => setFormData(p => ({ ...p, adminPricingInfo: { ...p.adminPricingInfo, shippingCharges: Number(e.target.value) } }))} /></div>
                  <div><Label>Taxes</Label><Input type='number' value={formData.adminPricingInfo.taxes} onChange={e => setFormData(p => ({ ...p, adminPricingInfo: { ...p.adminPricingInfo, taxes: Number(e.target.value) } }))} /></div>
                  {formData.paymentInfo.method === 'COD' && (
                    <div><Label>COD Charges</Label><Input type='number' value={formData.adminPricingInfo.codCharges} onChange={e => setFormData(p => ({ ...p, adminPricingInfo: { ...p.adminPricingInfo, codCharges: Number(e.target.value) } }))} /></div>
                  )}
                  <div>
                    <Label>Method</Label>
                    <Select value={formData.paymentInfo.method} onValueChange={v => setFormData(p => ({ ...p, paymentInfo: { ...p.paymentInfo, method: v as 'COD' | 'Prepaid' } }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="COD">COD</SelectItem><SelectItem value="Prepaid">Prepaid</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <div className='mt-4 pt-4 border-t'>
              <div className='flex justify-between'><p>Subtotal:</p><p>{formData.adminPricingInfo.subtotal.toFixed(2)}</p></div>
              <div className='flex justify-between'><p>Shipping:</p><p>{formData.adminPricingInfo.shippingCharges.toFixed(2)}</p></div>
              {formData.paymentInfo.method === 'COD' && <div className='flex justify-between'><p>COD Charges:</p><p>{(formData.adminPricingInfo.codCharges || 0).toFixed(2)}</p></div>}
              <div className='flex justify-between'><p>Taxes:</p><p>{formData.adminPricingInfo.taxes.toFixed(2)}</p></div>
              <div className='flex justify-between font-bold text-lg'><p>Grand Total:</p><p>{formData.adminPricingInfo.grandTotal.toFixed(2)}</p></div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          {step > 1 && <Button variant="ghost" onClick={prevStep}>Back</Button>}
          <div className="flex-grow"></div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {step === 3 ? (
            <Button onClick={handleSaveOrder} disabled={isSaving}>{isSaving ? 'Creating Order...' : 'Create Order'}</Button>
          ) : (
            <Button onClick={nextStep} disabled={(step === 1 && (!phoneNumber || (!foundCustomer && !isNewCustomer))) || (step === 2 && internalItems.length === 0)}>
              Next
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}