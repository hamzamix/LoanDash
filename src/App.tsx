import React, { useState, useEffect, useMemo } from 'react';
import { Debt, DebtType, Loan, Payment, RecurrenceType, RecurrenceSettings, NotificationSettings } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DebtsComponent from './components/Debts';
import LoansComponent from './components/Loans';
import ArchiveComponent from './components/Archive';
import Modal from './components/common/Modal';
import { PlusIcon, MagnifyingGlassIcon, ArrowDownTrayIcon } from './components/common/Icons';
import { formatCurrency, SUPPORTED_CURRENCIES } from './utils/currency';
import { calculateNextDueDate, getRecurrenceDescription } from './utils/recurrence';

type ActiveTab = 'dashboard' | 'debts' | 'loans' | 'archive';
type AutoArchiveSetting = 'never' | 'immediate' | '1day' | '7days';

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
  const [newDebtRecurrenceEndDate, setNewDebtRecurrenceEndDate] = useState('');
  const [newDebtRecurrenceMaxOccurrences, setNewDebtRecurrenceMaxOccurrences] = useState('');
  const [newDebtCurrency, setNewDebtCurrency] = useState('');
  const [newDebtReminderEnabled, setNewDebtReminderEnabled] = useState(true);
  const [newDebtReminderDays, setNewDebtReminderDays] = useState('3');
  
  const [newLoanName, setNewLoanName] = useState('');
  const [newLoanAmount, setNewLoanAmount] = useState('');
  const [newLoanStartDate, setNewLoanStartDate] = useState('');
  const [newLoanDueDate, setNewLoanDueDate] = useState('');
  const [newLoanDescription, setNewLoanDescription] = useState('');
  const [newLoanCurrency, setNewLoanCurrency] = useState('');
  const [newLoanReminderEnabled, setNewLoanReminderEnabled] = useState(true);
  const [newLoanReminderDays, setNewLoanReminderDays] = useState('3');

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
      return true;
    } catch (error) {
      console.error('Failed to save data:', error);
      alert('Error: Could not save data. Your changes were not saved. Please check your connection and try again.');
      return false;
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
        return remaining > 0 && new Date(d.dueDate) < now;
    });
    const overdueLoans = loans.filter(l => {
        const remaining = l.totalAmount - l.repayments.reduce((sum, p) => sum + p.amount, 0);
        return remaining > 0 && new Date(l.dueDate) < now;
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
    
    setIsLoanModalOpen(true);
  };

  // --- Data Mutation Handlers ---
  const handleStateChange = async (newState: AppState) => {
    const success = await saveAllData(newState);
    if (success) {
      setAppState(newState);
    }
    return success;
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
    const totalOwedWithInterest = debtWithInterest.totalAmount + debtWithInterest.accruedInterest;
    const isPaidOff = totalOwedWithInterest - totalPaid <= 0.01;
  
    if (updatedDebt.isRecurring && isPaidOff) {
      const newDueDate = new Date(updatedDebt.dueDate);
      newDueDate.setMonth(newDueDate.getMonth() + 1);
      const nextDebt: Debt = { ...updatedDebt, payments: [], id: crypto.randomUUID(), dueDate: newDueDate.toISOString(), startDate: new Date().toISOString() };
      
      const nextDebts = debts.map(d => d.id === debtId ? nextDebt : d);
      const nextArchived = [...archivedDebts, { ...updatedDebt, status: 'completed' as const }];
      handleStateChange({ ...appState, 'loandash-debts': nextDebts, 'loandash-archived-debts': nextArchived });
    } else {
      const nextDebts = debts.map(d => d.id === debtId ? updatedDebt : d);
      handleStateChange({ ...appState, 'loandash-debts': nextDebts });
    }
  };

  const handleAddRepayment = (loanId: string, repayment: Omit<Payment, 'id'>) => {
    const nextLoans = loans.map(l => l.id === loanId ? { ...l, repayments: [...l.repayments, { ...repayment, id: crypto.randomUUID() }] } : l);
    handleStateChange({ ...appState, 'loandash-loans': nextLoans });
  };
  
  // --- Form Submissions ---
  const validateDebtForm = (): string[] => {
    const errors: string[] = [];
    const amount = parseFloat(newDebtAmount);
    
    if (!newDebtName.trim()) errors.push('Lender name is required.');
    if (isNaN(amount) || amount <= 0) errors.push('Total Amount must be a positive number.');
    if (!newDebtStartDate) errors.push('Date Taken is required.');
    if (!newDebtDueDate) errors.push('Return Date is required.');
    if (newDebtStartDate && newDebtDueDate && new Date(newDebtDueDate) < new Date(newDebtStartDate)) {
        errors.push('Return Date cannot be before Date Taken.');
    }
    if (newDebtType === DebtType.Loan && newDebtInterestRate) {
        const rate = parseFloat(newDebtInterestRate);
        if (isNaN(rate) || rate < 0) {
            errors.push('Interest Rate must be a valid number (0 or greater).');
        }
    }
    return errors;
  }

  const handleDebtFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateDebtForm();
    if (validationErrors.length > 0) {
      setFormErrors(validationErrors);
      return;
    }
    
    const amount = parseFloat(newDebtAmount);
    const interestRate = newDebtType === DebtType.Loan && newDebtInterestRate ? parseFloat(newDebtInterestRate) : undefined;
    const debtData = { 
      name: newDebtName, totalAmount: amount, type: newDebtType,
      startDate: new Date(newDebtStartDate).toISOString(), dueDate: new Date(newDebtDueDate).toISOString(),
      description: newDebtDescription, interestRate: interestRate,
      isRecurring: newDebtType === DebtType.Loan ? false : newDebtIsRecurring,
    };

    let nextState: AppState;
    if (editingDebtId) {
      const nextDebts = debts.map(d => d.id === editingDebtId ? { ...d, ...debtData } : d);
      nextState = { ...appState, 'loandash-debts': nextDebts };
    } else {
      const newDebt: Debt = { ...debtData, id: crypto.randomUUID(), payments: [], status: 'active' };
      nextState = { ...appState, 'loandash-debts': [...debts, newDebt] };
    }
    
    const success = await handleStateChange(nextState);
    if (success) resetAndCloseForms();
  };

  const validateLoanForm = (): string[] => {
    const errors: string[] = [];
    const amount = parseFloat(newLoanAmount);

    if (!newLoanName.trim()) errors.push('Borrower name is required.');
    if (isNaN(amount) || amount <= 0) errors.push('Total Amount must be a positive number.');
    if (!newLoanStartDate) errors.push('Date Loaned is required.');
    if (!newLoanDueDate) errors.push('Repayment Date is required.');
    if (newLoanStartDate && newLoanDueDate && new Date(newLoanDueDate) < new Date(newLoanStartDate)) {
        errors.push('Repayment Date cannot be before Date Loaned.');
    }
    return errors;
  }

  const handleLoanFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateLoanForm();
    if (validationErrors.length > 0) {
        setFormErrors(validationErrors);
        return;
    }

    const amount = parseFloat(newLoanAmount);
    const loanData = { 
      name: newLoanName, totalAmount: amount,
      startDate: new Date(newLoanStartDate).toISOString(), dueDate: new Date(newLoanDueDate).toISOString(),
      description: newLoanDescription,
    };
    
    let nextState: AppState;
    if (editingLoanId) {
      const nextLoans = loans.map(l => l.id === editingLoanId ? { ...l, ...loanData } : l);
      nextState = { ...appState, 'loandash-loans': nextLoans };
    } else {
      const newLoan: Loan = { ...loanData, id: crypto.randomUUID(), repayments: [], status: 'active' };
      nextState = { ...appState, 'loandash-loans': [...loans, newLoan] };
    }
    
    const success = await handleStateChange(nextState);
    if (success) resetAndCloseForms();
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
          PaymentCount: debt.payments.length
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
          PaymentCount: loan.repayments.length
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
          PaymentCount: debt.payments.length
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
          PaymentCount: loan.repayments.length
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
      case 'dashboard': return <Dashboard debts={debtsWithInterest} loans={loans} archivedDebts={archivedDebts} archivedLoans={archivedLoans} />;
      case 'debts': return <DebtsComponent debts={filteredDebts} onAddPayment={handleAddPayment} onArchiveDebt={handleArchiveDebt} onEdit={(debtId) => {
        const debt = debts.find(d => d.id === debtId);
        openDebtModal(debt || null);
      }} />;
      case 'loans': return <LoansComponent loans={filteredLoans} onAddRepayment={handleAddRepayment} onArchiveLoan={handleArchiveLoan} onEdit={(loanId) => {
        const loan = loans.find(l => l.id === loanId);
        openLoanModal(loan || null);
      }} />;
      case 'archive': return <ArchiveComponent archivedDebts={filteredArchivedDebts} archivedLoans={filteredArchivedLoans} onDeleteDebt={handleDeleteArchivedDebt} onDeleteLoan={handleDeleteArchivedLoan} />
      default: return <Dashboard debts={debtsWithInterest} loans={loans} archivedDebts={archivedDebts} archivedLoans={archivedLoans} />;
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
            <input type="number" id="debtAmount" value={newDebtAmount} onChange={e => setNewDebtAmount(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="0.00 DH" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="debtStartDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date Taken</label>
              <input type="date" id="debtStartDate" value={newDebtStartDate} onChange={e => setNewDebtStartDate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="debtDueDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Return Date</label>
              <input type="date" id="debtDueDate" value={newDebtDueDate} onChange={e => setNewDebtDueDate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="debtType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
            <select id="debtType" value={newDebtType} onChange={e => { const type = e.target.value as DebtType; setNewDebtType(type); if (type === DebtType.Loan) setNewDebtIsRecurring(false); }} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
              <option>{DebtType.Friend}</option>
              <option>{DebtType.Loan}</option>
            </select>
          </div>
          {newDebtType === DebtType.Loan && (
            <div>
              <label htmlFor="debtInterestRate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Annual Interest Rate (%) <span className="text-xs text-slate-500">(Optional)</span></label>
              <input type="number" id="debtInterestRate" value={newDebtInterestRate} onChange={e => setNewDebtInterestRate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g., 5.5" />
            </div>
          )}
          <div>
            <label htmlFor="debtDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description <span className="text-xs text-slate-500">(Optional)</span></label>
            <textarea id="debtDescription" rows={3} value={newDebtDescription} onChange={e => setNewDebtDescription(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="e.g., For concert tickets, to be paid back after next payday." />
          </div>
          {newDebtType !== DebtType.Loan && (
            <div className="flex items-center">
              <input id="isRecurring" type="checkbox" checked={newDebtIsRecurring} onChange={e => setNewDebtIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <label htmlFor="isRecurring" className="ml-2 block text-sm text-slate-900 dark:text-slate-200">This is a recurring monthly debt</label>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={resetAndCloseForms} className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors">{editingDebtId ? 'Save Changes' : 'Add Debt v11'}</button>
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
            <input type="number" id="loanAmount" value={newLoanAmount} onChange={e => setNewLoanAmount(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="0.00 DH" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="loanStartDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date Loaned</label>
              <input type="date" id="loanStartDate" value={newLoanStartDate} onChange={e => setNewLoanStartDate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="loanDueDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Repayment Date</label>
              <input type="date" id="loanDueDate" value={newLoanDueDate} onChange={e => setNewLoanDueDate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="loanDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description <span className="text-xs text-slate-500">(Optional)</span></label>
            <textarea id="loanDescription" rows={3} value={newLoanDescription} onChange={e => setNewLoanDescription(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="e.g., For their car repair." />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={resetAndCloseForms} className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors">{editingLoanId ? 'Save Changes' : 'Add Loan'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Settings">
        <div className="space-y-6">
            <div>
                <label htmlFor="autoArchive" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Auto-Archive Completed Items</label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Automatically move paid-off items to the archive after a set time.</p>
                <select id="autoArchive" value={autoArchiveSetting} onChange={e => handleAutoArchiveChange(e.target.value as AutoArchiveSetting)} className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="never">Never</option>
                    <option value="immediate">Immediately</option>
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
