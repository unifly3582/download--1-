'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Testimonial } from '@/types/testimonial';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, MoreHorizontal, Edit, Trash2, ExternalLink, Eye } from 'lucide-react';
import { CreateTestimonialDialog } from './create-testimonial-dialog';
import { EditTestimonialDialog } from './edit-testimonial-dialog';
import { authenticatedFetch } from '@/lib/api/utils';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);

  const fetchTestimonials = useCallback(async () => {
    setIsLoading(true);
    try {
      const isActive = activeTab === 'active' ? 'true' : activeTab === 'inactive' ? 'false' : null;
      const params = new URLSearchParams();
      if (isActive !== null) params.append('isActive', isActive);
      
      const result = await authenticatedFetch(`/api/admin/testimonials?${params.toString()}`);
      setTestimonials(result.data);
    } catch (error: any) {
      toast({ 
        title: 'Error Fetching Testimonials', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, activeTab]);

  useEffect(() => { 
    fetchTestimonials(); 
  }, [fetchTestimonials]);

  const handleEditClick = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (testimonialId: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    
    try {
      await authenticatedFetch(`/api/admin/testimonials/${testimonialId}`, {
        method: 'DELETE',
      });
      
      toast({
        title: 'Success',
        description: 'Testimonial deleted successfully',
      });
      fetchTestimonials();
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to delete testimonial: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const getYouTubeUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;

  const renderTable = (testimonialList: Testimonial[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Video ID</TableHead>
          <TableHead>Display Order</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center h-24">Loading...</TableCell>
          </TableRow>
        ) : testimonialList.length > 0 ? (
          testimonialList.map((testimonial) => (
            <TableRow key={testimonial.id}>
              <TableCell className="font-medium">{testimonial.customerName}</TableCell>
              <TableCell>{testimonial.customerLocation}</TableCell>
              <TableCell className="font-mono text-sm">
                <div className="flex items-center gap-2">
                  {testimonial.youtubeVideoId}
                  <a 
                    href={getYouTubeUrl(testimonial.youtubeVideoId)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </TableCell>
              <TableCell>{testimonial.displayOrder}</TableCell>
              <TableCell>
                <Badge variant={testimonial.isActive ? 'default' : 'secondary'}>
                  {testimonial.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>{new Date(testimonial.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4"/>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <a 
                        href={getYouTubeUrl(testimonial.youtubeVideoId)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View on YouTube
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditClick(testimonial)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(testimonial.id)} 
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="text-center h-24">
              No testimonials found in this category.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold text-foreground">Customer Testimonials</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage YouTube testimonial videos</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> 
          Add Testimonial
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <Card>
            <CardContent className="p-0">
              {renderTable(testimonials)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inactive">
          <Card>
            <CardContent className="p-0">
              {renderTable(testimonials)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              {renderTable(testimonials)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateTestimonialDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onTestimonialCreated={fetchTestimonials}
      />

      {selectedTestimonial && (
        <EditTestimonialDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          testimonial={selectedTestimonial}
          onTestimonialUpdated={fetchTestimonials}
        />
      )}
    </div>
  );
}
