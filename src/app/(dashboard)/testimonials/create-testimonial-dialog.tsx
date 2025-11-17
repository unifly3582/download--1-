'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTestimonialSchema, type CreateTestimonial } from '@/types/testimonial';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api/utils';

interface CreateTestimonialDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTestimonialCreated: () => void;
}

export function CreateTestimonialDialog({
  isOpen,
  onOpenChange,
  onTestimonialCreated,
}: CreateTestimonialDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(CreateTestimonialSchema),
    defaultValues: {
      youtubeVideoId: '',
      customerName: '',
      customerLocation: '',
      title: '',
      description: '',
      displayOrder: 0,
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await authenticatedFetch('/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      toast({
        title: 'Success',
        description: 'Testimonial created successfully',
      });

      reset();
      onTestimonialCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create testimonial',
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
          <DialogTitle>Add New Testimonial</DialogTitle>
          <DialogDescription>
            Add a YouTube testimonial video from a customer
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
            <p className="text-xs text-muted-foreground">
              The video ID from the YouTube URL (e.g., youtube.com/watch?v=<strong>dQw4w9WgXcQ</strong>)
            </p>
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
              {isSubmitting ? 'Creating...' : 'Create Testimonial'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
