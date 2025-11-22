'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/api/utils';
import { useToast } from '@/hooks/use-toast';
import type { Employee, Attendance } from '@/types/employee';

export default function AttendancePage() {
  const params = useParams();
  const { toast } = useToast();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string>('present');
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('18:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [employeeId, currentMonth, currentYear]);

  const loadData = async () => {
    try {
      const [empData, attData] = await Promise.all([
        authenticatedFetch(`/api/employees/${employeeId}`),
        authenticatedFetch(`/api/employees/${employeeId}/attendance?month=${currentMonth + 1}&year=${currentYear}`),
      ]);

      setEmployee(empData.employee);
      setAttendance(attData.attendance || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleMarkAttendance = async () => {
    setIsSubmitting(true);
    try {
      await authenticatedFetch(`/api/employees/${employeeId}/attendance`, {
        method: 'POST',
        body: JSON.stringify({
          date: selectedDate.toISOString().split('T')[0],
          status: selectedStatus,
          checkInTime: selectedStatus === 'present' || selectedStatus === 'half-day' ? checkInTime : undefined,
          checkOutTime: selectedStatus === 'present' || selectedStatus === 'half-day' ? checkOutTime : undefined,
        }),
      });

      toast({
        title: 'Success',
        description: 'Attendance marked successfully',
      });

      loadData();
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAttendanceForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return attendance.find(a => a.date === dateStr);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      present: 'bg-green-500',
      absent: 'bg-red-500',
      'half-day': 'bg-yellow-500',
      leave: 'bg-blue-500',
      holiday: 'bg-purple-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const monthAttendance = attendance.filter(a => {
    const date = new Date(a.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const summary = {
    present: monthAttendance.filter(a => a.status === 'present').length,
    absent: monthAttendance.filter(a => a.status === 'absent').length,
    halfDay: monthAttendance.filter(a => a.status === 'half-day').length,
    leave: monthAttendance.filter(a => a.status === 'leave').length,
    holiday: monthAttendance.filter(a => a.status === 'holiday').length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href={`/employees/${employeeId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-headline text-3xl font-bold text-foreground">Attendance Management</h1>
          {employee && (
            <p className="text-muted-foreground">{employee.personalInfo.name}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mark Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Date</label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                  modifiers={{
                    present: (date) => getAttendanceForDate(date)?.status === 'present',
                    absent: (date) => getAttendanceForDate(date)?.status === 'absent',
                    halfDay: (date) => getAttendanceForDate(date)?.status === 'half-day',
                    leave: (date) => getAttendanceForDate(date)?.status === 'leave',
                    holiday: (date) => getAttendanceForDate(date)?.status === 'holiday',
                  }}
                  modifiersStyles={{
                    present: { backgroundColor: '#22c55e', color: 'white' },
                    absent: { backgroundColor: '#ef4444', color: 'white' },
                    halfDay: { backgroundColor: '#eab308', color: 'white' },
                    leave: { backgroundColor: '#3b82f6', color: 'white' },
                    holiday: { backgroundColor: '#a855f7', color: 'white' },
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="half-day">Half Day</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(selectedStatus === 'present' || selectedStatus === 'half-day') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Check In Time</label>
                    <input
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Check Out Time</label>
                    <input
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleMarkAttendance} disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Marking...' : 'Mark Attendance'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary - {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{summary.present}</div>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{summary.halfDay}</div>
                  <p className="text-xs text-muted-foreground">Half Day</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{summary.leave}</div>
                  <p className="text-xs text-muted-foreground">Leave</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{summary.holiday}</div>
                  <p className="text-xs text-muted-foreground">Holiday</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-sm">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-sm">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500"></div>
                <span className="text-sm">Half Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span className="text-sm">Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-500"></div>
                <span className="text-sm">Holiday</span>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Recent Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monthAttendance.slice(0, 10).map((att) => (
                  <div key={att.id} className="flex items-center justify-between text-sm">
                    <span>{new Date(att.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <Badge className={`${getStatusColor(att.status)} text-white`}>
                      {att.status}
                    </Badge>
                  </div>
                ))}
                {monthAttendance.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground text-sm">No records yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
