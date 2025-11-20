'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { Issue } from '@/types/issue';
import { AddUpdateDialog } from '@/app/(dashboard)/issues/add-update-dialog';
import { CloseIssueDialog } from '@/app/(dashboard)/issues/close-issue-dialog';

interface IssueDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  issue: Issue;
  onUpdate: () => void;
}

export function IssueDetailsDialog({ isOpen, onOpenChange, issue, onUpdate }: IssueDetailsDialogProps) {
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [showCloseIssue, setShowCloseIssue] = useState(false);

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    return colors[priority as keyof typeof colors];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-orange-100 text-orange-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      reopened: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors];
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

  const isIssueOpen = issue.status === 'open' || issue.status === 'in_progress' || issue.status === 'reopened';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Issue {issue.issueId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getStatusColor(issue.status)}>
              {issue.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge className={getPriorityColor(issue.priority)}>
              {issue.priority.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Order: <span className="font-medium">{issue.orderId}</span>
            </span>
          </div>

          {/* Issue Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Type</div>
                <div>{getIssueTypeLabel(issue.issueType)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Reason</div>
                <div>{issue.issueReason}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Description</div>
                <div>{issue.issueDescription}</div>
              </div>
              {issue.assignedTo && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Assigned To</div>
                  <div>{issue.assignedTo}</div>
                </div>
              )}
              {issue.tags && issue.tags.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Tags</div>
                  <div className="flex gap-1 flex-wrap">
                    {issue.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Created:</span> {new Date(issue.createdAt).toLocaleString()} by {issue.createdBy}
              </div>
              <div className="text-sm">
                <span className="font-medium">Last Updated:</span> {new Date(issue.updatedAt).toLocaleString()} by {issue.updatedBy}
              </div>
              {issue.closedAt && (
                <div className="text-sm">
                  <span className="font-medium">Closed:</span> {new Date(issue.closedAt).toLocaleString()} by {issue.closedBy}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Updates */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Updates ({issue.updates?.length || 0})</CardTitle>
              {isIssueOpen && (
                <Button size="sm" onClick={() => setShowAddUpdate(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Update
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {issue.updates && issue.updates.length > 0 ? (
                <div className="space-y-4">
                  {issue.updates
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((update) => (
                      <div key={update.updateId} className="border-l-2 border-muted pl-4 space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {new Date(update.timestamp).toLocaleString()} • {update.updatedBy}
                        </div>
                        <div>
                          <div className="text-sm font-medium">Action Taken:</div>
                          <div className="text-sm">{update.actionTaken}</div>
                        </div>
                        {update.customerResponse && (
                          <div>
                            <div className="text-sm font-medium">Customer Response:</div>
                            <div className="text-sm">{update.customerResponse}</div>
                          </div>
                        )}
                        {update.statusChange && (
                          <Badge variant="outline" className="text-xs">
                            Status changed to: {update.statusChange.replace('_', ' ')}
                          </Badge>
                        )}
                        {update.notes && (
                          <div>
                            <div className="text-sm font-medium">Notes:</div>
                            <div className="text-sm text-muted-foreground italic">{update.notes}</div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No updates yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolution */}
          {issue.resolution && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Resolution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>{issue.resolution}</div>
                {issue.resolutionNotes && (
                  <div className="text-sm text-muted-foreground italic">{issue.resolutionNotes}</div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {isIssueOpen && (
            <div className="flex gap-2">
              <Button onClick={() => setShowCloseIssue(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Close Issue
              </Button>
            </div>
          )}
        </div>

        {/* Dialogs */}
        <AddUpdateDialog
          isOpen={showAddUpdate}
          onOpenChange={setShowAddUpdate}
          issueId={issue.issueId}
          onSuccess={() => {
            onUpdate();
            setShowAddUpdate(false);
          }}
        />

        <CloseIssueDialog
          isOpen={showCloseIssue}
          onOpenChange={setShowCloseIssue}
          issueId={issue.issueId}
          onSuccess={() => {
            onUpdate();
            setShowCloseIssue(false);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
