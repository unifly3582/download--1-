'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/api/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function NewWorkerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    joiningDate: new Date().toISOString().split('T')[0],
    monthlySalary: '18000',
    holidaysPerMonth: '4',
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const handlePhotoChange = (file: File | null) => {
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview('');
  };

  const calculateDailyWage = () => {
    const monthly = parseFloat(formData.monthlySalary) || 0;
    return (monthly / 30).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const monthlySalary = parseFloat(formData.monthlySalary) || 0;
      const dailyWage = monthlySalary / 30;

      const workerData = {
        personalInfo: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          photoUrl: photoPreview, // In production, upload to storage
        },
        employmentDetails: {
          joiningDate: formData.joiningDate,
          status: 'active',
        },
        salaryConfig: {
          monthlySalary,
          dailyWage,
          holidaysPerMonth: parseInt(formData.holidaysPerMonth) || 4,
        },
      };

      await authenticatedFetch('/api/employees', {
        method: 'POST',
        body: JSON.stringify(workerData),
      });

      toast({
        title: 'Success',
        description: 'Worker added successfully',
      });

      router.push('/workers');
    } catch (error) {
      console.error('Failed to add worker:', error);
      toast({
        title: 'Error',
        description: 'Failed to add worker. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/workers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-foreground">Add New Worker</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Worker Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="photo">Worker Photo</Label>
              {photoPreview ? (
                <div className="relative w-32 h-32">
                  <Image
                    src={photoPreview}
                    alt="Worker"
                    width={128}
                    height={128}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removePhoto}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter worker name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                placeholder="Enter address (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="joiningDate">Joining Date *</Label>
              <Input
                id="joiningDate"
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                required
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold">Salary Configuration</h3>
              
              <div className="space-y-2">
                <Label htmlFor="monthlySalary">Monthly Salary *</Label>
                <Input
                  id="monthlySalary"
                  type="number"
                  value={formData.monthlySalary}
                  onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
                  required
                  placeholder="e.g., 18000"
                />
                <p className="text-sm text-muted-foreground">
                  Daily wage: ₹{calculateDailyWage()} (Monthly salary ÷ 30 days)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="holidaysPerMonth">Holidays Per Month</Label>
                <Input
                  id="holidaysPerMonth"
                  type="number"
                  value={formData.holidaysPerMonth}
                  onChange={(e) => setFormData({ ...formData, holidaysPerMonth: e.target.value })}
                  placeholder="e.g., 4"
                />
                <p className="text-sm text-muted-foreground">
                  Number of paid holidays allowed per month
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>• Monthly Salary: ₹{formData.monthlySalary}</p>
                <p>• Daily Wage: ₹{calculateDailyWage()}</p>
                <p>• Holidays: {formData.holidaysPerMonth} days/month</p>
                <p>• Working Days: {30 - parseInt(formData.holidaysPerMonth || '4')} days/month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/workers">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Worker'}
          </Button>
        </div>
      </form>
    </div>
  );
}
