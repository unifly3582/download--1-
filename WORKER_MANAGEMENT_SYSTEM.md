# Worker Management System - Complete Guide

## 🎯 Overview
A simplified, practical system for managing daily wage workers with automatic wage calculation, advance tracking, and salary payments.

## ✨ Key Features

### 1. **Simple Worker Entry**
- Name, phone, photo
- Joining date
- Monthly salary (e.g., ₹18,000)
- Holidays per month (e.g., 4 days)
- Auto-calculated daily wage (Monthly ÷ 30)

### 2. **Worker Dashboard** (`/workers`)
Shows 10 workers with real-time data:
- **Present Today** status
- **Days Worked** this month
- **Wage Earned** till today
- **Advances Taken** (pending)
- **Net Payable** (wage - advances)

### 3. **Daily Attendance** (`/attendance`)
- Mark attendance for all workers at once
- Select any date
- Status: Present, Absent, Half Day, Leave, Holiday
- Check-in/out times
- Real-time statistics

### 4. **Advance Management**
- Give advances anytime
- Track pending advances
- Auto-deduct from salary
- View advance history

### 5. **Salary Payment**
- Auto-calculate based on days worked
- Deduct pending advances
- Record payment mode (Cash/UPI/Bank)
- Generate payment history

### 6. **Make Inactive**
- Mark worker as inactive when they leave
- Records leaving date
- Removes from active lists
- Preserves all history

## 📊 How It Works

### Wage Calculation Formula
```
Daily Wage = Monthly Salary ÷ 30
Days Worked = Present Days - (Half Days × 0.5)
Wage Earned = Days Worked × Daily Wage
Net Payable = Wage Earned - Pending Advances
```

### Example
```
Worker: Rajesh Kumar
Monthly Salary: ₹18,000
Daily Wage: ₹600 (18000 ÷ 30)
Holidays Allowed: 4 days/month

This Month:
- Present: 22 days
- Half Day: 2 days
- Absent: 4 days
- Total Days Worked: 22 - (2 × 0.5) = 21 days
- Wage Earned: 21 × 600 = ₹12,600
- Advances Taken: ₹2,000
- Net Payable: 12,600 - 2,000 = ₹10,600
```

## 🚀 Quick Start Guide

### Step 1: Add a Worker
1. Go to `/workers`
2. Click "Add Worker"
3. Fill in:
   - Name: "Rajesh Kumar"
   - Phone: "9876543210"
   - Upload photo (optional)
   - Joining Date: Select date
   - Monthly Salary: "18000"
   - Holidays Per Month: "4"
4. Click "Add Worker"

### Step 2: Mark Daily Attendance
1. Go to `/attendance`
2. Verify today's date
3. For each worker, click status:
   - **Present** → Set check-in/out times
   - **Absent** → Just click
   - **Half Day** → Set check-in/out times
   - **Leave** → Just click
4. Click "Save Attendance"

### Step 3: Give Advance (When Needed)
1. Go to worker details
2. Click "Give Advance"
3. Enter:
   - Amount: "2000"
   - Date: Select date
   - Reason: "Medical emergency"
4. Click "Give Advance"

### Step 4: Pay Salary (End of Month)
1. Go to worker details
2. Click "Pay Salary"
3. Select month and year
4. Review calculation:
   - Days worked
   - Wage earned
   - Advances deducted
   - Net payable
5. Select payment mode
6. Click "Pay ₹X,XXX"

### Step 5: Make Inactive (When Worker Leaves)
1. Go to worker details
2. Click "Mark Inactive"
3. Confirm
4. Worker removed from active lists

## 📱 Pages Overview

### `/workers` - Worker Dashboard
**Purpose**: Main overview of all workers

**Shows**:
- Total active workers
- Present today count
- Total wages this month
- Total advances
- List of 10 workers with:
  - Photo and name
  - Present today badge
  - Monthly salary
  - Days worked
  - Wage earned
  - Advances
  - Net payable

**Actions**:
- Add Worker
- Mark Attendance
- Click worker to view details

### `/workers/new` - Add Worker
**Purpose**: Add new worker

**Fields**:
- Worker photo (optional)
- Full name *
- Phone number *
- Address (optional)
- Joining date *
- Monthly salary *
- Holidays per month

**Shows**:
- Auto-calculated daily wage
- Summary of configuration

### `/workers/[id]` - Worker Details
**Purpose**: View complete worker information

**Shows**:
- Profile card with photo
- Status (Active/Inactive)
- Contact info
- Salary configuration
- 4 stat cards:
  - Days Worked
  - Wage Earned
  - Advances
  - Net Payable

**Tabs**:
1. **Attendance**: Monthly attendance records
2. **Advances**: Advance history
3. **Salary**: Payment history

**Actions**:
- Mark Inactive
- Give Advance
- Pay Salary
- Mark Attendance

### `/workers/[id]/advance` - Give Advance
**Purpose**: Record advance payment

**Fields**:
- Amount *
- Date given *
- Reason *
- Notes (optional)

**Note**: Advance will be deducted from next salary

### `/workers/[id]/pay-salary` - Pay Salary
**Purpose**: Record salary payment

**Shows**:
- Month/Year selector
- Auto-calculated:
  - Days worked
  - Wage earned
  - Advances to deduct
  - Net payable amount

**Fields**:
- Payment date *
- Payment mode * (Cash/UPI/Bank)
- Notes (optional)

**Action**: Marks all advances as completed

### `/attendance` - Daily Attendance
**Purpose**: Mark attendance for all workers

