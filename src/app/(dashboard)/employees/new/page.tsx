'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/api/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function NewEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    aadharNumber: '',
    joiningDate: '',
    department: '',
    designation: '',
    employmentType: 'full-time' as 'full-time' | 'part-time' | 'contract',
    baseSalary: '',
    hra: '',
    da: '',
    transport: '',
    otherAllowances: '',
    pf: '',
    esi: '',
    tax: '',
    otherDeductions: '',
    totalLeavesPerYear: '24',
    casualLeaves: '12',
    sickLeaves: '12',
    earnedLeaves: '0',
  });

  const [images, setImages] = useState({
    photo: null as File | null,
    aadharFront: null as File | null,
    aadharBack: null as File | null,
  });

  const [imagePreviews, setImagePreviews] = useState({
    photo: '',
    aadharFront: '',
    aadharBack: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (type: 'photo' | 'aadharFront' | 'aadharBack', file: File | null) => {
    if (file) {
      setImages(prev => ({ ...prev, [type]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (type: 'photo' | 'aadharFront' | 'aadharBack') => {
    setImages(prev => ({ ...prev, [type]: null }));
    setImagePreviews(prev => ({ ...prev, [type]: '' }));
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
    setIsSubmitting(true);

    try {
      // Upload images first
      const uploadedUrls = {
        photoUrl: '',
        aadharFrontUrl: '',
        aadharBackUrl: '',
      };

      // In production, upload to Firebase Storage or your storage service
      // For now, we'll use placeholder URLs
      if (images.photo) uploadedUrls.photoUrl = imagePreviews.photo;
      if (images.aadharFront) uploadedUrls.aadharFrontUrl = imagePreviews.aadharFront;
      if (images.aadharBack) uploadedUrls.aadharBackUrl = imagePreviews.aadharBack;

      const employeeData = {
        personalInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          dateOfBirth: formData.dateOfBirth,
          aadharNumber: formData.aadharNumber,
          ...uploadedUrls,
        },
        employmentDetails: {
          joiningDate: formData.joiningDate,
          department: formData.department,
          designation: formData.designation,
          employmentType: formData.employmentType,
          status: 'active',
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
          totalLeavesPerYear: parseInt(formData.totalLeavesPerYear) || 24,
          casualLeaves: parseInt(formData.casualLeaves) || 12,
          sickLeaves: parseInt(formData.sickLeaves) || 12,
          earnedLeaves: parseInt(formData.earnedLeaves) || 0,
          leavesUsed: 0,
          leavesRemaining: parseInt(formData.totalLeavesPerYear) || 24,
        },
      };

      await authenticatedFetch('/api/employees', {
        method: 'POST',
        body: JSON.stringify(employeeData),
      });

      toast({
        title: 'Success',
        description: 'Employee added successfully',
      });

      router.push('/employees');
    } catch (error) {
      console.error('Failed to add employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to add employee. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-foreground">Add New Employee</h1>
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
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aadharNumber">Aadhar Number</Label>
                    <Input
                      id="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={(e) => handleInputChange('aadharNumber', e.target.value)}
                      maxLength={12}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documents & Photos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['photo', 'aadharFront', 'aadharBack'] as const).map((type) => (
                    <div key={type} className="space-y-2">
                      <Label>
                        {type === 'photo' ? 'Employee Photo' : 
                         type === 'aadharFront' ? 'Aadhar Front' : 'Aadhar Back'}
                      </Label>
                      {imagePreviews[type] ? (
                        <div className="relative">
                          <Image
                            src={imagePreviews[type]}
                            alt={type}
                            width={200}
                            height={200}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => removeImage(type)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Upload Image</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleImageChange(type, e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                    </div>
                  ))}
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
                    <Label htmlFor="joiningDate">Joining Date *</Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Employment Type *</Label>
                    <Select
                      value={formData.employmentType}
                      onValueChange={(value) => handleInputChange('employmentType', value)}
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
                    <Label htmlFor="department">Department *</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation *</Label>
                    <Input
                      id="designation"
                      value={formData.designation}
                      onChange={(e) => handleInputChange('designation', e.target.value)}
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
                    onChange={(e) => handleInputChange('baseSalary', e.target.value)}
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
                          onChange={(e) => handleInputChange('hra', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="da">DA</Label>
                        <Input
                          id="da"
                          type="number"
                          value={formData.da}
                          onChange={(e) => handleInputChange('da', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transport">Transport</Label>
                        <Input
                          id="transport"
                          type="number"
                          value={formData.transport}
                          onChange={(e) => handleInputChange('transport', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="otherAllowances">Other</Label>
                        <Input
                          id="otherAllowances"
                          type="number"
                          value={formData.otherAllowances}
                          onChange={(e) => handleInputChange('otherAllowances', e.target.value)}
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
                          onChange={(e) => handleInputChange('pf', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="esi">ESI</Label>
                        <Input
                          id="esi"
                          type="number"
                          value={formData.esi}
                          onChange={(e) => handleInputChange('esi', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tax">Tax</Label>
                        <Input
                          id="tax"
                          type="number"
                          value={formData.tax}
                          onChange={(e) => handleInputChange('tax', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="otherDeductions">Other</Label>
                        <Input
                          id="otherDeductions"
                          type="number"
                          value={formData.otherDeductions}
                          onChange={(e) => handleInputChange('otherDeductions', e.target.value)}
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
                      onChange={(e) => handleInputChange('totalLeavesPerYear', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="casualLeaves">Casual Leaves</Label>
                    <Input
                      id="casualLeaves"
                      type="number"
                      value={formData.casualLeaves}
                      onChange={(e) => handleInputChange('casualLeaves', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sickLeaves">Sick Leaves</Label>
                    <Input
                      id="sickLeaves"
                      type="number"
                      value={formData.sickLeaves}
                      onChange={(e) => handleInputChange('sickLeaves', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="earnedLeaves">Earned Leaves</Label>
                    <Input
                      id="earnedLeaves"
                      type="number"
                      value={formData.earnedLeaves}
                      onChange={(e) => handleInputChange('earnedLeaves', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/employees">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Employee'}
          </Button>
        </div>
      </form>
    </div>
  );
}
