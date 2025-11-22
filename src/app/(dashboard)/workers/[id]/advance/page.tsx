'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/api/utils';
import { useToast } from '@/hooks/use-toast';

export default function GiveAdvancePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const workerId = params.id as string;

  const [formData, setFormData] = useState({
    amount: '',
    dateGiven: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await authenticatedFetch(`/api/employees/${workerId}/advances`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          dateGiven: formData.dateGiven,
          reason: formData.reason,
          notes: formData.notes,
        }),
      });

      toast({
        title: 'Success',
        description: 'Advance recorded successfully',
      });

      router.push(`/workers/${workerId}`);
    } catch (error) {
      console.error('Failed to record advance:', error);
      toast({
        title: 'Error',
        description: 'Failed to record advance',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href={`/workers/${workerId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-foreground">Give Advance</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Advance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="Enter advance amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateGiven">Date Given *</Label>
              <Input
                id="dateGiven"
                type="date"
                value={formData.dateGiven}
                onChange={(e) => setFormData({ ...formData, dateGiven: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                placeholder="e.g., Medical emergency, Personal need"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes (optional)"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This advance will be deducted from the worker's next salary payment.
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href={`/workers/${workerId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Recording...' : 'Give Advance'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
