# Pending Order Action Log Feature

## Overview
This feature allows admins to track and log all actions taken for orders with "pending" status. It provides a comprehensive audit trail of customer interactions and follow-ups.

## Features

### 1. Action Types
The system supports logging various types of actions:
- **Call Placed** - Successfully connected with customer
- **Call Attempted** - Customer didn't answer
- **WhatsApp Sent** - Message sent via WhatsApp
- **Ticket Raised** - Support ticket created
- **Email Sent** - Email communication sent
- **Address Verified** - Shipping address confirmed
- **Payment Verified** - Payment status checked
- **Courier Contacted** - Reached out to courier partner
- **Other** - Any other action type

### 2. Action Details
For each action, you can log:
- **Action Details** (Required) - What exactly was done
- **Customer Response** - What the customer said or did
- **Outcome** (Required) - Result of the action:
  - Resolved
  - Still Pending
  - Escalated
  - No Response
- **Next Action** - What needs to be done next
- **Follow-up Date/Time** - When to follow up
- **Additional Notes** - Any other relevant information

### 3. UI Integration

#### Order Details Dialog
- Action log section appears automatically for pending orders
- Shows all logged actions in reverse chronological order (newest first)
- Each log entry displays:
  - Action type and outcome badges
  - Timestamp and admin who logged it
  - Action details and customer response
  - Next action required (highlighted in yellow)
  - Additional notes

#### Add Action Button
- Visible only for pending orders
- Opens a dialog to log new actions
- Form validation ensures required fields are filled
- Success/error notifications

### 4. Data Storage
Action logs are stored in the order document under:
```
shipmentInfo.actionLog[]
```

Each entry contains:
```typescript
{
  actionId: string,
  timestamp: string (ISO datetime),
  actionBy: string (admin email/uid),
  actionType: enum,
  actionDetails: string,
  customerResponse?: string,
  outcome: enum,
  nextAction?: string,
  nextActionBy?: string (ISO datetime),
  notes?: string
}
```

## Usage

### For Admins

1. **View Action Log**
   - Open any order with "pending" status
   - Scroll to the "Action Log" section
   - View all previous actions taken

2. **Log New Action**
   - Click "Add Action" button
   - Select action type from dropdown
   - Fill in action details (required)
   - Add customer response if applicable
   - Select outcome (required)
   - Optionally add next action and follow-up date
   - Click "Save Action Log"

3. **Track Follow-ups**
   - Next actions are highlighted in yellow
   - Follow-up dates help prioritize pending orders
   - Complete audit trail for accountability

### API Endpoint

**POST** `/api/orders/[orderId]/action-log`

**Authentication:** Admin only

**Request Body:**
```json
{
  "actionType": "call_placed",
  "actionDetails": "Called customer to verify address",
  "customerResponse": "Customer confirmed address is correct",
  "outcome": "resolved",
  "nextAction": "Ship the order",
  "nextActionBy": "2025-11-19T10:00:00.000Z",
  "notes": "Customer was very cooperative"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Action log added successfully",
  "actionLog": { /* full action log entry */ }
}
```

## Benefits

1. **Accountability** - Track who did what and when
2. **Continuity** - Any admin can see the full history
3. **Customer Service** - Better follow-up and resolution
4. **Analytics** - Understand common issues with pending orders
5. **Audit Trail** - Complete record for disputes or reviews

## Future Enhancements

Potential improvements:
- Filter orders by pending actions
- Dashboard for follow-up reminders
- Automated notifications for overdue follow-ups
- Analytics on action types and outcomes
- Export action logs for reporting
