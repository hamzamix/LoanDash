export interface Payment {
  id: string;
  amount: number;
  date: string; // ISO string
  method?: string; // Payment method (cash, bank transfer, etc.)
  isPartial?: boolean; // Whether this is a partial payment
  notes?: string; // Optional notes for the payment
}

export enum DebtType {
  Friend = 'Friend/Family Credit',
  Loan = 'Bank Loan'
}

export enum RecurrenceType {
  None = 'none',
  Weekly = 'weekly',
  BiWeekly = 'bi-weekly',
  Monthly = 'monthly',
  Quarterly = 'quarterly'
}

export interface RecurrenceSettings {
  type: RecurrenceType;
  endDate?: string; // Optional end date for recurrence
  maxOccurrences?: number; // Optional max number of occurrences
}

export interface Debt {
  id: string;
  type: DebtType;
  name: string;
  totalAmount: number;
  startDate: string; // ISO string
  dueDate: string; // ISO string
  payments: Payment[];
  description?: string;
  interestRate?: number; // Optional for loans
  isRecurring?: boolean; // Optional for recurring debts
  recurrenceSettings?: RecurrenceSettings; // Enhanced recurring settings
  status: 'active' | 'completed' | 'defaulted';
  currency?: string; // Currency code (USD, EUR, etc.)
  reminderEnabled?: boolean; // Whether reminders are enabled
  reminderDays?: number; // Days before due date to remind
}

export interface Loan {
    id: string;
    name: string; // Who you loaned to
    totalAmount: number;
    startDate: string; // ISO string
    dueDate: string; // ISO string
    repayments: Payment[];
    description?: string;
    status: 'active' | 'completed' | 'defaulted';
    currency?: string; // Currency code
    reminderEnabled?: boolean; // Whether reminders are enabled
    reminderDays?: number; // Days before due date to remind
}

export interface AmortizationEntry {
  paymentNumber: number;
  paymentDate: string;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  remainingBalance: number;
}

export interface NotificationSettings {
  enabled: boolean;
  defaultReminderDays: number;
  emailNotifications?: boolean;
  browserNotifications?: boolean;
}