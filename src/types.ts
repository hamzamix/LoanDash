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
  Daily = 'daily',
  Weekly = 'weekly',
  BiWeekly = 'bi-weekly',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  Yearly = 'yearly'
}

export enum PaymentAutomationType {
  Manual = 'Manual',
  Auto = 'Auto'
}

export interface RecurrenceSettings {
  type: RecurrenceType;
  endDate?: string; // Optional end date for recurrence
  maxOccurrences?: number; // Optional max number of occurrences
  firstPaymentDate?: string; // Optional user-defined first payment date
  paymentAmount?: number; // Optional user-defined payment amount
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
  reminderSettings?: {
    enabled: boolean;
    daysBefore: number;
  };
  paymentAutomation?: PaymentAutomationType; // New field for payment automation
  nextPaymentDate?: string; // ISO string for next scheduled payment
  suggestedPaymentAmount?: number; // Suggested amount for next payment
  lastAutoPaymentDate?: string; // ISO string for last auto-payment date
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
    reminderSettings?: {
      enabled: boolean;
      daysBefore: number;
    };
    isRecurring?: boolean; // Optional for recurring loans
    recurrenceSettings?: RecurrenceSettings; // Enhanced recurring settings
    nextPaymentDate?: string; // ISO string for next scheduled payment
    suggestedPaymentAmount?: number; // Suggested amount for next payment
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

