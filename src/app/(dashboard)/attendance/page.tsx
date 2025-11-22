'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Check, X, Clock, Coffee, Umbrella, Search } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api/utils';
import { useToast } from '@/hooks/use-toast';
import type { Employee } from '@/types/employee';

interface AttendanceRecord {
  employeeId: string;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'holiday' | null;
  checkInTime: string;
  checkOutTime: string;
}

export default function BulkAttendancePage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchQuery, employees]);

  useEffect(() => {
    if (employees.length > 0) {
      loadAttendanceForDate();
    }
  }, [selectedDate, employees]);

  const loadEmployees = async () => {
    try {
      const data = await authenticatedFetch('/api/employees');
      const activeEmployees = (data.employees || []).filter(
        (emp: Employee) => emp.employmentDetails.status === 'active'
      );
      setEmployees(activeEmployees);
      
      // Initialize attendance records
      const initialAttendance: Record<string, AttendanceRecord> = {};
      activeEmployees.forEach((emp: Employee) => {
        initialAttendance[emp.id] = {
          employeeId: emp.id,
          status: null,
          checkInTime: '09:00',
          checkOutTime: '18:00',
        };
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttendanceForDate = async () => {
    try {
      // Load existing attendance for the selected date
      const promises = employees.map(emp =>
        authenticatedFetch(`/api/employees/${emp.id}/attendance?date=${selectedDate}`)
          .then(data => ({ employeeId: emp.id, data: data.attendance || [] }))
          .catch(() => ({ employeeId: emp.id, data: [] }))
      );

      const results = await Promise.all(promises);
      
      const updatedAttendance = { ...attendance };
      results.forEach(({ employeeId, data }) => {
        const record = data.find((a: any) => a.date === selectedDate);
        if (record) {
          updatedAttendance[employeeId] = {
            employeeId,
            status: record.status,
            checkInTime: record.checkInTime || '09:00',
            checkOutTime: record.checkOutTime || '18:00',
          };
        } else {
          updatedAttendance[employeeId] = {
            employeeId,
            status: null,
            checkInTime: '09:00',
            checkOutTime: '18:00',
          };
        }
      });
      
      setAttendance(updatedAttendance);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    }
  };

  const filterEmployees = () => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = employees.filter(emp =>
      emp.personalInfo.name.toLowerCase().includes(query) ||
      emp.employeeId.toLowerCase().includes(query) ||
      emp.employmentDetails.department.toLowerCase().includes(query)
    );
    setFilteredEmployees(filtered);
  };

  const updateAttendance = (employeeId: string, field: keyof AttendanceRecord, value: any) => {
    setAttendance(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value,
      },
    }));
  };

  const markStatus = (employeeId: string, status: AttendanceRecord['status']) => {
    updateAttendance(employeeId, 'status', status);
  };

  const markAllPresent = () => {
    const updated = { ...attendance };
    filteredEmployees.forEach(emp => {
      updated[emp.id] = {
        ...updated[emp.id],
        status: 'present',
      };
    });
    setAttendance(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const recordsToSave = Object.values(attendance).filter(record => record.status !== null);
      
      if (recordsToSave.length === 0) {
        toast({
          title: 'No Changes',
          description: 'Please mark attendance for at least one employee',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      const promises = recordsToSave.map(record =>
        authenticatedFetch(`/api/employees/${record.employeeId}/attendance`, {
          method: 'POST',
          body: JSON.stringify({
            date: selectedDate,
            status: record.status,
            checkInTime: record.status === 'present' || record.status === 'half-day' ? record.checkInTime : undefined,
            checkOutTime: record.status === 'present' || record.status === 'half-day' ? record.checkOutTime : undefined,
          }),
        })
      );

      await Promise.all(promises);

      toast({
        title: 'Success',
        description: `Attendance saved for ${recordsToSave.length} employee(s)`,
      });
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to save attendance',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: AttendanceRecord['status']) => {
    const colors = {
      present: 'bg-green-100 text-green-800 border-green-300',
      absent: 'bg-red-100 text-red-800 border-red-300',
      'half-day': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      leave: 'bg-blue-100 text-blue-800 border-blue-300',
      holiday: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return status ? colors[status] : '';
  };

  const stats = {
    total: filteredEmployees.length,
    present: Object.values(attendance).filter(a => a.status === 'present').length,
    absent: Object.values(attendance).filter(a => a.status === 'absent').length,
    halfDay: Object.values(attendance).filter(a => a.status === 'half-day').length,
    leave: Object.values(attendance).filter(a => a.status === 'leave').length,
    unmarked: Object.values(attendance).filter(a => a.status === null).length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold text-foreground">Daily Attendance</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Half Day</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.halfDay}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave</CardTitle>
            <Umbrella className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.leave}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unmarked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.unmarked}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mark Attendance</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={markAllPresent}>
                Mark All Present
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading employees...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No employees found' : 'No active employees'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEmployees.map((employee) => {
                const record = attendance[employee.id];
                return (
                  <div
                    key={employee.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      record?.status ? getStatusColor(record.status) : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={employee.personalInfo.photoUrl} />
                        <AvatarFallback>{getInitials(employee.personalInfo.name)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{employee.personalInfo.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {employee.employeeId}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {employee.employmentDetails.designation} • {employee.employmentDetails.department}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(record?.status === 'present' || record?.status === 'half-day') && (
                          <div className="flex items-center gap-2 mr-4">
                            <input
                              type="time"
                              value={record.checkInTime}
                              onChange={(e) => updateAttendance(employee.id, 'checkInTime', e.target.value)}
                              className="px-2 py-1 border rounded text-sm"
                            />
                            <span className="text-xs text-muted-foreground">to</span>
                            <input
                              type="time"
                              value={record.checkOutTime}
                              onChange={(e) => updateAttendance(employee.id, 'checkOutTime', e.target.value)}
                              className="px-2 py-1 border rounded text-sm"
                            />
                          </div>
                        )}

                        <Button
                          size="sm"
                          variant={record?.status === 'present' ? 'default' : 'outline'}
                          onClick={() => markStatus(employee.id, 'present')}
                          className="min-w-[80px]"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={record?.status === 'absent' ? 'default' : 'outline'}
                          onClick={() => markStatus(employee.id, 'absent')}
                          className="min-w-[80px]"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Absent
                        </Button>
                        <Button
                          size="sm"
                          variant={record?.status === 'half-day' ? 'default' : 'outline'}
                          onClick={() => markStatus(employee.id, 'half-day')}
                          className="min-w-[80px]"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Half Day
                        </Button>
                        <Button
                          size="sm"
                          variant={record?.status === 'leave' ? 'default' : 'outline'}
                          onClick={() => markStatus(employee.id, 'leave')}
                          className="min-w-[80px]"
                        >
                          <Umbrella className="h-4 w-4 mr-1" />
                          Leave
                        </Button>
                        <Button
                          size="sm"
                          variant={record?.status === 'holiday' ? 'default' : 'outline'}
                          onClick={() => markStatus(employee.id, 'holiday')}
                          className="min-w-[80px]"
                        >
                          <Coffee className="h-4 w-4 mr-1" />
                          Holiday
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