**Features**:
- Date selector
- Real-time stats
- Search workers
- Mark All Present button
- Color-coded cards
- Batch save

## 💡 Best Practices

### Daily Routine
```
Morning:
1. Open /attendance
2. Mark all present workers
3. Mark absent/leave for others
4. Save attendance

End of Day:
- Review attendance if needed
- Update any corrections
```

### Monthly Routine
```
End of Month:
1. Review each worker's attendance
2. Calculate pending advances
3. Pay salaries one by one
4. Record payment mode
5. Verify all payments
```

### Advance Management
```
When Worker Requests Advance:
1. Go to worker details
2. Click "Give Advance"
3. Enter amount and reason
4. Record immediately
5. Will auto-deduct from salary
```

## 📈 Reports & Insights

### Worker Dashboard Shows:
- **Active Workers**: Total count
- **Present Today**: Attendance status
- **Wages This Month**: Total payable
- **Total Advances**: Outstanding amount

### Individual Worker Shows:
- **Days Worked**: Attendance count
- **Wage Earned**: Calculated amount
- **Advances**: Pending deductions
- **Net Payable**: Final amount

## 🎨 Visual Indicators

### Status Colors
- 🟢 **Green**: Present, Active
- 🔴 **Red**: Absent, Inactive
- 🟡 **Yellow**: Half Day
- 🔵 **Blue**: Leave
- 🟣 **Purple**: Holiday
- 🟠 **Orange**: Advances (warning)

### Badges
- **Present Today**: Green badge on worker card
- **Active/Inactive**: Status badge on profile
- **Attendance Status**: Color-coded badges

## 🔒 Data Structure

### Worker Record
```javascript
{
  id: "auto-generated",
  employeeId: "EMP123456",
  personalInfo: {
    name: "Rajesh Kumar",
    phone: "9876543210",
    address: "Optional address",
    photoUrl: "photo-url"
  },
  employmentDetails: {
    joiningDate: "2024-01-15",
    status: "active",
    leavingDate: null
  },
  salaryConfig: {
    monthlySalary: 18000,
    dailyWage: 600,
    holidaysPerMonth: 4
  }
}
```

### Attendance Record
```javascript
{
  id: "auto-generated",
  employeeId: "worker-id",
  date: "2024-11-21",
  status: "present",
  checkInTime: "09:00",
  checkOutTime: "18:00"
}
```

### Advance Record
```javascript
{
  id: "auto-generated",
  employeeId: "worker-id",
  amount: 2000,
  dateGiven: "2024-11-15",
  reason: "Medical emergency",
  repaymentStatus: "pending",
  amountRemaining: 2000
}
```

### Salary Payment Record
```javascript
{
  id: "auto-generated",
  employeeId: "worker-id",
  month: 11,
  year: 2024,
  amount: 12600,
  advanceDeducted: 2000,
  netPaid: 10600,
  paymentDate: "2024-11-30",
  paymentMode: "cash",
  status: "paid"
}
```

## 🎯 Use Cases

### Scenario 1: New Worker Joins
```
1. Add worker with ₹18,000 monthly salary
2. System calculates ₹600 daily wage
3. Start marking attendance from joining date
4. Pay pro-rated salary at month end
```

### Scenario 2: Worker Takes Advance
```
1. Worker requests ₹2,000 advance
2. Record advance with reason
3. Continue marking attendance
4. At salary time, ₹2,000 auto-deducted
5. Worker receives net amount
```

### Scenario 3: Worker Leaves
```
1. Calculate final settlement
2. Pay pending salary
3. Mark worker as inactive
4. All history preserved
5. Worker removed from active lists
```

### Scenario 4: Half Day Work
```
1. Mark attendance as "Half Day"
2. Set check-in/out times
3. System counts as 0.5 days
4. Wage calculated accordingly
```

## 📊 Sample Monthly Report

```
Worker: Rajesh Kumar
Month: November 2024

Attendance:
- Present: 22 days
- Half Day: 2 days
- Absent: 4 days
- Leave: 2 days
- Total Days Worked: 21 days

Salary Calculation:
- Daily Wage: ₹600
- Days Worked: 21
- Wage Earned: ₹12,600

Deductions:
- Advance (15 Nov): ₹2,000

Net Payment:
- Amount Payable: ₹10,600
- Payment Mode: Cash
- Payment Date: 30 Nov 2024
- Status: Paid ✓
```

## 🚨 Important Notes

1. **Daily Wage**: Always calculated as Monthly Salary ÷ 30
2. **Half Days**: Count as 0.5 days in wage calculation
3. **Advances**: Auto-deducted from next salary payment
4. **Holidays**: Allowed per month (e.g., 4 days)
5. **Inactive Workers**: Preserved in database, hidden from active lists
6. **Attendance**: Can be marked/edited for any past date
7. **Salary**: Can be paid multiple times if needed

## 🎉 Benefits

✅ **Simple**: Easy to understand and use
✅ **Fast**: Mark attendance for all workers in minutes
✅ **Accurate**: Auto-calculated wages, no manual errors
✅ **Transparent**: Workers can see their earnings anytime
✅ **Flexible**: Handle advances, half days, leaves easily
✅ **Complete**: Full history of attendance, advances, payments
✅ **Mobile-Friendly**: Works on phones and tablets

## 📞 Support

For any issues or questions:
1. Check this guide first
2. Review the attendance system guide
3. Check worker details for calculations
4. Verify attendance records
5. Review advance history

---

**System Ready!** Start by adding your first worker at `/workers/new` 🚀
