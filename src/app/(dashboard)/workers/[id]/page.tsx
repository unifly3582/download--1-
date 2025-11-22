'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, DollarSign, TrendingUp, UserX } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/api/utils';
import { useToast } from '@/hooks/use-toast';
import type { Employee, Attendance, Advance, SalaryPayment } from '@/types/employee';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function WorkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const workerId = params.id as string;

  const [worker, setWorker] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadWorkerData();
  }, [workerId]);

  const loadWorkerData = async () => {
    try {
      const [workerData, attData, advData, salData] = await Promise.all([
        authenticatedFetch(`/api/employees/${workerId}`),
        authenticatedFetch(`/api/employees/${workerId}/attendance?month=${currentMonth}&year=${currentYear}`),
        authenticatedFetch(`/api/employees/${workerId}/advances`),
        authenticatedFetch(`/api/employees/${workerId}/salary`),
      ]);

      setWorker(workerData.employee);
      setAttendance(attData.attendance || []);
      setAdvances(advData.advances || []);
      setSalaryPayments(salData.payments || []);
    } catch (error) {
      console.error('Failed to load worker data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMakeInactive = async () => {
    try {
      await authenticatedFetch(`/api/employees/${workerId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...worker,
          employmentDetails: {
            ...worker?.employmentDetails,
            status: 'inactive',
            leavingDate: new Date().toISOString().split('T')[0],
          },
        }),
      });

      toast({
        title: 'Success',
        description: 'Worker marked as inactive',
      });

      router.push('/workers');
    } catch (error) {
      console.error('Failed to update worker:', error);
      toast({
        title: 'Error',
        description: 'Failed to update worker status',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!worker) {
    return <div className="p-6">Worker not found</div>;
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Calculate stats
  const presentDays = attendance.filter(a => a.status === 'present' || a.status === 'half-day').length;
  const halfDays = attendance.filter(a => a.status === 'half-day').length;
  const totalDays = presentDays - (halfDays * 0.5);
  const wageEarned = totalDays * worker.salaryConfig.dailyWage;
  const pendingAdvances = advances
    .filter(adv => adv.repaymentStatus !== 'completed')
    .reduce((sum, adv) => sum + adv.amountRemaining, 0);
  const netPayable = wageEarned - pendingAdvances;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/workers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="font-headline text-3xl font-bold text-foreground">Worker Details</h1>
        </div>
        {worker.employmentDetails.status === 'active' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <UserX className="h-4 w-4 mr-2" />
                Mark Inactive
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark Worker as Inactive?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark {worker.personalInfo.name} as inactive. They will no longer appear in active worker lists.
                  You can reactivate them later if needed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleMakeInactive}>
                  Mark Inactive
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={worker.personalInfo.photoUrl} />
                <AvatarFallback className="text-2xl">{getInitials(worker.personalInfo.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{worker.personalInfo.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{worker.employeeId}</p>
              </div>
              <Badge className={worker.employmentDetails.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {worker.employmentDetails.status}
              </Badge>
              <div className="w-full pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{worker.personalInfo.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="font-medium">
                    {new Date(worker.employmentDetails.joiningDate).toLocaleDateString()}
                  </span>
                </div>
                {worker.employmentDetails.leavingDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Left</span>
                    <span className="font-medium">
                      {new Date(worker.employmentDetails.leavingDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Salary</span>
                  <span className="font-medium">₹{worker.salaryConfig.monthlySalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Wage</span>
                  <span className="font-medium">₹{worker.salaryConfig.dailyWage.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Days Worked</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDays.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wage Earned</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{Math.round(wageEarned).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Advances</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">₹{Math.round(pendingAdvances).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Payable</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">₹{Math.round(netPayable).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">After advances</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="attendance" className="space-y-4">
            <TabsList>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="advances">Advances</TabsTrigger>
              <TabsTrigger value="salary">Salary History</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Attendance - {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardTitle>
                  <Link href="/attendance">
                    <Button size="sm">Mark Attendance</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {attendance.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No attendance records for this month</p>
                  ) : (
                    <div className="space-y-2">
                      {attendance.slice(0, 15).map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{new Date(att.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            {att.checkInTime && (
                              <p className="text-sm text-muted-foreground">
                                {att.checkInTime} - {att.checkOutTime || 'Not checked out'}
                              </p>
                            )}
                          </div>
                          <Badge className={
                            att.status === 'present' ? 'bg-green-100 text-green-800' :
                            att.status === 'absent' ? 'bg-red-100 text-red-800' :
                            att.status === 'half-day' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {att.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advances">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Advance History</CardTitle>
                  <Link href={`/workers/${workerId}/advance`}>
                    <Button size="sm">Give Advance</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {advances.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No advances given</p>
                  ) : (
                    <div className="space-y-2">
                      {advances.map((advance) => (
                        <div key={advance.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">₹{advance.amount.toLocaleString()}</p>
                            <Badge className={
                              advance.repaymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                              advance.repaymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {advance.repaymentStatus}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Given on {new Date(advance.dateGiven).toLocaleDateString()}
                          </p>
                          <p className="text-sm">{advance.reason}</p>
                          {advance.amountRemaining > 0 && (
                            <p className="text-sm text-orange-600 mt-2 font-medium">
                              Remaining: ₹{advance.amountRemaining.toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="salary">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Salary Payment History</CardTitle>
                  <Link href={`/workers/${workerId}/pay-salary`}>
                    <Button size="sm">Pay Salary</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {salaryPayments.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No salary payments recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {salaryPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              {new Date(payment.year, payment.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Paid on {new Date(payment.paymentDate).toLocaleDateString()} via {payment.paymentMode}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₹{payment.netPaid.toLocaleString()}</p>
                            <Badge className="bg-green-100 text-green-800">
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
