'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Calendar, DollarSign, TrendingUp, FileText } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/api/utils';
import type { Employee, Attendance, SalaryPayment, Advance } from '@/types/employee';
import Image from 'next/image';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmployeeData();
  }, [employeeId]);

  const loadEmployeeData = async () => {
    try {
      const [empData, attData, salData, advData] = await Promise.all([
        authenticatedFetch(`/api/employees/${employeeId}`),
        authenticatedFetch(`/api/employees/${employeeId}/attendance`),
        authenticatedFetch(`/api/employees/${employeeId}/salary`),
        authenticatedFetch(`/api/employees/${employeeId}/advances`),
      ]);

      setEmployee(empData.employee);
      setAttendance(attData.attendance || []);
      setSalaryPayments(salData.payments || []);
      setAdvances(advData.advances || []);
    } catch (error) {
      console.error('Failed to load employee data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!employee) {
    return <div className="p-6">Employee not found</div>;
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      terminated: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthAttendance = attendance.filter(a => {
    const date = new Date(a.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const presentDays = monthAttendance.filter(a => a.status === 'present').length;
  const totalAdvances = advances.reduce((sum, adv) => sum + adv.amountRemaining, 0);
  const lastSalaryPayment = salaryPayments[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employees">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="font-headline text-3xl font-bold text-foreground">Employee Details</h1>
        </div>
        <Link href={`/employees/${employeeId}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={employee.personalInfo.photoUrl} />
                <AvatarFallback className="text-2xl">{getInitials(employee.personalInfo.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{employee.personalInfo.name}</h2>
                <p className="text-muted-foreground">{employee.employmentDetails.designation}</p>
                <p className="text-sm text-muted-foreground">{employee.employmentDetails.department}</p>
              </div>
              <Badge className={getStatusColor(employee.employmentDetails.status)}>
                {employee.employmentDetails.status}
              </Badge>
              <div className="w-full pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee ID</span>
                  <span className="font-medium">{employee.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="font-medium">
                    {new Date(employee.employmentDetails.joiningDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{employee.personalInfo.phone}</span>
                </div>
                {employee.personalInfo.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium text-xs">{employee.personalInfo.email}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{presentDays} Days</div>
                <p className="text-xs text-muted-foreground">Present</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Salary</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{employee.salaryStructure.netSalary.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Per Month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Advances</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalAdvances.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="salary">Salary</TabsTrigger>
              <TabsTrigger value="advances">Advances</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">
                        {employee.personalInfo.dateOfBirth 
                          ? new Date(employee.personalInfo.dateOfBirth).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Aadhar Number</p>
                      <p className="font-medium">{employee.personalInfo.aadharNumber || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{employee.personalInfo.address || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Salary Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Earnings</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Salary</span>
                          <span>₹{employee.salaryStructure.baseSalary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">HRA</span>
                          <span>₹{employee.salaryStructure.allowances.hra.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">DA</span>
                          <span>₹{employee.salaryStructure.allowances.da.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transport</span>
                          <span>₹{employee.salaryStructure.allowances.transport.toLocaleString()}</span>
                        </div>
                        {employee.salaryStructure.allowances.other > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Other</span>
                            <span>₹{employee.salaryStructure.allowances.other.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-2">Deductions</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">PF</span>
                          <span>₹{employee.salaryStructure.deductions.pf.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ESI</span>
                          <span>₹{employee.salaryStructure.deductions.esi.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax</span>
                          <span>₹{employee.salaryStructure.deductions.tax.toLocaleString()}</span>
                        </div>
                        {employee.salaryStructure.deductions.other > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Other</span>
                            <span>₹{employee.salaryStructure.deductions.other.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between font-semibold">
                        <span>Net Salary</span>
                        <span className="text-primary">₹{employee.salaryStructure.netSalary.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Leave Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Leaves</p>
                      <p className="text-2xl font-bold">{employee.leaveConfig.totalLeavesPerYear}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="text-2xl font-bold text-green-600">{employee.leaveConfig.leavesRemaining}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Casual</p>
                      <p className="font-medium">{employee.leaveConfig.casualLeaves}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sick</p>
                      <p className="font-medium">{employee.leaveConfig.sickLeaves}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Attendance Records</CardTitle>
                  <Link href={`/employees/${employeeId}/attendance`}>
                    <Button size="sm">Mark Attendance</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {monthAttendance.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No attendance records for this month</p>
                  ) : (
                    <div className="space-y-2">
                      {monthAttendance.slice(0, 10).map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{new Date(att.date).toLocaleDateString()}</p>
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

            <TabsContent value="salary">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Salary Payment History</CardTitle>
                  <Link href={`/employees/${employeeId}/salary/new`}>
                    <Button size="sm">Record Payment</Button>
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
                            <Badge className={
                              payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
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

            <TabsContent value="advances">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Advance History</CardTitle>
                  <Link href={`/employees/${employeeId}/advances/new`}>
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
                            <p className="text-sm text-muted-foreground mt-2">
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

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {employee.personalInfo.photoUrl && (
                      <div>
                        <p className="text-sm font-medium mb-2">Employee Photo</p>
                        <Image
                          src={employee.personalInfo.photoUrl}
                          alt="Employee"
                          width={200}
                          height={200}
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    {employee.personalInfo.aadharFrontUrl && (
                      <div>
                        <p className="text-sm font-medium mb-2">Aadhar Front</p>
                        <Image
                          src={employee.personalInfo.aadharFrontUrl}
                          alt="Aadhar Front"
                          width={200}
                          height={200}
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    {employee.personalInfo.aadharBackUrl && (
                      <div>
                        <p className="text-sm font-medium mb-2">Aadhar Back</p>
                        <Image
                          src={employee.personalInfo.aadharBackUrl}
                          alt="Aadhar Back"
                          width={200}
                          height={200}
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                  {!employee.personalInfo.photoUrl && !employee.personalInfo.aadharFrontUrl && !employee.personalInfo.aadharBackUrl && (
                    <p className="text-center py-8 text-muted-foreground">No documents uploaded</p>
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
