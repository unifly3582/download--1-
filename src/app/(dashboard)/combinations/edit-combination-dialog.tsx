'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/utils';

interface CombinationItem {
  productId: string;
  variationId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  sku: string;
}

interface Combination {
  combinationHash: string;
  items: CombinationItem[];
  weight: number;
  dimensions: {
    l: number;
    b: number;
    h: number;
  };
  verifiedBy: string;
  verifiedAt: string;
  notes?: string;
  isActive: boolean;
  usageCount: number;
  totalItems: number;
  uniqueProducts: number;
}

interface EditCombinationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  combination: Combination;
  onCombinationUpdated: () => void;
}

export function EditCombinationDialog({ 
  isOpen, 
  onOpenChange, 
  combination, 
  onCombinationUpdated 
}: EditCombinationDialogProps) {
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (combination) {
      setWeight(combination.weight.toString());
      setLength(combination.dimensions.l.toString());
      setWidth(combination.dimensions.b.toString());
      setHeight(combination.dimensions.h.toString());
      setNotes(combination.notes || '');
    }
  }, [combination]);

  const handleSubmit = async () => {
    if (!weight || !length || !width || !height) {
      toast({ 
        title: 'Error', 
        description: 'Weight and dimensions are required.', 
        variant: 'destructive' 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authenticatedFetch(`/api/combinations/${combination.combinationHash}`, {
        method: 'PATCH',
        body: JSON.stringify({
          weight: parseFloat(weight),
          dimensions: {
            l: parseFloat(length),
            b: parseFloat(width),
            h: parseFloat(height),
          },
          notes: notes.trim() || undefined,
        }),
      });

      toast({ 
        title: 'Success', 
        description: result.message || 'Combination updated successfully' 
      });
      
      onCombinationUpdated();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Combination</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Products List */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <Label className="text-sm font-medium mb-2 block">Products in this combination:</Label>
            <div className="space-y-2">
              {combination.items.map((item, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium">{item.productName}</span>
                  <span className="text-muted-foreground"> (SKU: {item.sku}) × {item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              Hash: <span className="font-mono">{combination.combinationHash}</span>
            </div>
          </div>

          {/* Weight & Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (grams)</Label>
              <Input 
                id="weight" 
                type="number" 
                value={weight} 
                onChange={(e) => setWeight(e.target.value)} 
                placeholder="e.g., 1100" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="length">Length (cm)</Label>
              <Input 
                id="length" 
                type="number" 
                value={length} 
                onChange={(e) => setLength(e.target.value)} 
                placeholder="e.g., 22"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (cm)</Label>
              <Input 
                id="width" 
                type="number" 
                value={width} 
                onChange={(e) => setWidth(e.target.value)} 
                placeholder="e.g., 18"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input 
                id="height" 
                type="number" 
                value={height} 
                onChange={(e) => setHeight(e.target.value)} 
                placeholder="e.g., 12"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Add any notes about this combination..."
              rows={3}
            />
          </div>

          {/* Usage Stats */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Usage Count:</span>
                <span className="font-medium ml-2">{combination.usageCount} times</span>
              </div>
              <div>
                <span className="text-muted-foreground">Verified:</span>
                <span className="font-medium ml-2">
                  {new Date(combination.verifiedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
