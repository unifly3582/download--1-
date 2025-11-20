# Shipment Issue Tracking System - Design

## Overview
A comprehensive issue tracking system for managing shipment problems with proper lifecycle management.

## Problem Statement
Current action log is too simple. We need to track:
- **Why** the issue occurred (reason)
- **What** we did about it (actions)
- **Customer's** response
- **When** it was created, updated, closed
- **Status** - Open or Closed
- **Complete history** of all updates

## Use Cases

### Example 1: Missing Items
```
Issue: Customer received parcel with missing items
Reason: Packing error - 2 items not included
Actions Taken:
  - Called customer to verify
  - Checked warehouse inventory
  - Arranged replacement shipment
Customer Response: "Confirmed 2 items missing, needs urgently"
Status: Closed
Created: 2025-11-20 10:00 AM
Updated: 2025-11-20 2:30 PM
Closed: 2025-11-20 5:00 PM
Resolution: Replacement shipped, customer satisfied
```

### Example 2: Address Issue
```
Issue: Courier unable to deliver - wrong address
Reason: Customer provided incomplete address
Actions Taken:
  - Called customer for correct address
  - Updated address in system
  - Contacted courier to reattempt delivery
Customer Response: "Sorry, forgot to add landmark"
Status: Closed
Created: 2025-11-19 9:00 AM
Updated: 2025-11-19 11:00 AM
Closed: 2025-11-19 3:00 PM
Resolution: Delivered successfully
```

## Data Structure

### Issue Schema
```typescript
{
  issueId: string,              // Unique ID
  orderId: string,              // Order reference
  
  // Issue Details
  issueType: enum,              // Type of problem
  issueReason: string,          // Why it happened
  issueDescription: string,     // Detailed description
  priority: enum,               // Low/Medium/High/Critical
  
  // Status & Lifecycle
  status: enum,                 // Open/In Progress/Resolved/Closed
  createdAt: datetime,          // When issue was created
  createdBy: string,            // Who created it
  updatedAt: datetime,          // Last update time
  updatedBy: string,            // Who last updated
  closedAt: datetime,           // When closed (if closed)
  closedBy: string,             // Who closed it
  
  // Actions & Updates
  updates: [
    {
      updateId: string,
      timestamp: datetime,
      updatedBy: string,
      actionTaken: string,      // What was done
      customerResponse: string, // Customer's response
      statusChange: string,     // Status change if any
      notes: string            // Additional notes
    }
  ],
  
  // Resolution
  resolution: string,           // How it was resolved
  resolutionNotes: string,     // Additional resolution details
  
  // Metadata
  assignedTo: string,          // Who is handling it
  tags: string[],              // For categorization
  attachments: string[]        // File URLs if any
}
```

## Issue Types
- Missing Items
- Damaged Product
- Wrong Item Sent
- Address Issue
- Delivery Delay
- Customer Unavailable
- Payment Issue
- Quality Complaint
- Return Request
- Courier Problem
- Other

## Priority Levels
- **Critical** - Urgent, needs immediate attention
- **High** - Important, resolve within 24 hours
- **Medium** - Normal priority
- **Low** - Can wait

## Status Flow
```
Open → In Progress → Resolved → Closed
  ↓         ↓           ↓
  └─────────┴───────────┴──→ Reopened (if needed)
```

## UI Design

### Issue List Page
```
┌─────────────────────────────────────────────────────┐
│ 📋 Shipment Issues                                  │
├─────────────────────────────────────────────────────┤
│ [Open Issues] [Closed Issues] [All Issues]         │
│                                                     │
│ Search: [Order ID or Issue ID]  [+ New Issue]      │
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ 🔴 #ISS-001 - Missing Items                    ││
│ │ Order: 5085 | Priority: High | Created: 2h ago ││
│ │ Status: Open | Assigned: Admin A               ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ 🟡 #ISS-002 - Address Issue                    ││
│ │ Order: 5086 | Priority: Medium | Created: 5h   ││
│ │ Status: In Progress | Assigned: Admin B        ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ 🟢 #ISS-003 - Delivery Delay                   ││
│ │ Order: 5087 | Priority: Low | Created: 1d ago  ││
│ │ Status: Resolved | Closed: 2h ago              ││
│ └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Issue Details
```
┌─────────────────────────────────────────────────────┐
│ Issue #ISS-001 - Missing Items          [Edit] [Close]│
├─────────────────────────────────────────────────────┤
│ Order: 5085 | Customer: Mainak das                 │
│ Status: 🔴 Open | Priority: High                    │
│                                                     │
│ Issue Details                                       │
│ ├─ Type: Missing Items                             │
│ ├─ Reason: Packing error at warehouse              │
│ ├─ Description: Customer received only 3 of 5 items│
│ └─ Priority: High                                   │
│                                                     │
│ Timeline                                            │
│ ├─ Created: 2025-11-20 10:00 AM by Admin A        │
│ ├─ Updated: 2025-11-20 2:30 PM by Admin A         │
│ └─ Status: Open                                     │
│                                                     │
│ Updates & Actions (3)                               │
│ ┌─────────────────────────────────────────────────┐│
│ │ 2:30 PM - Admin A                               ││
│ │ Action: Arranged replacement shipment           ││
│ │ Customer: "Please send urgently, need for event"││
│ │ Status: Open → In Progress                      ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ 11:00 AM - Admin A                              ││
│ │ Action: Verified with warehouse, items available││
│ │ Customer: "Confirmed 2 items missing"           ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ 10:00 AM - Admin A                              ││
│ │ Action: Called customer to verify complaint     ││
│ │ Customer: "Yes, only received 3 items"          ││
│ │ Issue Created                                   ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ [+ Add Update]  [Mark as Resolved]  [Close Issue]  │
└─────────────────────────────────────────────────────┘
```

## Features

### 1. Create Issue
- Select issue type
- Enter reason
- Add description
- Set priority
- Assign to team member

### 2. Add Updates
- Record actions taken
- Log customer responses
- Change status
- Add notes

### 3. Track Timeline
- See all updates chronologically
- Know who did what when
- Track status changes

### 4. Close Issue
- Mark as resolved
- Add resolution notes
- Record closure time

### 5. Reopen if Needed
- Can reopen closed issues
- Maintains full history

### 6. Filter & Search
- View open issues
- View closed issues
- Search by order ID
- Filter by priority
- Filter by type

## Benefits

### For Team
- Clear ownership (assigned to)
- Priority-based work
- Complete history
- Better handoffs

### For Management
- Track resolution times
- Identify common issues
- Monitor team performance
- Generate reports

### For Customers
- Faster resolution
- Better communication
- Professional handling

## Implementation Plan

### Phase 1: Core System
1. Update data schema
2. Create issue management API
3. Build issue list page
4. Build issue details page
5. Add create/update forms

### Phase 2: Enhanced Features
1. Add priority management
2. Add assignment system
3. Add status workflow
4. Add timeline view
5. Add filters

### Phase 3: Advanced Features
1. Add notifications
2. Add SLA tracking
3. Add analytics
4. Add reports
5. Add attachments

## Migration from Current System

Current action logs can be:
- Kept as-is for historical data
- Or migrated to new issue system
- Or run both systems in parallel

## Next Steps

1. Review and approve design
2. Update type definitions
3. Create API endpoints
4. Build UI components
5. Test with real scenarios

---

This is a much more robust system than simple action logs!
