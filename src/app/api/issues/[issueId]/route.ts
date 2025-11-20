import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { AddIssueUpdateSchema, CloseIssueSchema } from '@/types/issue';
import admin from 'firebase-admin';

// GET - Get single issue
async function getIssue(
  request: NextRequest,
  context: { params: Promise<{ issueId: string }> },
  authContext: AuthContext
) {
  try {
    const { issueId } = await context.params;
    
    const issueDoc = await db.collection('issues').doc(issueId).get();
    
    if (!issueDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Issue not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { id: issueDoc.id, ...issueDoc.data() }
    });
    
  } catch (error: any) {
    console.error('[ISSUE_GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch issue' },
      { status: 500 }
    );
  }
}

// PUT - Add update to issue
async function updateIssue(
  request: NextRequest,
  context: { params: Promise<{ issueId: string }> },
  authContext: AuthContext
) {
  try {
    const { issueId } = await context.params;
    const body = await request.json();
    const validatedData = AddIssueUpdateSchema.parse(body);
    
    const userEmail = ('email' in authContext.user && authContext.user.email) || authContext.user.uid;
    const now = new Date().toISOString();
    
    const update = {
      updateId: `UPD-${Date.now()}`,
      timestamp: now,
      updatedBy: userEmail,
      ...validatedData
    };
    
    const updateData: any = {
      updates: admin.firestore.FieldValue.arrayUnion(update),
      updatedAt: now,
      updatedBy: userEmail
    };
    
    // Update status if provided
    if (validatedData.statusChange) {
      updateData.status = validatedData.statusChange;
    }
    
    await db.collection('issues').doc(issueId).update(updateData);
    
    return NextResponse.json({
      success: true,
      message: 'Issue updated successfully',
      data: update
    });
    
  } catch (error: any) {
    console.error('[ISSUE_UPDATE] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update issue' },
      { status: 500 }
    );
  }
}

// DELETE - Close issue
async function closeIssue(
  request: NextRequest,
  context: { params: Promise<{ issueId: string }> },
  authContext: AuthContext
) {
  try {
    const { issueId } = await context.params;
    const body = await request.json();
    const validatedData = CloseIssueSchema.parse(body);
    
    const userEmail = ('email' in authContext.user && authContext.user.email) || authContext.user.uid;
    const now = new Date().toISOString();
    
    await db.collection('issues').doc(issueId).update({
      status: 'closed',
      resolution: validatedData.resolution,
      resolutionNotes: validatedData.resolutionNotes,
      closedAt: now,
      closedBy: userEmail,
      updatedAt: now,
      updatedBy: userEmail
    });
    
    return NextResponse.json({
      success: true,
      message: 'Issue closed successfully'
    });
    
  } catch (error: any) {
    console.error('[ISSUE_CLOSE] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to close issue' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(['admin'])(getIssue);
export const PUT = withAuth(['admin'])(updateIssue);
export const DELETE = withAuth(['admin'])(closeIssue);
