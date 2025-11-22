'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Calendar, DollarSign, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/api/utils';
import type { Employee, Attendance, Advance } from '@/types/employee';

interface WorkerStats {
  presentToday: number;
  totalDaysThisMonth: number;
  wageEarnedThisMonth: number;
  advancesTaken: number;
  netPayable: number;
}

export default function WorkersPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workerStats, setWorkerStats] = useState<Record<string, WorkerStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadWorkersData();
  }, []);

  const loadWorkersData = async () => {
    try {
      const data = await authenticatedFetch('/api/employees');
      const activeWorkers = (data.employees || []).filter(
        (emp: Employee) => emp.employmentDetails.status === 'active'
      );
      setEmployees(activeWorkers);

      // Load stats for each worker
      const statsPromises = activeWorkers.map(async (emp: Employee) => {
        const [attData, advData] = await Promise.all([
          authenticatedFetch(`/api/employees/${emp.id}/attendance?month=${currentMonth}&year=${currentYear}`),
          authenticatedFetch(`/api/employees/${emp.id}/advances`),
        ]);

        const attendance = attData.attendance || [];
        const advances = advData.advances || [];

        // Calculate stats
        const presentDays = attendance.filter((a: any) => 
          a.status === 'present' || a.status === 'half-day'
        ).length;
        
        const halfDays = attendance.filter((a: any) => a.status === 'half-day').length;
        const totalDays = presentDays - (halfDays * 0.5);
        
        const wageEarned = totalDays * emp.salaryConfig.dailyWage;
        
        const pendingAdvances = advances
          .filter((adv: any) => adv.repaymentStatus !== 'completed')
          .reduce((sum: number, adv: any) => sum + adv.amountRemaining, 0);

        const netPayable = wageEarned - pendingAdvances;

        // Check if present today
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendance.find((a: any) => a.date === today);
        const presentToday = todayAttendance?.status === 'present' || todayAttendance?.status === 'half-day' ? 1 : 0;

        return {
          id: emp.id,
          stats: {
            presentToday,
            totalDaysThisMonth: totalDays,
            wageEarnedThisMonth: wageEarned,
            advancesTaken: pendingAdvances,
            netPayable,
          },
        };
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap: Record<string, WorkerStats> = {};
      statsResults.forEach(({ id, stats }) => {
        statsMap[id] = stats;
      });
      setWorkerStats(statsMap);
    } catch (error) {
      console.error('Failed to load workers data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const totalStats = {
    activeWorkers: employees.length,
    presentToday: Object.values(workerStats).reduce((sum, s) => sum + s.presentToday, 0),
    totalWagesThisMonth: Object.values(workerStats).reduce((sum, s) => sum + s.wageEarnedThisMonth, 0),
    totalAdvances: Object.values(workerStats).reduce((sum, s) => sum + s.advancesTaken, 0),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold text-foreground">Workers</h1>
        <div className="flex gap-2">
          <Link href="/attendance">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
          </Link>
          <Link href="/workers/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Worker
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.activeWorkers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStats.presentToday}</div>
            <p className="text-xs text-muted-foreground">out of {totalStats.activeWorkers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wages This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{totalStats.totalWagesThisMonth.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Advances</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{totalStats.totalAdvances.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Worker Overview - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading workers...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active workers. Add your first worker!
            </div>
          ) : (
            <div className="space-y-3">
              {employees.slice(0, 10).map((employee) => {
                const stats = workerStats[employee.id] || {
                  presentToday: 0,
                  totalDaysThisMonth: 0,
                  wageEarnedThisMonth: 0,
                  advancesTaken: 0,
                  netPayable: 0,
                };

                return (
                  <Link key={employee.id} href={`/workers/${employee.id}`}>
                    <div className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={employee.personalInfo.photoUrl} />
                          <AvatarFallback className="text-lg">{getInitials(employee.personalInfo.name)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg">{employee.personalInfo.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {employee.employeeId}
                            </Badge>
                            {stats.presentToday === 1 && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Present Today
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {employee.personalInfo.phone} • Joined {new Date(employee.employmentDetails.joiningDate).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-6 text-center">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Monthly Salary</div>
                            <div className="font-semibold">₹{employee.salaryConfig.monthlySalary.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Days Worked</div>
                            <div className="font-semibold text-blue-600">{stats.totalDaysThisMonth.toFixed(1)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Wage Earned</div>
                            <div className="font-semibold text-green-600">₹{Math.round(stats.wageEarnedThisMonth).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Advances</div>
                            <div className="font-semibold text-orange-600">₹{Math.round(stats.advancesTaken).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Net Payable</div>
                            <div className="font-bold text-primary">₹{Math.round(stats.netPayable).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
