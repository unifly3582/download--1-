'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api/utils';

interface CloseIssueDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  issueId: string;
  onSuccess: () => void;
}

export function CloseIssueDialog({ isOpen, onOpenChange, issueId, onSuccess }: CloseIssueDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    resolution: '',
    resolutionNotes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.resolution) {
      toast({
        title: 'Missing field',
        description: 'Resolution is required',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await authenticatedFetch(`/api/issues/${issueId}`, {
        method: 'DELETE',
        body: JSON.stringify(formData)
      });

      if (data.success) {
        toast({
          title: 'Issue closed',
          description: 'Issue has been closed successfully'
        });

        setFormData({
          resolution: '',
          resolutionNotes: ''
        });

        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close issue',
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
          <DialogTitle>Close Issue</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resolution">
              Resolution <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="resolution"
              placeholder="How was this issue resolved?"
              value={formData.resolution}
              onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolutionNotes">Additional Notes</Label>
            <Textarea
              id="resolutionNotes"
              placeholder="Any additional details about the resolution..."
              value={formData.resolutionNotes}
              onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Close Issue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
