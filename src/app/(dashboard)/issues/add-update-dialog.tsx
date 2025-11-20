'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api/utils';

interface AddUpdateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  issueId: string;
  onSuccess: () => void;
}

export function AddUpdateDialog({ isOpen, onOpenChange, issueId, onSuccess }: AddUpdateDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    actionTaken: '',
    customerResponse: '',
    statusChange: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.actionTaken) {
      toast({
        title: 'Missing field',
        description: 'Action taken is required',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        statusChange: formData.statusChange || undefined
      };

      const data = await authenticatedFetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (data.success) {
        toast({
          title: 'Update added',
          description: 'Issue has been updated successfully'
        });

        setFormData({
          actionTaken: '',
          customerResponse: '',
          statusChange: '',
          notes: ''
        });

        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add update',
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
          <DialogTitle>Add Update</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="actionTaken">
              Action Taken <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="actionTaken"
              placeholder="What did you do to address this issue?"
              value={formData.actionTaken}
              onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerResponse">Customer Response</Label>
            <Textarea
              id="customerResponse"
              placeholder="What did the customer say?"
              value={formData.customerResponse}
              onChange={(e) => setFormData({ ...formData, customerResponse: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="statusChange">Change Status (optional)</Label>
            <Select value={formData.statusChange} onValueChange={(value) => setFormData({ ...formData, statusChange: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Keep current status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No change</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any other relevant information..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
