'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateTestimonialSchema, type UpdateTestimonial, type Testimonial } from '@/types/testimonial';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/utils';

interface EditTestimonialDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  testimonial: Testimonial;
  onTestimonialUpdated: () => void;
}

export function EditTestimonialDialog({
  isOpen,
  onOpenChange,
  testimonial,
  onTestimonialUpdated,
}: EditTestimonialDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<UpdateTestimonial>({
    resolver: zodResolver(UpdateTestimonialSchema),
  });

  const isActive = watch('isActive');

  useEffect(() => {
    if (testimonial) {
      reset({
        youtubeVideoId: testimonial.youtubeVideoId,
        customerName: testimonial.customerName,
        customerLocation: testimonial.customerLocation,
        title: testimonial.title || '',
        description: testimonial.description || '',
        displayOrder: testimonial.displayOrder,
        isActive: testimonial.isActive,
      });
    }
  }, [testimonial, reset]);

  const onSubmit = async (data: UpdateTestimonial) => {
    setIsSubmitting(true);
    try {
      await authenticatedFetch(`/api/admin/testimonials/${testimonial.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      toast({
        title: 'Success',
        description: 'Testimonial updated successfully',
      });

      onTestimonialUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update testimonial',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Testimonial</DialogTitle>
          <DialogDescription>
            Update testimonial details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtubeVideoId">
              YouTube Video ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="youtubeVideoId"
              placeholder="e.g., dQw4w9WgXcQ"
              {...register('youtubeVideoId')}
            />
            {errors.youtubeVideoId && (
              <p className="text-sm text-red-500">{errors.youtubeVideoId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerName">
              Customer Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="customerName"
              placeholder="e.g., John Doe"
              {...register('customerName')}
            />
            {errors.customerName && (
              <p className="text-sm text-red-500">{errors.customerName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerLocation">
              Location <span className="text-red-500">*</span>
            </Label>
            <Input
              id="customerLocation"
              placeholder="e.g., Mumbai, India"
              {...register('customerLocation')}
            />
            {errors.customerLocation && (
              <p className="text-sm text-red-500">{errors.customerLocation.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              placeholder="e.g., Amazing Product Quality"
              {...register('title')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the testimonial..."
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              min="0"
              {...register('displayOrder', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first (0 = highest priority)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
            <Label htmlFor="isActive">Active (visible on customer website)</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Testimonial'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
