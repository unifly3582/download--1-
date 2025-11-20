'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api/utils';

interface AddActionLogDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onSuccess: () => void;
}

export function AddActionLogDialog({
  isOpen,
  onOpenChange,
  orderId,
  onSuccess
}: AddActionLogDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    actionType: '',
    actionDetails: '',
    customerResponse: '',
    outcome: '',
    nextAction: '',
    nextActionBy: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.actionType || !formData.actionDetails || !formData.outcome) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const data = await authenticatedFetch(`/api/orders/${orderId}/action-log`, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          nextActionBy: formData.nextActionBy || undefined
        })
      });
      
      if (data.success) {
        toast({
          title: 'Action logged',
          description: 'Action has been recorded successfully'
        });
        
        // Reset form
        setFormData({
          actionType: '',
          actionDetails: '',
          customerResponse: '',
          outcome: '',
          nextAction: '',
          nextActionBy: '',
          notes: ''
        });
        
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(data.error || 'Failed to add action log');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add action log',
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
          <DialogTitle>Log Action for Order</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Type */}
          <div className="space-y-2">
            <Label htmlFor="actionType">
              Action Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.actionType}
              onValueChange={(value) => setFormData({ ...formData, actionType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call_placed">📞 Call Placed (Connected)</SelectItem>
                <SelectItem value="call_attempted">📵 Call Attempted (No Answer)</SelectItem>
                <SelectItem value="whatsapp_sent">💬 WhatsApp Message Sent</SelectItem>
                <SelectItem value="email_sent">📧 Email Sent</SelectItem>
                <SelectItem value="sms_sent">📱 SMS Sent</SelectItem>
                <SelectItem value="ticket_raised">🎫 Ticket Raised</SelectItem>
                <SelectItem value="address_verified">📍 Address Verified</SelectItem>
                <SelectItem value="address_updated">🔄 Address Updated</SelectItem>
                <SelectItem value="payment_verified">💳 Payment Verified</SelectItem>
                <SelectItem value="payment_issue">⚠️ Payment Issue</SelectItem>
                <SelectItem value="refund_initiated">💰 Refund Initiated</SelectItem>
                <SelectItem value="courier_contacted">🚚 Courier Contacted</SelectItem>
                <SelectItem value="shipment_delayed">⏰ Shipment Delayed</SelectItem>
                <SelectItem value="delivery_rescheduled">📅 Delivery Rescheduled</SelectItem>
                <SelectItem value="customer_complaint">😟 Customer Complaint</SelectItem>
                <SelectItem value="quality_issue">⚠️ Quality Issue</SelectItem>
                <SelectItem value="return_requested">↩️ Return Requested</SelectItem>
                <SelectItem value="replacement_sent">🔄 Replacement Sent</SelectItem>
                <SelectItem value="follow_up">👀 Follow-up</SelectItem>
                <SelectItem value="internal_note">📝 Internal Note</SelectItem>
                <SelectItem value="other">📋 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Details */}
          <div className="space-y-2">
            <Label htmlFor="actionDetails">
              Action Details <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="actionDetails"
              placeholder="Describe what action you took..."
              value={formData.actionDetails}
              onChange={(e) => setFormData({ ...formData, actionDetails: e.target.value })}
              rows={3}
            />
          </div>

          {/* Customer Response */}
          <div className="space-y-2">
            <Label htmlFor="customerResponse">Customer Response</Label>
            <Textarea
              id="customerResponse"
              placeholder="What did the customer say or do?"
              value={formData.customerResponse}
              onChange={(e) => setFormData({ ...formData, customerResponse: e.target.value })}
              rows={2}
            />
          </div>

          {/* Outcome */}
          <div className="space-y-2">
            <Label htmlFor="outcome">
              Outcome <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.outcome}
              onValueChange={(value) => setFormData({ ...formData, outcome: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="pending">Still Pending</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="no_response">No Response</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Next Action */}
          <div className="space-y-2">
            <Label htmlFor="nextAction">Next Action Required</Label>
            <Textarea
              id="nextAction"
              placeholder="What needs to be done next?"
              value={formData.nextAction}
              onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
              rows={2}
            />
          </div>

          {/* Next Action By (Date/Time) */}
          <div className="space-y-2">
            <Label htmlFor="nextActionBy">Follow-up Date & Time</Label>
            <Input
              id="nextActionBy"
              type="datetime-local"
              value={formData.nextActionBy}
              onChange={(e) => setFormData({ ...formData, nextActionBy: e.target.value })}
            />
          </div>

          {/* Additional Notes */}
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
              Save Action Log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
