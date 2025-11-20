'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api/utils';
import { useToast } from '@/hooks/use-toast';
import type { Issue } from '@/types/issue';
import { CreateIssueDialog } from '@/app/(dashboard)/issues/create-issue-dialog';
import { IssueDetailsDialog } from '@/app/(dashboard)/issues/issue-details-dialog';

export default function IssuesPage() {
  const { toast } = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    loadIssues();
  }, [activeTab]);

  useEffect(() => {
    filterIssues();
  }, [issues, searchQuery]);

  const loadIssues = async () => {
    setIsLoading(true);
    try {
      const data = await authenticatedFetch(`/api/issues?status=${activeTab}`);
      setIssues(data.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load issues',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterIssues = () => {
    if (!searchQuery.trim()) {
      setFilteredIssues(issues);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = issues.filter(issue =>
      issue.issueId.toLowerCase().includes(query) ||
      issue.orderId.toLowerCase().includes(query) ||
      issue.issueDescription.toLowerCase().includes(query)
    );
    setFilteredIssues(filtered);
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'closed' || status === 'resolved') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === 'in_progress') return <Clock className="h-4 w-4 text-blue-600" />;
    return <AlertCircle className="h-4 w-4 text-orange-600" />;
  };

  const getIssueTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      missing_items: 'Missing Items',
      damaged_product: 'Damaged Product',
      wrong_item: 'Wrong Item',
      address_issue: 'Address Issue',
      delivery_delay: 'Delivery Delay',
      customer_unavailable: 'Customer Unavailable',
      payment_issue: 'Payment Issue',
      quality_complaint: 'Quality Complaint',
      return_request: 'Return Request',
      courier_problem: 'Courier Problem',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const openIssueCount = issues.filter(i => ['open', 'in_progress', 'reopened'].includes(i.status)).length;
  const closedIssueCount = issues.filter(i => ['resolved', 'closed'].includes(i.status)).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertCircle className="h-8 w-8" />
            Shipment Issues
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage shipment problems
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Issue
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="open">
            Open ({openIssueCount})
          </TabsTrigger>
          <TabsTrigger value="closed">
            Closed ({closedIssueCount})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({issues.length})
          </TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search by Issue ID, Order ID, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading issues...
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No issues found</p>
                <p className="text-sm">
                  {searchQuery ? 'Try a different search' : 'Create your first issue to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.issueId}
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusIcon(issue.status)}
                          <span className="font-semibold">{issue.issueId}</span>
                          <span className="text-muted-foreground">-</span>
                          <span>{getIssueTypeLabel(issue.issueType)}</span>
                          <Badge variant="outline" className={getPriorityColor(issue.priority)}>
                            {issue.priority.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Order:</span> {issue.orderId}
                          {' • '}
                          <span className="font-medium">Created:</span> {getTimeAgo(issue.createdAt)}
                          {issue.assignedTo && (
                            <>
                              {' • '}
                              <span className="font-medium">Assigned:</span> {issue.assignedTo}
                            </>
                          )}
                        </div>
                        
                        <p className="text-sm line-clamp-2">{issue.issueDescription}</p>
                        
                        {issue.tags && issue.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {issue.tags.map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>

      <CreateIssueDialog
        isOpen={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          loadIssues();
          setShowCreateDialog(false);
        }}
      />

      {selectedIssue && (
        <IssueDetailsDialog
          isOpen={!!selectedIssue}
          onOpenChange={(open) => !open && setSelectedIssue(null)}
          issue={selectedIssue}
          onUpdate={loadIssues}
        />
      )}
    </div>
  );
}
