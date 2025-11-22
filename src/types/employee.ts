// Employee Types

export interface Employee {
  id: string;
  employeeId: string; // Auto-generated unique ID
  
  // Personal Information
  personalInfo: {
    name: string;
    phone: string;
    address?: string;
    photoUrl?: string;
  };
  
  // Employment Details
  employmentDetails: {
    joiningDate: string;
    status: 'active' | 'inactive';
    leavingDate?: string;
  };
  
  // Salary Configuration
  salaryConfig: {
    monthlySalary: number; // e.g., 18000
    dailyWage: number; // Auto-calculated: monthlySalary / 30
    holidaysPerMonth: number; // e.g., 4
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'holiday';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  createdAt: string;
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  amount: number;
  paymentDate: string;
  paymentMode: 'cash' | 'bank-transfer' | 'upi' | 'cheque';
  status: 'paid' | 'pending' | 'cancelled';
  advanceDeducted: number;
  netPaid: number;
  notes?: string;
  createdAt: string;
}

export interface Advance {
  id: string;
  employeeId: string;
  amount: number;
  dateGiven: string;
  reason: string;
  repaymentStatus: 'pending' | 'partial' | 'completed';
  amountRepaid: number;
  amountRemaining: number;
  deductionPerMonth: number;
  notes?: string;
  createdAt: string;
}

export interface AttendanceSummary {
  employeeId: string;
  month: number;
  year: number;
  totalPresent: number;
  totalAbsent: number;
  totalHalfDays: number;
  totalLeaves: number;
  totalHolidays: number;
  totalWorkingDays: number;
}
