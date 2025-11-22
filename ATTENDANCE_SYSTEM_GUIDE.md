# Attendance System - Quick Guide

## 🎯 Bulk Attendance Page (`/attendance`)

### Overview
A dedicated page for marking daily attendance for all employees at once. This is the **recommended way** to mark attendance.

### Key Features

#### 1. Date Selection
- Select any date to mark or edit attendance
- Defaults to today's date
- Can view/edit historical attendance

#### 2. Real-Time Statistics
Six stat cards showing:
- **Total**: Number of active employees
- **Present**: Employees marked present (green)
- **Absent**: Employees marked absent (red)
- **Half Day**: Employees on half day (yellow)
- **Leave**: Employees on leave (blue)
- **Unmarked**: Employees not yet marked (gray)

#### 3. Quick Actions
- **Mark All Present**: One-click to mark all filtered employees as present
- **Search**: Filter employees by name, ID, or department
- **Save Attendance**: Save all marked attendance records

#### 4. Employee Cards
Each employee card shows:
- Profile photo and name
- Employee ID badge
- Designation and department
- Status buttons (Present, Absent, Half Day, Leave, Holiday)
- Check-in/out time inputs (for Present/Half Day)

#### 5. Visual Feedback
- Cards change color based on selected status
- Green background: Present
- Red background: Absent
- Yellow background: Half Day
- Blue background: Leave
- Purple background: Holiday
- White background: Unmarked

### How to Use

#### Daily Attendance Workflow
```
1. Open /attendance page
2. Verify date is correct (or select different date)
3. For each employee, click their status:
   - Present → Set check-in/out times
   - Absent → Just click
   - Half Day → Set check-in/out times
   - Leave → Just click
   - Holiday → Just click (for company holidays)
4. Click "Save Attendance" button
5. Done! ✅
```

#### Quick Marking (All Present)
```
1. Open /attendance page
2. Click "Mark All Present" button
3. Adjust any exceptions (absent, leave, etc.)
4. Click "Save Attendance"
```

#### Edit Past Attendance
```
1. Open /attendance page
2. Select the date you want to edit
3. Existing attendance will load automatically
4. Make changes
5. Click "Save Attendance"
```

### Tips & Best Practices

✅ **Do's**
- Mark attendance daily for accurate records
- Use "Mark All Present" for quick marking
- Set accurate check-in/out times
- Use search when you have many employees
- Review statistics before saving

❌ **Don'ts**
- Don't forget to click "Save Attendance"
- Don't mark attendance without verifying the date
- Don't use "Holiday" for individual employee leaves (use "Leave" instead)

### Status Definitions

| Status | When to Use | Time Required |
|--------|-------------|---------------|
| **Present** | Employee worked full day | Yes (check-in/out) |
| **Absent** | Employee didn't come | No |
| **Half Day** | Employee worked partial day | Yes (check-in/out) |
| **Leave** | Employee on approved leave | No |
| **Holiday** | Company holiday (all employees) | No |

### Navigation
- **Sidebar**: Click "Attendance" menu item (ClipboardCheck icon)
- **Direct URL**: `/attendance`

## 📊 Individual Attendance Page

For viewing individual employee attendance history:
1. Go to `/employees`
2. Click on an employee
3. Navigate to "Attendance" tab
4. Or click "Mark Attendance" button

This shows:
- Calendar view with color-coded dates
- Monthly summary
- Individual attendance marking
- Attendance history

## 🔄 Attendance Flow

```
Daily Attendance
    ↓
/attendance page
    ↓
Select Date
    ↓
Mark Status for Each Employee
    ↓
Set Times (if Present/Half Day)
    ↓
Save Attendance
    ↓
Records Saved to Database
    ↓
Visible in:
  - Employee Details
  - Monthly Reports
  - Salary Calculations
```

## 📱 Mobile Friendly
The attendance page is responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🎨 Color Coding

| Color | Status | Hex |
|-------|--------|-----|
| 🟢 Green | Present | #22c55e |
| 🔴 Red | Absent | #ef4444 |
| 🟡 Yellow | Half Day | #eab308 |
| 🔵 Blue | Leave | #3b82f6 |
| 🟣 Purple | Holiday | #a855f7 |
| ⚪ White | Unmarked | #ffffff |

## 🚀 Performance
- Loads all active employees
- Real-time statistics
- Batch save for efficiency
- Search/filter for large teams

## 📝 Notes
- Only active employees are shown
- Attendance can be edited for any past date
- Check-in/out times default to 9:00 AM - 6:00 PM
- All times are in 24-hour format
- Attendance is saved per employee per date
