# Employee Management System - Complete Guide

## Overview
A comprehensive employee management system with attendance tracking, salary management, advance payments, and leave management.

## Features Implemented

### 1. Employee Management
- **List View** (`/employees`)
  - Search by name, ID, department, or designation
  - View employee cards with key information
  - Quick stats: Total, Active, Inactive employees
  - Click to view details

- **Add Employee** (`/employees/new`)
  - Personal information with photo upload
  - Aadhar card images (front & back)
  - Employment details (joining date, department, designation)
  - Salary structure with auto-calculation
  - Leave configuration
  - Tab-based form for better UX

- **Employee Details** (`/employees/[id]`)
  - Profile overview with photo
  - Quick stats: Monthly attendance, salary, advances
  - Tabbed interface:
    - Overview: Personal info, salary breakdown, leave balance
    - Attendance: Recent attendance records
    - Salary: Payment history
    - Advances: Advance payment records
    - Documents: View uploaded images

- **Edit Employee** (`/employees/[id]/edit`)
  - Update all employee information
  - Modify salary structure
  - Adjust leave allocation
  - Change employment status

### 2. Attendance Management

#### Bulk Attendance (`/attendance`) - NEW!
- **Daily Attendance Marking**
  - Mark attendance for all employees at once
  - Select any date to mark attendance
  - Real-time statistics (Total, Present, Absent, Half Day, Leave, Unmarked)
  - Search and filter employees
  - "Mark All Present" quick action
  - Color-coded employee cards based on status
  - Set check-in/check-out times for present/half-day employees
  - Save all attendance records with one click

- **Features**
  - View and edit existing attendance for any date
  - Only shows active employees
  - Visual feedback with color-coded cards
  - Bulk operations support
  - Search by name, ID, or department

#### Individual Attendance (`/employees/[id]/attendance`)
- **Calendar View**
  - Visual calendar with color-coded attendance
  - Green: Present
  - Red: Absent
  - Yellow: Half Day
  - Blue: Leave
  - Purple: Holiday

- **Mark Attendance**
  - Select date from calendar
  - Choose status (Present/Absent/Half-Day/Leave/Holiday)
  - Record check-in and check-out times
  - Add notes if needed

- **Monthly Summary**
  - Total present, absent, half-days, leaves, holidays
  - Recent attendance records
  - Legend for status colors

### 3. Salary Management (`/employees/[id]/salary/new`)
- **Record Salary Payment**
  - Select month and year
  - Choose payment mode (Cash/Bank Transfer/UPI/Cheque)
  - Automatic net salary calculation
  - Deduct advances from salary
  - Add payment notes
  - View final amount to pay

- **Salary Structure**
  - Base Salary
  - Allowances: HRA, DA, Transport, Other
  - Deductions: PF, ESI, Tax, Other
  - Auto-calculated Net Salary

### 4. Advance Management (`/employees/[id]/advances/new`)
- **Give Advance**
  - Record advance amount
  - Date given
  - Reason for advance
  - Monthly deduction amount
  - Repayment tracking
  - Notes

- **Advance Tracking**
  - View all advances
  - Outstanding balance
  - Repayment status (Pending/Partial/Completed)
  - Auto-deduction from salary

### 5. Leave Management
- **Leave Configuration**
  - Total leaves per year
  - Casual leaves
  - Sick leaves
  - Earned leaves
  - Automatic balance calculation

## Database Structure

### Collections

#### `employees`
```javascript
{
  id: "auto-generated",
  employeeId: "EMP123456", // Auto-generated
  personalInfo: {
    name: string,
    email: string,
    phone: string,
    address: string,
    dateOfBirth: string,
    photoUrl: string,
    aadharFrontUrl: string,
    aadharBackUrl: string,
    aadharNumber: string
  },
  employmentDetails: {
    joiningDate: string,
    department: string,
    designation: string,
    employmentType: "full-time" | "part-time" | "contract",
    status: "active" | "inactive" | "terminated"
  },
  salaryStructure: {
    baseSalary: number,
    allowances: { hra, da, transport, other },
    deductions: { pf, esi, tax, other },
    netSalary: number
  },
  leaveConfig: {
    totalLeavesPerYear: number,
    casualLeaves: number,
    sickLeaves: number,
    earnedLeaves: number,
    leavesUsed: number,
    leavesRemaining: number
  },
  createdAt: string,
  updatedAt: string
}
```

