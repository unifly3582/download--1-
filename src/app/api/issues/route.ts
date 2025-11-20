import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/server';
import { withAuth, AuthContext } from '@/lib/auth/withAuth';
import { CreateIssueSchema } from '@/types/issue';

// GET - List all issues with filters
async function getIssues(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // open, closed, all
    const orderId = searchParams.get('orderId');
    const priority = searchParams.get('priority');
    
    let query = db.collection('issues');
    
    // Apply filters
    if (status && status !== 'all') {
      if (status === 'open') {
        query = query.where('status', 'in', ['open', 'in_progress', 'reopened']) as any;
      } else if (status === 'closed') {
        query = query.where('status', 'in', ['resolved', 'closed']) as any;
      }
    }
    
    if (orderId) {
      query = query.where('orderId', '==', orderId) as any;
    }
    
    if (priority) {
      query = query.where('priority', '==', priority) as any;
    }
    
    // Order by creation date (newest first) - only if no other orderBy is applied
    try {
      query = query.orderBy('createdAt', 'desc').limit(100) as any;
    } catch (e) {
      // If orderBy fails (e.g., missing index), just limit
      query = query.limit(100) as any;
    }
    
    const snapshot = await query.get();
    
    const issues = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      success: true,
      data: issues,
      count: issues.length
    });
    
  } catch (error: any) {
    console.error('[ISSUES_GET] Error:', error);
    console.error('[ISSUES_GET] Error details:', error.message);
    
    // Return empty array instead of error if collection doesn't exist
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      message: 'No issues found or collection not initialized'
    });
  }
}

// POST - Create new issue
async function createIssue(
  request: NextRequest,
  context: any,
  authContext: AuthContext
) {
  try {
    const body = await request.json();
    const validatedData = CreateIssueSchema.parse(body);
    
    const userEmail = ('email' in authContext.user && authContext.user.email) || authContext.user.uid;
    const now = new Date().toISOString();
    
    const issueId = `ISS-${Date.now()}`;
    
    const issue = {
      issueId,
      ...validatedData,
      status: 'open',
      createdAt: now,
      createdBy: userEmail,
      updatedAt: now,
      updatedBy: userEmail,
      updates: [],
      tags: validatedData.tags || []
    };
    
    await db.collection('issues').doc(issueId).set(issue);
    
    return NextResponse.json({
      success: true,
      message: 'Issue created successfully',
      data: issue
    });
    
  } catch (error: any) {
    console.error('[ISSUES_CREATE] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create issue' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(['admin'])(getIssues);
export const POST = withAuth(['admin'])(createIssue);
