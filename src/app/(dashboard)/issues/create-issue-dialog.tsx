'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api/utils';

interface CreateIssueDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateIssueDialog({ isOpen, onOpenChange, onSuccess }: CreateIssueDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    orderId: '',
    issueType: '',
    issueReason: '',
    issueDescription: '',
    priority: 'medium',
    assignedTo: '',
    tags: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.orderId || !formData.issueType || !formData.issueReason || !formData.issueDescription) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      const data = await authenticatedFetch('/api/issues', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (data.success) {
        toast({
          title: 'Issue created',
          description: `Issue ${data.data.issueId} has been created successfully`
        });

        setFormData({
          orderId: '',
          issueType: '',
          issueReason: '',
          issueDescription: '',
          priority: 'medium',
          assignedTo: '',
          tags: ''
        });

        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create issue',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orderId">
              Order ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="orderId"
              placeholder="e.g., 5085"
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issueType">
              Issue Type <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.issueType} onValueChange={(value) => setFormData({ ...formData, issueType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="missing_items">Missing Items</SelectItem>
                <SelectItem value="damaged_product">Damaged Product</SelectItem>
                <SelectItem value="wrong_item">Wrong Item Sent</SelectItem>
                <SelectItem value="address_issue">Address Issue</SelectItem>
                <SelectItem value="delivery_delay">Delivery Delay</SelectItem>
                <SelectItem value="customer_unavailable">Customer Unavailable</SelectItem>
                <SelectItem value="payment_issue">Payment Issue</SelectItem>
                <SelectItem value="quality_complaint">Quality Complaint</SelectItem>
                <SelectItem value="return_request">Return Request</SelectItem>
                <SelectItem value="courier_problem">Courier Problem</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issueReason">
              Issue Reason <span className="text-red-500">*</span>
            </Label>
            <Input
              id="issueReason"
              placeholder="Why did this problem occur?"
              value={formData.issueReason}
              onChange={(e) => setFormData({ ...formData, issueReason: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issueDescription">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="issueDescription"
              placeholder="Detailed description of the issue..."
              value={formData.issueDescription}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To</Label>
            <Input
              id="assignedTo"
              placeholder="Email or name"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="urgent, warehouse, etc."
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Issue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
