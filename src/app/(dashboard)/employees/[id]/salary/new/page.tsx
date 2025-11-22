'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/api/utils';
import { useToast } from '@/hooks/use-toast';
import type { Employee } from '@/types/employee';

export default function NewSalaryPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'bank-transfer' as 'cash' | 'bank-transfer' | 'upi' | 'cheque',
    advanceDeducted: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadEmployee();
  }, [employeeId]);

  const loadEmployee = async () => {
    try {
      const data = await authenticatedFetch(`/api/employees/${employeeId}`);
      setEmployee(data.employee);
    } catch (error) {
      console.error('Failed to load employee:', error);
    }
  };

  const calculateNetPaid = () => {
    if (!employee) return 0;
    const netSalary = employee.salaryStructure.netSalary;
    const advanceDeducted = parseFloat(formData.advanceDeducted) || 0;
    return netSalary - advanceDeducted;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setIsSubmitting(true);

    try {
      await authenticatedFetch(`/api/employees/${employeeId}/salary`, {
        method: 'POST',
        body: JSON.stringify({
          month: formData.month,
          year: formData.year,
          amount: employee.salaryStructure.netSalary,
          paymentDate: formData.paymentDate,
          paymentMode: formData.paymentMode,
          status: 'paid',
          advanceDeducted: parseFloat(formData.advanceDeducted) || 0,
          netPaid: calculateNetPaid(),
          notes: formData.notes,
        }),
      });

      toast({
        title: 'Success',
        description: 'Salary payment recorded successfully',
      });

      router.push(`/employees/${employeeId}`);
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

  if (!employee) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href={`/employees/${employeeId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-headline text-3xl font-bold text-foreground">Record Salary Payment</h1>
          <p className="text-muted-foreground">{employee.personalInfo.name}</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
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
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Net Salary</span>
                <span className="font-medium">₹{employee.salaryStructure.netSalary.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="advanceDeducted">Advance Deducted</Label>
              <Input
                id="advanceDeducted"
                type="number"
                value={formData.advanceDeducted}
                onChange={(e) => setFormData({ ...formData, advanceDeducted: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Amount to Pay</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{calculateNetPaid().toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href={`/employees/${employeeId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
