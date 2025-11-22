'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Search, UserCircle, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/api/utils';
import type { Employee } from '@/types/employee';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchQuery, employees]);

  const loadEmployees = async () => {
    try {
      const data = await authenticatedFetch('/api/employees');
      setEmployees(data.employees || []);
      calculateStats(data.employees || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (emps: Employee[]) => {
    setStats({
      total: emps.length,
      active: emps.filter(e => e.employmentDetails.status === 'active').length,
      inactive: emps.filter(e => e.employmentDetails.status !== 'active').length,
    });
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
      emp.employmentDetails.department.toLowerCase().includes(query) ||
      emp.employmentDetails.designation.toLowerCase().includes(query)
    );
    setFilteredEmployees(filtered);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      terminated: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold text-foreground">Employees</h1>
        <Link href="/employees/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <UserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <UserCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading employees...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No employees found matching your search' : 'No employees yet. Add your first employee!'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEmployees.map((employee) => (
                <Link key={employee.id} href={`/employees/${employee.id}`}>
                  <div className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={employee.personalInfo.photoUrl} />
                        <AvatarFallback>{getInitials(employee.personalInfo.name)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{employee.personalInfo.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {employee.employeeId}
                          </Badge>
                          <Badge className={`text-xs ${getStatusColor(employee.employmentDetails.status)}`}>
                            {employee.employmentDetails.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{employee.employmentDetails.designation}</span>
                          <span>•</span>
                          <span>{employee.employmentDetails.department}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {new Date(employee.employmentDetails.joiningDate).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ₹{employee.salaryStructure.netSalary.toLocaleString()}/mo
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
