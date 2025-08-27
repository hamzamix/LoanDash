import React, { useState, useEffect, useMemo } from 'react';
import { Debt, DebtType, Loan, Payment, RecurrenceType, RecurrenceSettings, NotificationSettings, PaymentAutomationType } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DebtsComponent from './components/Debts';
import LoansComponent from './components/Loans';
import ArchiveComponent from './components/Archive';
import Modal from './components/common/Modal';
import UpdateNotification from './components/UpdateNotification';
import { PlusIcon, MagnifyingGlassIcon, ArrowDownTrayIcon } from './components/common/Icons';
import { formatCurrency, SUPPORTED_CURRENCIES } from './utils/currency';
import { calculateNextDueDate, getRecurrenceDescription } from './utils/recurrence';

type ActiveTab = 'dashboard' | 'debts' | 'loans' | 'archive';
type AutoArchiveSetting = 'never' | 'immediately' | '1day' | '7days';

type AppState = {
  'loandash-dark-mode': boolean;
  'loandash-debts': Debt[];
  'loandash-loans': Loan[];
  'loandash-archived-debts': Debt[];
  'loandash-archived-loans': Loan[];
  'loandash-auto-archive': AutoArchiveSetting;
  'loandash-default-currency': string;
  'loandash-notification-settings': NotificationSettings;
};

const defaultState: AppState = {
  'loandash-dark-mode': true,
  'loandash-debts': [],
  'loandash-loans': [],
  'loandash-archived-debts': [],
  'loandash-archived-loans': [],
  'loandash-auto-archive': 'never',
  'loandash-default-currency': 'MAD',
  'loandash-notification-settings': {
    enabled: true,
    defaultReminderDays: 3,
    browserNotifications: true,
    emailNotifications: false
  }
};

const getFutureDateString = (months: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
};

