'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/api/utils';
import { useToast } from '@/hooks/use-toast';
import type { Employee } from '@/types/employee';

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    aadharNumber: '',
    department: '',
    designation: '',
    employmentType: 'full-time' as 'full-time' | 'part-time' | 'contract',
    status: 'active' as 'active' | 'inactive' | 'terminated',
    baseSalary: '',
    hra: '',
    da: '',
    transport: '',
    otherAllowances: '',
    pf: '',
    esi: '',
    tax: '',
    otherDeductions: '',
    totalLeavesPerYear: '',
    casualLeaves: '',
    sickLeaves: '',
    earnedLeaves: '',
  });

  useEffect(() => {
    loadEmployee();
  }, [employeeId]);

  const loadEmployee = async () => {
    try {
      const data = await authenticatedFetch(`/api/employees/${employeeId}`);
      const emp = data.employee;
      setEmployee(emp);
      
      setFormData({
        name: emp.personalInfo.name,
        email: emp.personalInfo.email || '',
        phone: emp.personalInfo.phone,
        address: emp.personalInfo.address || '',
        dateOfBirth: emp.personalInfo.dateOfBirth || '',
        aadharNumber: emp.personalInfo.aadharNumber || '',
        department: emp.employmentDetails.department,
        designation: emp.employmentDetails.designation,
        employmentType: emp.employmentDetails.employmentType,
        status: emp.employmentDetails.status,
        baseSalary: emp.salaryStructure.baseSalary.toString(),
        hra: emp.salaryStructure.allowances.hra.toString(),
        da: emp.salaryStructure.allowances.da.toString(),
        transport: emp.salaryStructure.allowances.transport.toString(),
        otherAllowances: emp.salaryStructure.allowances.other.toString(),
        pf: emp.salaryStructure.deductions.pf.toString(),
        esi: emp.salaryStructure.deductions.esi.toString(),
        tax: emp.salaryStructure.deductions.tax.toString(),
        otherDeductions: emp.salaryStructure.deductions.other.toString(),
        totalLeavesPerYear: emp.leaveConfig.totalLeavesPerYear.toString(),
        casualLeaves: emp.leaveConfig.casualLeaves.toString(),
        sickLeaves: emp.leaveConfig.sickLeaves.toString(),
        earnedLeaves: emp.leaveConfig.earnedLeaves.toString(),
      });
    } catch (error) {
      console.error('Failed to load employee:', error);
    }
  };

  const calculateNetSalary = () => {
    const base = parseFloat(formData.baseSalary) || 0;
    const allowances = (parseFloat(formData.hra) || 0) + 
                      (parseFloat(formData.da) || 0) + 
                      (parseFloat(formData.transport) || 0) + 
                      (parseFloat(formData.otherAllowances) || 0);
    const deductions = (parseFloat(formData.pf) || 0) + 
                      (parseFloat(formData.esi) || 0) + 
                      (parseFloat(formData.tax) || 0) + 
                      (parseFloat(formData.otherDeductions) || 0);
    return base + allowances - deductions;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setIsSubmitting(true);

    try {
      const employeeData = {
        personalInfo: {
          ...employee.personalInfo,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          dateOfBirth: formData.dateOfBirth,
          aadharNumber: formData.aadharNumber,
        },
        employmentDetails: {
          ...employee.employmentDetails,
          department: formData.department,
          designation: formData.designation,
          employmentType: formData.employmentType,
          status: formData.status,
        },
        salaryStructure: {
          baseSalary: parseFloat(formData.baseSalary) || 0,
          allowances: {
            hra: parseFloat(formData.hra) || 0,
            da: parseFloat(formData.da) || 0,
            transport: parseFloat(formData.transport) || 0,
            other: parseFloat(formData.otherAllowances) || 0,
          },
          deductions: {
            pf: parseFloat(formData.pf) || 0,
            esi: parseFloat(formData.esi) || 0,
            tax: parseFloat(formData.tax) || 0,
            other: parseFloat(formData.otherDeductions) || 0,
          },
          netSalary: calculateNetSalary(),
        },
        leaveConfig: {
          ...employee.leaveConfig,
          totalLeavesPerYear: parseInt(formData.totalLeavesPerYear) || 24,
          casualLeaves: parseInt(formData.casualLeaves) || 12,
          sickLeaves: parseInt(formData.sickLeaves) || 12,
          earnedLeaves: parseInt(formData.earnedLeaves) || 0,
        },
      };

      await authenticatedFetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        body: JSON.stringify(employeeData),
      });

      toast({
        title: 'Success',
        description: 'Employee updated successfully',
      });

      router.push(`/employees/${employeeId}`);
    } catch (error) {
      console.error('Failed to update employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to update employee',
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
        <h1 className="font-headline text-3xl font-bold text-foreground">Edit Employee</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Personal Details</TabsTrigger>
            <TabsTrigger value="salary">Salary Structure</TabsTrigger>
            <TabsTrigger value="leaves">Leave Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aadharNumber">Aadhar Number</Label>
                    <Input
                      id="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                      maxLength={12}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Employment Type *</Label>
                    <Select
                      value={formData.employmentType}
                      onValueChange={(value: any) => setFormData({ ...formData, employmentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full Time</SelectItem>
                        <SelectItem value="part-time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation *</Label>
                    <Input
                      id="designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Salary Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="baseSalary">Base Salary *</Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-3">Allowances</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="hra">HRA</Label>
                        <Input
                          id="hra"
                          type="number"
                          value={formData.hra}
                          onChange={(e) => setFormData({ ...formData, hra: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="da">DA</Label>
                        <Input
                          id="da"
                          type="number"
                          value={formData.da}
                          onChange={(e) => setFormData({ ...formData, da: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transport">Transport</Label>
                        <Input
                          id="transport"
                          type="number"
                          value={formData.transport}
                          onChange={(e) => setFormData({ ...formData, transport: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="otherAllowances">Other</Label>
                        <Input
                          id="otherAllowances"
                          type="number"
                          value={formData.otherAllowances}
                          onChange={(e) => setFormData({ ...formData, otherAllowances: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Deductions</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="pf">PF</Label>
                        <Input
                          id="pf"
                          type="number"
                          value={formData.pf}
                          onChange={(e) => setFormData({ ...formData, pf: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="esi">ESI</Label>
                        <Input
                          id="esi"
                          type="number"
                          value={formData.esi}
                          onChange={(e) => setFormData({ ...formData, esi: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tax">Tax</Label>
                        <Input
                          id="tax"
                          type="number"
                          value={formData.tax}
                          onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="otherDeductions">Other</Label>
                        <Input
                          id="otherDeductions"
                          type="number"
                          value={formData.otherDeductions}
                          onChange={(e) => setFormData({ ...formData, otherDeductions: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Net Salary</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{calculateNetSalary().toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaves" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Leave Allocation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalLeavesPerYear">Total Leaves Per Year</Label>
                    <Input
                      id="totalLeavesPerYear"
                      type="number"
                      value={formData.totalLeavesPerYear}
                      onChange={(e) => setFormData({ ...formData, totalLeavesPerYear: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="casualLeaves">Casual Leaves</Label>
                    <Input
                      id="casualLeaves"
                      type="number"
                      value={formData.casualLeaves}
                      onChange={(e) => setFormData({ ...formData, casualLeaves: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sickLeaves">Sick Leaves</Label>
                    <Input
                      id="sickLeaves"
                      type="number"
                      value={formData.sickLeaves}
                      onChange={(e) => setFormData({ ...formData, sickLeaves: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="earnedLeaves">Earned Leaves</Label>
                    <Input
                      id="earnedLeaves"
                      type="number"
                      value={formData.earnedLeaves}
                      onChange={(e) => setFormData({ ...formData, earnedLeaves: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Link href={`/employees/${employeeId}`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Employee'}
          </Button>
        </div>
      </form>
    </div>
  );
}