#### `attendance`
```javascript
{
  id: "auto-generated",
  employeeId: string,
  date: "YYYY-MM-DD",
  status: "present" | "absent" | "half-day" | "leave" | "holiday",
  checkInTime: "HH:MM",
  checkOutTime: "HH:MM",
  notes: string,
  createdAt: string
}
```

#### `salaryPayments`
```javascript
{
  id: "auto-generated",
  employeeId: string,
  month: number,
  year: number,
  amount: number,
  paymentDate: string,
  paymentMode: "cash" | "bank-transfer" | "upi" | "cheque",
  status: "paid" | "pending" | "cancelled",
  advanceDeducted: number,
  netPaid: number,
  notes: string,
  createdAt: string
}
```

#### `advances`
```javascript
{
  id: "auto-generated",
  employeeId: string,
  amount: number,
  dateGiven: string,
  reason: string,
  repaymentStatus: "pending" | "partial" | "completed",
  amountRepaid: number,
  amountRemaining: number,
  deductionPerMonth: number,
  notes: string,
  createdAt: string
}
```

## API Routes

### Employee Routes
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/[id]` - Get employee details
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Attendance Routes
- `GET /api/employees/[id]/attendance` - Get attendance records
- `POST /api/employees/[id]/attendance` - Mark attendance

### Salary Routes
- `GET /api/employees/[id]/salary` - Get salary payment history
- `POST /api/employees/[id]/salary` - Record salary payment

### Advance Routes
- `GET /api/employees/[id]/advances` - Get advance history
- `POST /api/employees/[id]/advances` - Record new advance

## Usage Guide

### Marking Daily Attendance (Bulk - Recommended)
1. Navigate to `/attendance` from the sidebar
2. Select the date (defaults to today)
3. Search for specific employees if needed
4. Click status buttons for each employee:
   - Present (with check-in/out times)
   - Absent
   - Half Day (with check-in/out times)
   - Leave
   - Holiday
5. Use "Mark All Present" for quick marking
6. Click "Save Attendance" to save all records
7. View real-time statistics at the top

### Adding a New Employee
1. Navigate to `/employees`
2. Click "Add Employee"
3. Fill in personal details (Tab 1)
4. Upload photo and Aadhar images
5. Enter employment details
6. Configure salary structure (Tab 2)
7. Set leave allocation (Tab 3)
8. Click "Add Employee"

### Marking Individual Attendance
1. Go to employee details
2. Click "Mark Attendance" or navigate to attendance page
3. Select date from calendar
4. Choose status
5. Enter check-in/out times if present
6. Click "Mark Attendance"

Note: For marking attendance for multiple employees, use the bulk attendance page (`/attendance`) instead.

### Recording Salary Payment
1. Go to employee details
2. Navigate to Salary tab
3. Click "Record Payment"
4. Select month, year, and payment date
5. Choose payment mode
6. Enter advance deduction if any
7. Review final amount
8. Click "Record Payment"

### Giving Advance
1. Go to employee details
2. Navigate to Advances tab
3. Click "Give Advance"
4. Enter amount and date
5. Provide reason
6. Set monthly deduction amount
7. Click "Record Advance"

## Navigation
- **Employees** menu item (UserCog icon) - Employee management
- **Attendance** menu item (ClipboardCheck icon) - Bulk daily attendance marking

## Future Enhancements (Optional)
- Salary slip PDF generation
- Bulk attendance upload (Excel/CSV)
- Attendance reports export
- Leave application workflow
- Biometric integration
- Email notifications for salary payments
- Performance reviews
- Document expiry alerts (Aadhar, etc.)
- Payroll processing automation
- Tax calculation automation

## Notes
- Employee ID is auto-generated (EMP + timestamp)
- Images are currently stored as base64 (implement Firebase Storage for production)
- All monetary values are in INR (₹)
- Attendance can be updated for past dates
- Net salary is auto-calculated based on allowances and deductions
- Advance deductions are manual (can be automated in future)