const App: React.FC = () => {
  // --- State Management ---
  const [dataLoaded, setDataLoaded] = useState(false);
  const [appState, setAppState] = useState<AppState>(defaultState);
  const [error, setError] = useState<string | null>(null);

  // UI-only state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Form states
  const [newDebtName, setNewDebtName] = useState('');
  const [newDebtAmount, setNewDebtAmount] = useState('');
  const [newDebtType, setNewDebtType] = useState<DebtType>(DebtType.Friend);
  const [newDebtStartDate, setNewDebtStartDate] = useState('');
  const [newDebtDueDate, setNewDebtDueDate] = useState('');
  const [newDebtDescription, setNewDebtDescription] = useState('');
  const [newDebtInterestRate, setNewDebtInterestRate] = useState('');
  const [newDebtIsRecurring, setNewDebtIsRecurring] = useState(false);
  const [newDebtRecurrenceType, setNewDebtRecurrenceType] = useState<RecurrenceType>(RecurrenceType.Monthly);
  const [newDebtRecurrenceMaxOccurrences, setNewDebtRecurrenceMaxOccurrences] = useState('');
  const [newDebtRecurrenceFirstPaymentDate, setNewDebtRecurrenceFirstPaymentDate] = useState('');
  const [newDebtRecurrencePaymentAmount, setNewDebtRecurrencePaymentAmount] = useState('');
  const [newDebtCurrency, setNewDebtCurrency] = useState('');
  const [newDebtReminderEnabled, setNewDebtReminderEnabled] = useState(true);
  const [newDebtReminderDays, setNewDebtReminderDays] = useState('3');
  const [newDebtPaymentAutomation, setNewDebtPaymentAutomation] = useState<PaymentAutomationType>(PaymentAutomationType.Manual);
  
  const [newLoanName, setNewLoanName] = useState('');
  const [newLoanAmount, setNewLoanAmount] = useState('');
  const [newLoanStartDate, setNewLoanStartDate] = useState('');
  const [newLoanDueDate, setNewLoanDueDate] = useState('');
  const [newLoanDescription, setNewLoanDescription] = useState('');
  const [newLoanCurrency, setNewLoanCurrency] = useState('');
  const [newLoanReminderEnabled, setNewLoanReminderEnabled] = useState(true);
  const [newLoanReminderDays, setNewLoanReminderDays] = useState('3');
  const [newLoanIsRecurring, setNewLoanIsRecurring] = useState(false);
  const [newLoanRecurrenceType, setNewLoanRecurrenceType] = useState<RecurrenceType>(RecurrenceType.Monthly);
  const [newLoanRecurrenceMaxOccurrences, setNewLoanRecurrenceMaxOccurrences] = useState('');
  const [newLoanRecurrenceFirstPaymentDate, setNewLoanRecurrenceFirstPaymentDate] = useState('');
  const [newLoanRecurrencePaymentAmount, setNewLoanRecurrencePaymentAmount] = useState('');

  const {
    'loandash-dark-mode': isDarkMode,
    'loandash-debts': debts,
    'loandash-loans': loans,
    'loandash-archived-debts': archivedDebts,
    'loandash-archived-loans': archivedLoans,
    'loandash-auto-archive': autoArchiveSetting,
    'loandash-default-currency': defaultCurrency,
    'loandash-notification-settings': notificationSettings,
  } = appState;

  // --- Data Saving ---
  const saveAllData = async (dataToSave: AppState) => {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to save data:', error);
      alert('Error: Could not save data. Your changes were not saved. Please check your connection and try again.');
    }
  };
  
  // Function to refresh data from server after processing
  const refreshDataFromServer = async () => {
    try {
      const response = await fetch('/api/data');
      if (response.ok) {
        const data = await response.json();
        setAppState({
          'loandash-dark-mode': data['loandash-dark-mode'] ?? appState['loandash-dark-mode'],
          'loandash-debts': data['loandash-debts'] ?? [],
          'loandash-loans': data['loandash-loans'] ?? [],
          'loandash-archived-debts': data['loandash-archived-debts'] ?? [],
          'loandash-archived-loans': data['loandash-archived-loans'] ?? [],
          'loandash-auto-archive': data['loandash-auto-archive'] ?? appState['loandash-auto-archive'],
          'loandash-default-currency': data['loandash-default-currency'] ?? appState['loandash-default-currency'],
          'loandash-notification-settings': data['loandash-notification-settings'] ?? appState['loandash-notification-settings'],
        });
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
      // Don't show alert for refresh failures, just log them
    }
  };
  
  // --- Data Fetching ---
  useEffect(() => {
    fetch('/api/data')
      .then(res => {
        if (!res.ok) {
            const err = new Error(`Server responded with status: ${res.status}`);
            (err as any).response = res;
            throw err;
        }
        return res.json();
      })
      .then(data => {
        setAppState({
            'loandash-dark-mode': data['loandash-dark-mode'] ?? true,
            'loandash-debts': data['loandash-debts'] ?? [],
            'loandash-loans': data['loandash-loans'] ?? [],
            'loandash-archived-debts': data['loandash-archived-debts'] ?? [],
            'loandash-archived-loans': data['loandash-archived-loans'] ?? [],
            'loandash-auto-archive': data['loandash-auto-archive'] ?? 'never',
            'loandash-default-currency': data['loandash-default-currency'] ?? 'MAD',
            'loandash-notification-settings': data['loandash-notification-settings'] ?? {
              enabled: true,
              defaultReminderDays: 3,
              browserNotifications: true,
              emailNotifications: false
            },
        });
      })
      .catch(async err => {
        let errorMsg = 'An unknown error occurred while loading data.';
        console.error("Error fetching initial data:", err);
        try {
            if ((err as any).response) {
                const response = (err as any).response as Response;
                const body = await response.text();
                errorMsg = `Failed to load data from server. Please check server logs and refresh. (Status: ${response.status}, Body: ${body})`;
            } else {
                errorMsg = `Failed to connect to the server. Is it running? Please refresh. Error: ${err.message}`;
            }
        } catch {}
        setError(errorMsg);
      })
      .finally(() => setDataLoaded(true));
  }, []);

  // --- Computed Values & Memos ---
  const debtsWithInterest = useMemo(() => {
    const now = new Date();
    return debts.map(debt => {
      let accruedInterest = 0;
      if (debt.type === DebtType.Loan && debt.interestRate && debt.interestRate > 0 && debt.status === 'active') {
        const monthlyRate = debt.interestRate / 100 / 12;
        let balance = debt.totalAmount;
        const paymentsByMonth: Record<string, number> = {};
        debt.payments.forEach(p => {
            const monthKey = new Date(p.date).toISOString().slice(0, 7);
            paymentsByMonth[monthKey] = (paymentsByMonth[monthKey] || 0) + p.amount;
        });
        const startDate = new Date(debt.startDate);
        let loopDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        while (loopDate <= now) {
            if (balance <= 0) break;
            const monthKey = loopDate.toISOString().slice(0, 7);
            const paymentThisMonth = new Date(monthKey) >= new Date(startDate.toISOString().slice(0, 7)) ? (paymentsByMonth[monthKey] || 0) : 0;
            balance -= paymentThisMonth;
            if (balance > 0) {
                const interestForMonth = balance * monthlyRate;
                accruedInterest += interestForMonth;
                balance += interestForMonth;
            }
            loopDate.setMonth(loopDate.getMonth() + 1);
        }
      }
      return { ...debt, accruedInterest: Math.max(0, accruedInterest) };
    });
  }, [debts]);
  
  const { overdueCount, hasOverdueDebts, hasOverdueLoans } = useMemo(() => {
    const now = new Date();
    const overdueDebts = debtsWithInterest.filter(d => {
        const remaining = d.totalAmount + d.accruedInterest - d.payments.reduce((sum, p) => sum + p.amount, 0);
        if (remaining <= 0) return false;
        
        // For recurring debts, use nextPaymentDate if available, otherwise use dueDate
        if (d.isRecurring && d.nextPaymentDate) {
            return new Date(d.nextPaymentDate) < now;
        }
        
        // For non-recurring debts, use traditional dueDate logic
        return !d.isRecurring && new Date(d.dueDate) < now;
    });
    const overdueLoans = loans.filter(l => {
        const remaining = l.totalAmount - l.repayments.reduce((sum, p) => sum + p.amount, 0);
        if (remaining <= 0) return false;
        
        // For recurring loans, use nextPaymentDate if available, otherwise use dueDate
        if (l.isRecurring && l.nextPaymentDate) {
            return new Date(l.nextPaymentDate) < now;
        }
        
        // For non-recurring loans, use traditional dueDate logic
        return !l.isRecurring && new Date(l.dueDate) < now;
    });
    return {
        overdueCount: overdueDebts.length + overdueLoans.length,
        hasOverdueDebts: overdueDebts.length > 0,
        hasOverdueLoans: overdueLoans.length > 0,
    };
  }, [debtsWithInterest, loans]);

  // --- Effects ---
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // --- Form Reset and Modal Open/Close ---
  const resetAndCloseForms = () => {
    setIsDebtModalOpen(false);
    setIsLoanModalOpen(false);
    setEditingDebtId(null);
    setEditingLoanId(null);
    setFormErrors([]);
  };
  
  const openDebtModal = (debtToEdit: Debt | null = null) => {
    resetAndCloseForms();
    setFormErrors([]);
    setEditingDebtId(debtToEdit ? debtToEdit.id : null);

    setNewDebtName(debtToEdit ? debtToEdit.name : '');
    setNewDebtAmount(debtToEdit ? String(debtToEdit.totalAmount) : '');
    setNewDebtType(debtToEdit ? debtToEdit.type : DebtType.Friend);
    setNewDebtStartDate(debtToEdit ? new Date(debtToEdit.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setNewDebtDueDate(debtToEdit ? new Date(debtToEdit.dueDate).toISOString().split('T')[0] : getFutureDateString(1));
    setNewDebtDescription(debtToEdit ? debtToEdit.description || '' : '');
    setNewDebtInterestRate(debtToEdit && debtToEdit.interestRate ? String(debtToEdit.interestRate) : '');
    setNewDebtIsRecurring(debtToEdit ? debtToEdit.isRecurring || false : false);
    setNewDebtRecurrenceType(debtToEdit?.recurrenceSettings?.type || RecurrenceType.Monthly);

    setNewDebtRecurrenceFirstPaymentDate(debtToEdit?.recurrenceSettings?.firstPaymentDate ? new Date(debtToEdit.recurrenceSettings.firstPaymentDate).toISOString().split('T')[0] : '');
    setNewDebtRecurrencePaymentAmount(debtToEdit?.recurrenceSettings?.paymentAmount ? String(debtToEdit.recurrenceSettings.paymentAmount) : '');
    setNewDebtCurrency(debtToEdit?.currency || defaultCurrency);
    setNewDebtReminderEnabled(debtToEdit?.reminderSettings?.enabled ?? true);
    setNewDebtReminderDays(debtToEdit?.reminderSettings?.daysBefore ? String(debtToEdit.reminderSettings.daysBefore) : '3');
    setNewDebtPaymentAutomation(debtToEdit?.paymentAutomation || PaymentAutomationType.Manual);
    
    setIsDebtModalOpen(true);
  };
  
  const openLoanModal = (loanToEdit: Loan | null = null) => {
    resetAndCloseForms();
    setFormErrors([]);
    setEditingLoanId(loanToEdit ? loanToEdit.id : null);

    setNewLoanName(loanToEdit ? loanToEdit.name : '');
    setNewLoanAmount(loanToEdit ? String(loanToEdit.totalAmount) : '');
    setNewLoanStartDate(loanToEdit ? new Date(loanToEdit.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setNewLoanDueDate(loanToEdit ? new Date(loanToEdit.dueDate).toISOString().split('T')[0] : getFutureDateString(1));
    setNewLoanDescription(loanToEdit ? loanToEdit.description || '' : '');
    setNewLoanCurrency(loanToEdit?.currency || defaultCurrency);
    setNewLoanReminderEnabled(loanToEdit?.reminderSettings?.enabled ?? true);
    setNewLoanReminderDays(loanToEdit?.reminderSettings?.daysBefore ? String(loanToEdit.reminderSettings.daysBefore) : '3');
    setNewLoanIsRecurring(loanToEdit ? loanToEdit.isRecurring || false : false);
    setNewLoanRecurrenceType(loanToEdit?.recurrenceSettings?.type || RecurrenceType.Monthly);
    setNewLoanRecurrenceMaxOccurrences(loanToEdit?.recurrenceSettings?.maxOccurrences ? String(loanToEdit.recurrenceSettings.maxOccurrences) : '');
    setNewLoanRecurrenceFirstPaymentDate(loanToEdit?.recurrenceSettings?.firstPaymentDate ? new Date(loanToEdit.recurrenceSettings.firstPaymentDate).toISOString().split('T')[0] : '');
    setNewLoanRecurrencePaymentAmount(loanToEdit?.recurrenceSettings?.paymentAmount ? String(loanToEdit.recurrenceSettings.paymentAmount) : '');
    
    setIsLoanModalOpen(true);
  };

  // --- Data Mutation Handlers ---
  const handleStateChange = (newState: AppState) => {
    setAppState(newState);
    saveAllData(newState);
    // Refresh data from server after a short delay to get processed data
    setTimeout(() => {
      refreshDataFromServer();
    }, 500);
  };

  const toggleDarkMode = () => {
    const newState = { ...appState, 'loandash-dark-mode': !isDarkMode };
    handleStateChange(newState);
  };
  
  const handleAutoArchiveChange = (setting: AutoArchiveSetting) => {
    const newState = { ...appState, 'loandash-auto-archive': setting };
    handleStateChange(newState);
  };

  const handleArchiveDebt = (debtId: string, status: 'completed' | 'defaulted') => {
    const debtToArchive = debts.find(d => d.id === debtId);
    if (debtToArchive) {
      const nextDebts = debts.filter(d => d.id !== debtId);
      const nextArchivedDebts = [...archivedDebts, { ...debtToArchive, status }];
      handleStateChange({ ...appState, 'loandash-debts': nextDebts, 'loandash-archived-debts': nextArchivedDebts });
    }
  };
  
  const handleArchiveLoan = (loanId: string, status: 'completed' | 'defaulted') => {
    const loanToArchive = loans.find(l => l.id === loanId);
    if (loanToArchive) {
      const nextLoans = loans.filter(l => l.id !== loanId);
      const nextArchivedLoans = [...archivedLoans, { ...loanToArchive, status }];
      handleStateChange({ ...appState, 'loandash-loans': nextLoans, 'loandash-archived-loans': nextArchivedLoans });
    }
  };

  const handleDeleteArchivedDebt = (debtId: string) => {
    if (window.confirm('This will permanently delete the debt record. This action cannot be undone. Are you sure?')) {
      const nextArchivedDebts = archivedDebts.filter(d => d.id !== debtId);
      handleStateChange({ ...appState, 'loandash-archived-debts': nextArchivedDebts });
    }
  };
  
  const handleDeleteArchivedLoan = (loanId: string) => {
    if (window.confirm('This will permanently delete the loan record. This action cannot be undone. Are you sure?')) {
      const nextArchivedLoans = archivedLoans.filter(l => l.id !== loanId);
      handleStateChange({ ...appState, 'loandash-archived-loans': nextArchivedLoans });
    }
  };

  const handleAddPayment = (debtId: string, payment: Omit<Payment, 'id'>) => {
    const debtWithInterest = debtsWithInterest.find(d => d.id === debtId);
    if (!debtWithInterest) return;
  
    const updatedDebt: Debt = {
      ...debts.find(d => d.id === debtId)!,
      payments: [...debtWithInterest.payments, { ...payment, id: crypto.randomUUID() }]
    };
    
    const totalPaid = updatedDebt.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalOwed = updatedDebt.totalAmount + (debtWithInterest.accruedInterest || 0);
    
    if (totalPaid >= totalOwed) {
      updatedDebt.status = 'completed';
    }
    
    const nextDebts = debts.map(d => d.id === debtId ? updatedDebt : d);
    handleStateChange({ ...appState, 'loandash-debts': nextDebts });
  };

  const handleUpdatePayment = (debtId: string, paymentId: string, updatedPayment: Omit<Payment, 'id'>) => {
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;

    const updatedDebt: Debt = {
      ...debt,
      payments: debt.payments.map(p => 
        p.id === paymentId ? { ...updatedPayment, id: paymentId } : p
      )
    };

    const debtWithInterest = debtsWithInterest.find(d => d.id === debtId);
    const totalPaid = updatedDebt.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalOwed = updatedDebt.totalAmount + (debtWithInterest?.accruedInterest || 0);
    
    if (totalPaid >= totalOwed) {
      updatedDebt.status = 'completed';
    } else {
      updatedDebt.status = 'active';
    }
    
    const nextDebts = debts.map(d => d.id === debtId ? updatedDebt : d);
    handleStateChange({ ...appState, 'loandash-debts': nextDebts });
  };
  
  const handleAddRepayment = (loanId: string, repayment: Omit<Payment, 'id'>) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
  
    const updatedLoan: Loan = {
      ...loan,
      repayments: [...loan.repayments, { ...repayment, id: crypto.randomUUID() }]
    };
    
    const totalRepaid = updatedLoan.repayments.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalRepaid >= updatedLoan.totalAmount) {
      updatedLoan.status = 'completed';
    }
    
    const nextLoans = loans.map(l => l.id === loanId ? updatedLoan : l);
    handleStateChange({ ...appState, 'loandash-loans': nextLoans });
  };

  const handleUpdateRepayment = (loanId: string, repaymentId: string, updatedRepayment: Omit<Payment, 'id'>) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const updatedLoan: Loan = {
      ...loan,
      repayments: loan.repayments.map(r => 
        r.id === repaymentId ? { ...updatedRepayment, id: repaymentId } : r
      )
    };

    const totalRepaid = updatedLoan.repayments.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalRepaid >= updatedLoan.totalAmount) {
      updatedLoan.status = 'completed';
    } else {
      updatedLoan.status = 'active';
    }
    
    const nextLoans = loans.map(l => l.id === loanId ? updatedLoan : l);
    handleStateChange({ ...appState, 'loandash-loans': nextLoans });
  };

  // --- Form Submission Handlers ---
  const handleDebtFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    
    const errors: string[] = [];
    if (!newDebtName.trim()) errors.push('Name is required');
    if (!newDebtAmount || parseFloat(newDebtAmount) <= 0) errors.push('Amount must be greater than 0');
    if (parseFloat(newDebtAmount) > 999999999) errors.push('Amount is too large');
    if (!newDebtStartDate) errors.push('Start date is required');
    if (!newDebtIsRecurring && !(newDebtType === DebtType.Loan && newDebtPaymentAutomation === PaymentAutomationType.Auto) && !newDebtDueDate) errors.push('Due date is required');
    if (!newDebtIsRecurring && !(newDebtType === DebtType.Loan && newDebtPaymentAutomation === PaymentAutomationType.Auto) && new Date(newDebtStartDate) > new Date(newDebtDueDate)) errors.push('Due date must be after start date');
    if (new Date(newDebtStartDate) > new Date()) errors.push('Start date cannot be in the future');
    if (newDebtType === DebtType.Loan && newDebtInterestRate && parseFloat(newDebtInterestRate) < 0) errors.push('Interest rate cannot be negative');
    if (newDebtReminderEnabled && (!newDebtReminderDays || parseInt(newDebtReminderDays) < 0 || parseInt(newDebtReminderDays) > 365)) errors.push('Reminder days must be between 0 and 365');
    
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    const debtData: Debt = {
      id: editingDebtId || crypto.randomUUID(),
      type: newDebtType,
      name: newDebtName.trim(),
      totalAmount: parseFloat(newDebtAmount),
      startDate: newDebtStartDate,
      dueDate: newDebtIsRecurring ? 
        (() => {
          // For recurring debts, calculate when debt will be fully paid based on payment schedule
          const totalAmount = parseFloat(newDebtAmount);
          const paymentAmount = newDebtRecurrencePaymentAmount ? 
            parseFloat(newDebtRecurrencePaymentAmount) : (totalAmount / 10); // Default to 10 payments if not specified
          
          const firstPaymentDate = new Date(newDebtRecurrenceFirstPaymentDate || newDebtStartDate);
          const paymentsNeeded = Math.ceil(totalAmount / paymentAmount);
          
          // Calculate days between payments based on recurrence type
          let daysBetweenPayments = 30; // Default to monthly
          switch (newDebtRecurrenceType) {
            case 'daily': daysBetweenPayments = 1; break;
            case 'weekly': daysBetweenPayments = 7; break;
            case 'bi-weekly': daysBetweenPayments = 14; break;
            case 'monthly': daysBetweenPayments = 30; break;
            case 'quarterly': daysBetweenPayments = 90; break;
            case 'yearly': daysBetweenPayments = 365; break;
          }
          
          // Calculate the expected completion date (last payment date)
          const completionDate = new Date(firstPaymentDate);
          completionDate.setDate(completionDate.getDate() + ((paymentsNeeded - 1) * daysBetweenPayments));
          
          return completionDate.toISOString().split('T')[0];
        })() : 
        newDebtType === DebtType.Loan && newDebtPaymentAutomation === PaymentAutomationType.Auto ? 
        (() => {
          // For bank loans with auto-payment, calculate completion date based on monthly payments
          const totalAmount = parseFloat(newDebtAmount);
          const monthlyPayment = newDebtRecurrencePaymentAmount ? 
            parseFloat(newDebtRecurrencePaymentAmount) : (totalAmount / 12); // Default to 12 months if not specified
          
          const firstPaymentDate = new Date(newDebtRecurrenceFirstPaymentDate || newDebtStartDate);
          const monthsNeeded = Math.ceil(totalAmount / monthlyPayment);
          
          // Calculate the expected completion date (last payment date)
          // Use a more robust method to avoid month overflow issues
          const completionDate = new Date(firstPaymentDate);
          const targetYear = completionDate.getFullYear();
          const targetMonth = completionDate.getMonth() + (monthsNeeded - 1);
          const targetDay = completionDate.getDate();
          
          // Handle year overflow
          const finalYear = targetYear + Math.floor(targetMonth / 12);
          const finalMonth = targetMonth % 12;
          
          // Set the date components individually to avoid day overflow
          completionDate.setFullYear(finalYear, finalMonth, 1);
          
          // Get the last day of the target month
          const lastDayOfMonth = new Date(finalYear, finalMonth + 1, 0).getDate();
          
          // Set the day to the original day or the last day of the month, whichever is smaller
          completionDate.setDate(Math.min(targetDay, lastDayOfMonth));
          
          return completionDate.toISOString().split('T')[0];
        })() :
        newDebtDueDate,
      payments: editingDebtId ? debts.find(d => d.id === editingDebtId)?.payments || [] : [],
      description: newDebtDescription.trim() || undefined,
      interestRate: newDebtType === DebtType.Loan && newDebtInterestRate ? parseFloat(newDebtInterestRate) : undefined,
      isRecurring: newDebtType !== DebtType.Loan ? newDebtIsRecurring : false,
      recurrenceSettings: newDebtType !== DebtType.Loan && newDebtIsRecurring ? {
        type: newDebtRecurrenceType,
        maxOccurrences: newDebtRecurrenceMaxOccurrences ? parseInt(newDebtRecurrenceMaxOccurrences) : undefined,
        firstPaymentDate: newDebtRecurrenceFirstPaymentDate || undefined,
        paymentAmount: newDebtRecurrencePaymentAmount ? parseFloat(newDebtRecurrencePaymentAmount) : undefined
      } : newDebtType === DebtType.Loan && (newDebtRecurrencePaymentAmount || newDebtRecurrenceFirstPaymentDate) ? {
        type: RecurrenceType.Monthly,
        firstPaymentDate: newDebtRecurrenceFirstPaymentDate || undefined,
        paymentAmount: newDebtRecurrencePaymentAmount ? parseFloat(newDebtRecurrencePaymentAmount) : undefined
      } : undefined,
      status: 'active',
      currency: newDebtCurrency,
      reminderSettings: {
        enabled: newDebtReminderEnabled,
        daysBefore: parseInt(newDebtReminderDays)
      },
      paymentAutomation: newDebtType === DebtType.Loan ? newDebtPaymentAutomation : undefined
    };

    const nextDebts = editingDebtId 
      ? debts.map(d => d.id === editingDebtId ? debtData : d)
      : [...debts, debtData];
    
    const nextState = { ...appState, 'loandash-debts': nextDebts };
    
    handleStateChange(nextState);
    resetAndCloseForms();
  };
  
  const handleLoanFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    
    const errors: string[] = [];
    if (!newLoanName.trim()) errors.push('Name is required');
    if (!newLoanAmount || parseFloat(newLoanAmount) <= 0) errors.push('Amount must be greater than 0');
    if (parseFloat(newLoanAmount) > 999999999) errors.push('Amount is too large');
    if (!newLoanStartDate) errors.push('Start date is required');
    if (!newLoanIsRecurring && !newLoanDueDate) errors.push('Due date is required');
    if (!newLoanIsRecurring && new Date(newLoanStartDate) > new Date(newLoanDueDate)) errors.push('Due date must be after start date');
    if (new Date(newLoanStartDate) > new Date()) errors.push('Start date cannot be in the future');
    if (newLoanReminderEnabled && (!newLoanReminderDays || parseInt(newLoanReminderDays) < 0 || parseInt(newLoanReminderDays) > 365)) errors.push('Reminder days must be between 0 and 365');
    
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    const loanData: Loan = {
      id: editingLoanId || crypto.randomUUID(),
      name: newLoanName.trim(),
      totalAmount: parseFloat(newLoanAmount),
      startDate: newLoanStartDate,
      dueDate: newLoanIsRecurring ? 
        (() => {
          // For recurring loans, calculate when loan will be fully repaid based on payment schedule
          const totalAmount = parseFloat(newLoanAmount);
          const paymentAmount = newLoanRecurrencePaymentAmount ? 
            parseFloat(newLoanRecurrencePaymentAmount) : (totalAmount / 10); // Default to 10 payments if not specified
          
          const firstPaymentDate = new Date(newLoanRecurrenceFirstPaymentDate || newLoanStartDate);
          const paymentsNeeded = Math.ceil(totalAmount / paymentAmount);
          
          // Calculate days between payments based on recurrence type
          let daysBetweenPayments = 30; // Default to monthly
          switch (newLoanRecurrenceType) {
            case RecurrenceType.Daily: daysBetweenPayments = 1; break;
            case RecurrenceType.Weekly: daysBetweenPayments = 7; break;
            case RecurrenceType.BiWeekly: daysBetweenPayments = 14; break;
            case RecurrenceType.Monthly: daysBetweenPayments = 30; break;
            case RecurrenceType.Quarterly: daysBetweenPayments = 90; break;
            case RecurrenceType.Yearly: daysBetweenPayments = 365; break;
          }
          
          // Calculate the expected completion date (last payment date)
          // Use a more robust method to avoid month overflow issues for monthly payments
          const completionDate = new Date(firstPaymentDate);
          
          if (newLoanRecurrenceType === RecurrenceType.Monthly) {
            // For monthly payments, use setMonth to avoid day overflow issues
            const targetYear = completionDate.getFullYear();
            const targetMonth = completionDate.getMonth() + (paymentsNeeded - 1);
            const targetDay = completionDate.getDate();
            
            // Handle year overflow
            const finalYear = targetYear + Math.floor(targetMonth / 12);
            const finalMonth = targetMonth % 12;
            
            // Set the date components individually to avoid day overflow
            completionDate.setFullYear(finalYear, finalMonth, 1);
            
            // Get the last day of the target month
            const lastDayOfMonth = new Date(finalYear, finalMonth + 1, 0).getDate();
            
            // Set the day to the original day or the last day of the month, whichever is smaller
            completionDate.setDate(Math.min(targetDay, lastDayOfMonth));
          } else {
            // For non-monthly payments, use the original day-based calculation
            completionDate.setDate(completionDate.getDate() + ((paymentsNeeded - 1) * daysBetweenPayments));
          }
          
          return completionDate.toISOString().split('T')[0];
        })() :
        newLoanDueDate,
      repayments: editingLoanId ? loans.find(l => l.id === editingLoanId)?.repayments || [] : [],
      description: newLoanDescription.trim() || undefined,
      status: 'active',
      currency: newLoanCurrency,
      reminderSettings: {
        enabled: newLoanReminderEnabled,
        daysBefore: parseInt(newLoanReminderDays)
      },
      isRecurring: newLoanIsRecurring,
      recurrenceSettings: newLoanIsRecurring ? {
        type: newLoanRecurrenceType,
        maxOccurrences: newLoanRecurrenceMaxOccurrences ? parseInt(newLoanRecurrenceMaxOccurrences) : undefined,
        firstPaymentDate: newLoanRecurrenceFirstPaymentDate || undefined,
        paymentAmount: newLoanRecurrencePaymentAmount ? parseFloat(newLoanRecurrencePaymentAmount) : undefined
      } : undefined
    };

    const nextLoans = editingLoanId 
      ? loans.map(l => l.id === editingLoanId ? loanData : l)
      : [...loans, loanData];
    
    const nextState = { ...appState, 'loandash-loans': nextLoans };
    
    handleStateChange(nextState);
    resetAndCloseForms();
  };
  
  // --- CSV Export Function ---
  const exportToCSV = () => {
    try {
      // Prepare data for export
      const exportData: any[] = [];
      
      // Add active debts
      debts.forEach(debt => {
        const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = debt.totalAmount - totalPaid;
        
        exportData.push({
          Type: 'Debt',
          Status: 'Active',
          Name: debt.name,
          Category: debt.type,
          TotalAmount: debt.totalAmount,
          AmountPaid: totalPaid,
          AmountRemaining: remaining,
          StartDate: new Date(debt.startDate).toLocaleDateString(),
          DueDate: new Date(debt.dueDate).toLocaleDateString(),
          Description: debt.description || '',
          InterestRate: debt.interestRate || '',
          IsRecurring: debt.isRecurring ? 'Yes' : 'No',
          PaymentCount: debt.payments.length,
          Currency: debt.currency || 'MAD'
        });
      });
      
      // Add active loans
      loans.forEach(loan => {
        const totalRepaid = loan.repayments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = loan.totalAmount - totalRepaid;
        
        exportData.push({
          Type: 'Loan',
          Status: 'Active',
          Name: loan.name,
          Category: 'Loan',
          TotalAmount: loan.totalAmount,
          AmountPaid: totalRepaid,
          AmountRemaining: remaining,
          StartDate: new Date(loan.startDate).toLocaleDateString(),
          DueDate: new Date(loan.dueDate).toLocaleDateString(),
          Description: loan.description || '',
          InterestRate: '',
          IsRecurring: 'No',
          PaymentCount: loan.repayments.length,
          Currency: loan.currency || 'MAD'
        });
      });
      
      // Add archived debts
      archivedDebts.forEach(debt => {
        const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = debt.totalAmount - totalPaid;
        
        exportData.push({
          Type: 'Debt',
          Status: `Archived (${debt.status})`,
          Name: debt.name,
          Category: debt.type,
          TotalAmount: debt.totalAmount,
          AmountPaid: totalPaid,
          AmountRemaining: remaining,
          StartDate: new Date(debt.startDate).toLocaleDateString(),
          DueDate: new Date(debt.dueDate).toLocaleDateString(),
          Description: debt.description || '',
          InterestRate: debt.interestRate || '',
          IsRecurring: debt.isRecurring ? 'Yes' : 'No',
          PaymentCount: debt.payments.length,
          Currency: debt.currency || 'MAD'
        });
      });
      
      // Add archived loans
      archivedLoans.forEach(loan => {
        const totalRepaid = loan.repayments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = loan.totalAmount - totalRepaid;
        
        exportData.push({
          Type: 'Loan',
          Status: `Archived (${loan.status})`,
          Name: loan.name,
          Category: 'Loan',
          TotalAmount: loan.totalAmount,
          AmountPaid: totalRepaid,
          AmountRemaining: remaining,
          StartDate: new Date(loan.startDate).toLocaleDateString(),
          DueDate: new Date(loan.dueDate).toLocaleDateString(),
          Description: loan.description || '',
          InterestRate: '',
          IsRecurring: 'No',
          PaymentCount: loan.repayments.length,
          Currency: loan.currency || 'MAD'
        });
      });
      
      if (exportData.length === 0) {
        alert('No data to export. Add some debts or loans first.');
        return;
      }
      
      // Convert to CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `loandash-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`Successfully exported ${exportData.length} records to CSV!`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // --- Rendering ---
  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex justify-center items-center p-8">
          <div className="text-center max-w-2xl bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Application Error</h1>
            <p className="text-slate-700 dark:text-slate-300 mb-6 bg-slate-200 dark:bg-slate-700 p-4 rounded-md font-mono text-sm whitespace-pre-wrap break-all text-left">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 text-lg font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
      </div>
    );
  }

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex justify-center items-center">
          <div className="text-xl font-semibold text-slate-700 dark:text-slate-200 animate-pulse">Loading LoanDash...</div>
      </div>
    );
  }

  const lowercasedQuery = searchQuery.toLowerCase();
  const filteredDebts = debtsWithInterest.filter(debt => debt.name.toLowerCase().includes(lowercasedQuery));
  const filteredLoans = loans.filter(loan => loan.name.toLowerCase().includes(lowercasedQuery));
  const filteredArchivedDebts = archivedDebts.filter(debt => debt.name.toLowerCase().includes(lowercasedQuery));
  const filteredArchivedLoans = archivedLoans.filter(loan => loan.name.toLowerCase().includes(lowercasedQuery));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard debts={debtsWithInterest} loans={loans} archivedDebts={archivedDebts} archivedLoans={archivedLoans} defaultCurrency={defaultCurrency} />;
      case 'debts': return <DebtsComponent debts={filteredDebts} defaultCurrency={defaultCurrency} onAddPayment={handleAddPayment} onUpdatePayment={handleUpdatePayment} onArchiveDebt={handleArchiveDebt} onEdit={(debtId) => {
        const debt = debts.find(d => d.id === debtId);
        openDebtModal(debt || null);
      }} />;
      case 'loans': return <LoansComponent loans={filteredLoans} defaultCurrency={defaultCurrency} onAddRepayment={handleAddRepayment} onUpdateRepayment={handleUpdateRepayment} onArchiveLoan={handleArchiveLoan} onEdit={(loanId) => {
        const loan = loans.find(l => l.id === loanId);
        openLoanModal(loan || null);
      }} />;
      case 'archive': return <ArchiveComponent archivedDebts={filteredArchivedDebts} archivedLoans={filteredArchivedLoans} defaultCurrency={defaultCurrency} onDeleteDebt={handleDeleteArchivedDebt} onDeleteLoan={handleDeleteArchivedLoan} />
      default: return <Dashboard debts={debtsWithInterest} loans={loans} archivedDebts={archivedDebts} archivedLoans={archivedLoans} defaultCurrency={defaultCurrency} />;
    }
  };

  const TabButton: React.FC<{tab: ActiveTab, label: string}> = ({ tab, label }) => (
      <button onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${ activeTab === tab ? 'bg-primary-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
        {label}
      </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} onSettingsClick={() => setIsSettingsModalOpen(true)} overdueCount={overdueCount} onNotificationClick={() => { if (hasOverdueDebts) setActiveTab('debts'); else if (hasOverdueLoans) setActiveTab('loans'); }} />
      
      <UpdateNotification />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
                <TabButton tab="dashboard" label="Dashboard" />
                <TabButton tab="debts" label="My Debts" />
                <TabButton tab="loans" label="My Loans" />
                <TabButton tab="archive" label="Archive" />
            </div>
            <button onClick={() => openDebtModal()} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-primary-700 transition-colors shadow-sm"><PlusIcon className="w-5 h-5" />Add New Debt</button>
            <button onClick={() => openLoanModal()} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 transition-colors shadow-sm"><PlusIcon className="w-5 h-5" />Add New Loan</button>
            {["dashboard", "archive"].includes(activeTab) && <div className="h-[40px]" />}
        </div>
        {['debts', 'loans', 'archive'].includes(activeTab) && (
            <div className="mb-6">
                <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" /></div>
                    <input type="text" name="search" id="search"
                        className="block w-full rounded-md border-0 bg-white dark:bg-slate-700 py-2.5 pl-10 pr-3 text-slate-900 dark:text-slate-100 ring-1 ring-inset ring-slate-300 dark:ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm"
                        placeholder={`Search in ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}...`}
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
            </div>
        )}

        {renderContent()}
      </main>

      {/* --- Modals --- */}
      <Modal isOpen={isDebtModalOpen} onClose={resetAndCloseForms} title={editingDebtId ? 'Edit Debt' : 'Add New Debt'}>
        <form onSubmit={handleDebtFormSubmit} noValidate className="space-y-4">
          {formErrors.length > 0 && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md space-y-1" role="alert">
                <p className="font-bold">Please correct the following errors:</p>
                <ul className="list-disc list-inside text-sm">
                    {formErrors.map((error, i) => <li key={i}>{error}</li>)}
                </ul>
            </div>
          )}
          <div>
            <label htmlFor="debtName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Who did you borrow from?</label>
            <input type="text" id="debtName" value={newDebtName} onChange={e => setNewDebtName(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder={'e.g., Mom'} />
          </div>
          <div>
            <label htmlFor="debtAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Total Amount Owed</label>
            <input type="number" id="debtAmount" value={newDebtAmount} onChange={e => setNewDebtAmount(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder={`0.00 ${defaultCurrency}`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="debtStartDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date Taken</label>
              <input type="date" id="debtStartDate" value={newDebtStartDate} onChange={e => setNewDebtStartDate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            {!newDebtIsRecurring && !(newDebtType === DebtType.Loan && newDebtPaymentAutomation === PaymentAutomationType.Auto) && (
              <div>
                <label htmlFor="debtDueDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Return Date</label>
                <input type="date" id="debtDueDate" value={newDebtDueDate} onChange={e => setNewDebtDueDate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>
            )}
          </div>
          <div>
            <label htmlFor="debtType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
            <select id="debtType" value={newDebtType} onChange={e => { const type = e.target.value as DebtType; setNewDebtType(type); if (type === DebtType.Loan) setNewDebtIsRecurring(false); }} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
              <option>{DebtType.Friend}</option>
              <option>{DebtType.Loan}</option>
            </select>
          </div>
          {newDebtType === DebtType.Loan && (
            <div className="space-y-4">
              <div>
                <label htmlFor="debtInterestRate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Annual Interest Rate (%) <span className="text-xs text-slate-500">(Optional)</span></label>
                <input type="number" id="debtInterestRate" value={newDebtInterestRate} onChange={e => setNewDebtInterestRate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g., 5.5" />
              </div>
              {newDebtPaymentAutomation === PaymentAutomationType.Auto && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstPaymentDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">First Payment Date</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">When should the first automatic payment be processed?</p>
                    <input type="date" id="firstPaymentDate" value={newDebtRecurrenceFirstPaymentDate} onChange={e => setNewDebtRecurrenceFirstPaymentDate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="monthlyPaymentAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Monthly Payment Amount <span className="text-xs text-slate-500">(Optional)</span></label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">How much will be paid each month? If not specified, amount will be calculated automatically.</p>
                    <input type="number" id="monthlyPaymentAmount" value={newDebtRecurrencePaymentAmount} onChange={e => setNewDebtRecurrencePaymentAmount(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g., 500" />
                  </div>
                </div>
              )}
              {newDebtPaymentAutomation === PaymentAutomationType.Manual && (
                <div>
                  <label htmlFor="monthlyPaymentAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Monthly Payment Amount <span className="text-xs text-slate-500">(Optional)</span></label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">How much will you pay each month? This helps calculate the due date automatically.</p>
                  <input type="number" id="monthlyPaymentAmount" value={newDebtRecurrencePaymentAmount} onChange={e => setNewDebtRecurrencePaymentAmount(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g., 500" />
                </div>
              )}
              <div>
                <label htmlFor="debtPaymentAutomation" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Payment Processing</label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Choose how payments will be recorded for this bank loan.</p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input 
                      id="paymentManual" 
                      type="radio" 
                      name="paymentAutomation" 
                      value={PaymentAutomationType.Manual}
                      checked={newDebtPaymentAutomation === PaymentAutomationType.Manual}
                      onChange={e => setNewDebtPaymentAutomation(e.target.value as PaymentAutomationType)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300" 
                    />
                    <label htmlFor="paymentManual" className="ml-2 block text-sm text-slate-900 dark:text-slate-200">
                      Manual Payment Recording
                      <span className="block text-xs text-slate-500 dark:text-slate-400">I will manually record each payment when confirmed</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      id="paymentAuto" 
                      type="radio" 
                      name="paymentAutomation" 
                      value={PaymentAutomationType.Auto}
                      checked={newDebtPaymentAutomation === PaymentAutomationType.Auto}
                      onChange={e => setNewDebtPaymentAutomation(e.target.value as PaymentAutomationType)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300" 
                    />
                    <label htmlFor="paymentAuto" className="ml-2 block text-sm text-slate-900 dark:text-slate-200">
                      Automatic Payment Recording
                      <span className="block text-xs text-slate-500 dark:text-slate-400">App will automatically record monthly payments on scheduled dates</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div>
            <label htmlFor="debtDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description <span className="text-xs text-slate-500">(Optional)</span></label>
            <textarea id="debtDescription" rows={3} value={newDebtDescription} onChange={e => setNewDebtDescription(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g., For concert tickets, to be paid back after next payday." />
          </div>
          {newDebtType !== DebtType.Loan && (
            <div className="space-y-4">
              <div className="flex items-center">
                <input id="isRecurring" type="checkbox" checked={newDebtIsRecurring} onChange={e => setNewDebtIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <label htmlFor="isRecurring" className="ml-2 block text-sm text-slate-900 dark:text-slate-200">This is a recurring debt</label>
              </div>
              {newDebtIsRecurring && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="recurrenceType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Recurrence Type</label>
                    <select id="recurrenceType" value={newDebtRecurrenceType} onChange={e => setNewDebtRecurrenceType(e.target.value as RecurrenceType)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                      {Object.values(RecurrenceType).filter(type => type !== RecurrenceType.None).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstPaymentDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">First Payment Date</label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">When do you want to start making payments?</p>
                      <input type="date" id="firstPaymentDate" value={newDebtRecurrenceFirstPaymentDate} onChange={e => setNewDebtRecurrenceFirstPaymentDate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor="paymentAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Payment Amount <span className="text-xs text-slate-500">(Optional)</span></label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">How much will you pay each time?</p>
                      <input type="number" id="paymentAmount" value={newDebtRecurrencePaymentAmount} onChange={e => setNewDebtRecurrencePaymentAmount(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g., 250" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div>
            <label htmlFor="debtCurrency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Currency</label>
            <select id="debtCurrency" value={newDebtCurrency} onChange={e => setNewDebtCurrency(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
              {SUPPORTED_CURRENCIES.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <input id="debtReminderEnabled" type="checkbox" checked={newDebtReminderEnabled} onChange={e => setNewDebtReminderEnabled(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <label htmlFor="debtReminderEnabled" className="ml-2 block text-sm text-slate-900 dark:text-slate-200">Enable Reminders</label>
          </div>
          {newDebtReminderEnabled && (
            <div>
              <label htmlFor="debtReminderDays" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Remind me <span className="text-xs text-slate-500">(days before due date)</span></label>
              <input type="number" id="debtReminderDays" value={newDebtReminderDays} onChange={e => setNewDebtReminderDays(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g., 3" />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={resetAndCloseForms} className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors">{editingDebtId ? 'Save Changes' : 'Add Debt'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isLoanModalOpen} onClose={resetAndCloseForms} title={editingLoanId ? 'Edit Loan' : 'Add New Loan'}>
        <form onSubmit={handleLoanFormSubmit} noValidate className="space-y-4">
          {formErrors.length > 0 && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md space-y-1" role="alert">
                <p className="font-bold">Please correct the following errors:</p>
                <ul className="list-disc list-inside text-sm">
                    {formErrors.map((error, i) => <li key={i}>{error}</li>)}
                </ul>
            </div>
          )}
          <div>
            <label htmlFor="loanName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Who are you loaning to?</label>
            <input type="text" id="loanName" value={newLoanName} onChange={e => setNewLoanName(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder={'e.g., John Doe'} />
          </div>
          <div>
            <label htmlFor="loanAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Total Amount Loaned</label>
            <input type="number" id="loanAmount" value={newLoanAmount} onChange={e => setNewLoanAmount(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder={`0.00 ${defaultCurrency}`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="loanStartDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date Loaned</label>
              <input type="date" id="loanStartDate" value={newLoanStartDate} onChange={e => setNewLoanStartDate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
            {!newLoanIsRecurring && (
              <div>
                <label htmlFor="loanDueDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Repayment Date</label>
                <input type="date" id="loanDueDate" value={newLoanDueDate} onChange={e => setNewLoanDueDate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
              </div>
            )}
          </div>
          <div>
            <label htmlFor="loanDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description <span className="text-xs text-slate-500">(Optional)</span></label>
            <textarea id="loanDescription" rows={3} value={newLoanDescription} onChange={e => setNewLoanDescription(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="e.g., For their car repair." />
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <input id="isRecurringLoan" type="checkbox" checked={newLoanIsRecurring} onChange={e => setNewLoanIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
              <label htmlFor="isRecurringLoan" className="ml-2 block text-sm text-slate-900 dark:text-slate-200">This is a recurring loan</label>
            </div>
            {newLoanIsRecurring && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="loanRecurrenceType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Recurrence Type</label>
                  <select id="loanRecurrenceType" value={newLoanRecurrenceType} onChange={e => setNewLoanRecurrenceType(e.target.value as RecurrenceType)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
                    {Object.values(RecurrenceType).filter(type => type !== RecurrenceType.None).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="loanFirstPaymentDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">First Payment Date</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">When do you expect to receive the first payment?</p>
                    <input type="date" id="loanFirstPaymentDate" value={newLoanRecurrenceFirstPaymentDate} onChange={e => setNewLoanRecurrenceFirstPaymentDate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="loanPaymentAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Payment Amount <span className="text-xs text-slate-500">(Optional)</span></label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">How much will they pay each time?</p>
                    <input type="number" id="loanPaymentAmount" value={newLoanRecurrencePaymentAmount} onChange={e => setNewLoanRecurrencePaymentAmount(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="e.g., 250" />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="loanCurrency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Currency</label>
            <select id="loanCurrency" value={newLoanCurrency} onChange={e => setNewLoanCurrency(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
              {SUPPORTED_CURRENCIES.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <input id="loanReminderEnabled" type="checkbox" checked={newLoanReminderEnabled} onChange={e => setNewLoanReminderEnabled(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <label htmlFor="loanReminderEnabled" className="ml-2 block text-sm text-slate-900 dark:text-slate-200">Enable Reminders</label>
          </div>
          {newLoanReminderEnabled && (
            <div>
              <label htmlFor="loanReminderDays" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Remind me <span className="text-xs text-slate-500">(days before due date)</span></label>
              <input type="number" id="loanReminderDays" value={newLoanReminderDays} onChange={e => setNewLoanReminderDays(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="e.g., 3" />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={resetAndCloseForms} className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors">{editingLoanId ? 'Save Changes' : 'Add Loan'}</button>
          </div>
        </form>
      </Modal>
      
      <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Settings">
        <div className="space-y-6">
            <div>
                <label htmlFor="defaultCurrency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Default Currency</label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Choose the default currency for your financial entries.</p>
                <select id="defaultCurrency" value={defaultCurrency} onChange={e => handleStateChange({ ...appState, 'loandash-default-currency': e.target.value })} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    {SUPPORTED_CURRENCIES.map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="autoArchive" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Auto-Archive Completed Items</label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Automatically move paid-off items to the archive after a set time.</p>
                <select id="autoArchive" value={autoArchiveSetting} onChange={e => handleAutoArchiveChange(e.target.value as AutoArchiveSetting)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="never">Never</option>
                    <option value="immediately">Immediately</option>
                    <option value="1day">After 1 Day</option>
                    <option value="7days">After 7 Days</option>
                </select>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Data Management</h3>
                 <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Download all your data as a CSV file.</p>
                 <button onClick={exportToCSV} className="flex items-center gap-2 w-full justify-center px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Export All Data to CSV
                 </button>
            </div>
             <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setIsSettingsModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors">Done</button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;

