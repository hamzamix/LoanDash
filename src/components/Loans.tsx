



import React, { useState } from 'react';
import type { Loan, Payment } from '../types';
import Card from './common/Card';
import ProgressBar from './common/ProgressBar';
import { ChevronDownIcon, PencilIcon } from './common/Icons';

interface LoansProps {
  loans: Loan[];
  onAddRepayment: (loanId: string, repayment: Omit<Payment, 'id'>) => void;
  onArchiveLoan: (loanId: string, status: 'completed' | 'defaulted') => void;
  onEdit: (loanId: string) => void;
}

const currencyFormatter = {
    format: (value: number) => {
        const formattedValue = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
        return `${formattedValue} DH`;
    }
};

const LoanItem: React.FC<{ loan: Loan; onAddRepayment: LoansProps['onAddRepayment']; onArchiveLoan: LoansProps['onArchiveLoan']; onEdit: LoansProps['onEdit'] }> = ({ loan, onAddRepayment, onArchiveLoan, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentDate, setRepaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const totalRepaid = loan.repayments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = loan.totalAmount - totalRepaid;
  const progress = loan.totalAmount > 0 ? (totalRepaid / loan.totalAmount) * 100 : 100;
  const isPaidOff = remaining <= 0;
  const isOverdue = loan.dueDate && new Date(loan.dueDate) < new Date() && !isPaidOff;

  const handleAddRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(repaymentAmount);
    if (!isNaN(amount) && amount > 0 && repaymentDate) {
      onAddRepayment(loan.id, { amount, date: new Date(repaymentDate).toISOString() });
      setRepaymentAmount('');
    }
  };
  
  const handleArchive = (status: 'completed' | 'defaulted') => {
    onArchiveLoan(loan.id, status);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(loan.id);
  };

  const handleExpansionToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Card className="mb-4">
      <div className="flex justify-between items-center cursor-pointer" onClick={handleExpansionToggle}>
        <div>
          <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{loan.name}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loan to {loan.name}</p>
          {loan.dueDate && !isPaidOff && (
            <p className={`text-xs mt-1 ${isOverdue ? 'text-orange-500 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                Due: {new Date(loan.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`font-semibold text-lg ${isPaidOff ? 'text-green-500' : 'text-slate-800 dark:text-slate-100'}`}>{currencyFormatter.format(Math.max(0, remaining))}</p>
              <p className="text-xs text-slate-500">of {currencyFormatter.format(loan.totalAmount)}</p>
            </div>
            <div className="flex items-center gap-2">
                {!isPaidOff && (
                    <button
                        onClick={handleEdit}
                        className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        aria-label="Edit loan"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                )}
                <ChevronDownIcon className={`w-5 h-5 text-slate-500 transform transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </div>
        </div>
      </div>
      <div className="mt-2">
        <ProgressBar progress={progress} colorClassName={isPaidOff ? "bg-green-500" : (isOverdue ? "bg-orange-500" : "bg-green-600 dark:bg-green-500")} />
      </div>
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          {loan.description && (
            <div className="mb-4">
              <h5 className="font-semibold mb-1 text-slate-700 dark:text-slate-200">Description</h5>
              <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md whitespace-pre-wrap">{loan.description}</p>
            </div>
          )}
          <h5 className="font-semibold mb-2 text-slate-700 dark:text-slate-200">Repayment History</h5>
          {loan.repayments.length > 0 ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {loan.repayments.map(p => (
                <li key={p.id} className="flex justify-between items-center text-sm bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md">
                  <span>{new Date(p.date).toLocaleDateString()}</span>
                  <span className="font-medium">{currencyFormatter.format(p.amount)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">No repayments received yet.</p>}
          
          {isPaidOff ? (
             <div className="mt-4 text-center">
                <p className="text-lg font-semibold text-green-500">✅ Fully Repaid!</p>
                <p className="text-sm text-slate-500 mb-4">You can now archive this record.</p>
                <button 
                    onClick={() => handleArchive('completed')}
                    className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                >
                    Archive Record
                </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleAddRepayment} className="mt-4 flex flex-wrap items-center gap-2">
                  <input
                  type="date"
                  value={repaymentDate}
                  onChange={(e) => setRepaymentDate(e.target.value)}
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                  />
                  <input
                  type="number"
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  placeholder="Repayment amount"
                  className="flex-grow bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                  />
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-green-700 transition-colors">
                  Log Repayment
                  </button>
              </form>
              {isOverdue && (
                  <div className="mt-6 text-center border-t border-slate-200 dark:border-slate-700 pt-4">
                      <p className="text-sm text-orange-500 mb-2">This loan is past its due date.</p>
                      <button 
                          onClick={() => handleArchive('defaulted')}
                          className="bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white font-semibold py-2 px-4 rounded-md transition-colors"
                      >
                          Archive as Unpaid
                      </button>
                  </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
};

const Loans: React.FC<LoansProps> = ({ loans, onAddRepayment, onArchiveLoan, onEdit }) => {
  return (
    <div>
      {loans.length > 0 ? (
        loans.map(loan => <LoanItem key={loan.id} loan={loan} onAddRepayment={onAddRepayment} onArchiveLoan={onArchiveLoan} onEdit={onEdit} />)
      ) : (
        <Card className="text-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">No Loans Found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Click "Add New Loan" to track money others owe you.</p>
        </Card>
      )}
    </div>
  );
};

export default Loans;