'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/api/utils';
import { useToast } from '@/hooks/use-toast';
import type { Employee, Attendance, Advance } from '@/types/employee';

export default function PaySalaryPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const workerId = params.id as string;

  const [worker, setWorker] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'cash' as 'cash' | 'bank-transfer' | 'upi',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [workerId, formData.month, formData.year]);

  const loadData = async () => {
    try {
      const [workerData, attData, advData] = await Promise.all([
        authenticatedFetch(`/api/employees/${workerId}`),
        authenticatedFetch(`/api/employees/${workerId}/attendance?month=${formData.month}&year=${formData.year}`),
        authenticatedFetch(`/api/employees/${workerId}/advances`),
      ]);

      setWorker(workerData.employee);
      setAttendance(attData.attendance || []);
      setAdvances(advData.advances || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const calculatePayment = () => {
    if (!worker) return { daysWorked: 0, wageEarned: 0, advances: 0, netPayable: 0 };

    const presentDays = attendance.filter(a => a.status === 'present' || a.status === 'half-day').length;
    const halfDays = attendance.filter(a => a.status === 'half-day').length;
    const daysWorked = presentDays - (halfDays * 0.5);
    const wageEarned = daysWorked * worker.salaryConfig.dailyWage;
    
    const pendingAdvances = advances
      .filter(adv => adv.repaymentStatus !== 'completed')
      .reduce((sum, adv) => sum + adv.amountRemaining, 0);

    const netPayable = wageEarned - pendingAdvances;

    return {
      daysWorked,
      wageEarned,
      advances: pendingAdvances,
      netPayable,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;

    setIsSubmitting(true);

    try {
      const payment = calculatePayment();

      await authenticatedFetch(`/api/employees/${workerId}/salary`, {
        method: 'POST',
        body: JSON.stringify({
          month: formData.month,
          year: formData.year,
          amount: payment.wageEarned,
          paymentDate: formData.paymentDate,
          paymentMode: formData.paymentMode,
          status: 'paid',
          advanceDeducted: payment.advances,
          netPaid: payment.netPayable,
          notes: formData.notes,
        }),
      });

      // Mark advances as completed
      const advancesToComplete = advances.filter(adv => adv.repaymentStatus !== 'completed');
      for (const advance of advancesToComplete) {
        await authenticatedFetch(`/api/employees/${workerId}/advances/${advance.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            repaymentStatus: 'completed',
            amountRepaid: advance.amount,
            amountRemaining: 0,
          }),
        });
      }

      toast({
        title: 'Success',
        description: 'Salary payment recorded successfully',
      });

      router.push(`/workers/${workerId}`);
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!worker) {
    return <div className="p-6">Loading...</div>;
  }

  const payment = calculatePayment();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href={`/workers/${workerId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-headline text-3xl font-bold text-foreground">Pay Salary</h1>
          <p className="text-muted-foreground">{worker.personalInfo.name}</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Salary Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Month *</Label>
                <Select
                  value={formData.month.toString()}
                  onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMode">Payment Mode *</Label>
              <Select
                value={formData.paymentMode}
                onValueChange={(value: any) => setFormData({ ...formData, paymentMode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
              <h3 className="font-semibold">Salary Calculation</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Salary</span>
                  <span className="font-medium">₹{worker.salaryConfig.monthlySalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Wage</span>
                  <span className="font-medium">₹{worker.salaryConfig.dailyWage.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days Worked</span>
                  <span className="font-medium">{payment.daysWorked.toFixed(1)} days</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Wage Earned</span>
                  <span className="font-semibold text-green-600">₹{Math.round(payment.wageEarned).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span className="font-medium">Advances Deducted</span>
                  <span className="font-semibold">- ₹{Math.round(payment.advances).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-bold text-lg">Net Payable</span>
                  <span className="font-bold text-lg text-primary">₹{Math.round(payment.netPayable).toLocaleString()}</span>
                </div>
              </div>
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

            <div className="flex justify-end gap-4 pt-4">
              <Link href={`/workers/${workerId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || payment.netPayable <= 0}>
                {isSubmitting ? 'Recording...' : `Pay ₹${Math.round(payment.netPayable).toLocaleString()}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
