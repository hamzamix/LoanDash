



import React, { useState } from 'react';
import type { Debt, Payment } from '../types';
import { DebtType } from '../types';
import Card from './common/Card';
import ProgressBar from './common/ProgressBar';
import { ChevronDownIcon, PencilIcon } from './common/Icons';

type DebtWithInterest = Debt & { accruedInterest: number };

interface DebtsProps {
  debts: DebtWithInterest[];
  onAddPayment: (debtId: string, payment: Omit<Payment, 'id'>) => void;
  onArchiveDebt: (debtId: string, status: 'completed' | 'defaulted') => void;
  onEdit: (debtId: string) => void;
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

const DebtItem: React.FC<{ debt: DebtWithInterest; onAddPayment: DebtsProps['onAddPayment']; onArchiveDebt: DebtsProps['onArchiveDebt']; onEdit: DebtsProps['onEdit'] }> = ({ debt, onAddPayment, onArchiveDebt, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOwedWithInterest = debt.totalAmount + debt.accruedInterest;
  const remaining = totalOwedWithInterest - totalPaid;
  const progress = (totalOwedWithInterest) > 0 ? (totalPaid / totalOwedWithInterest) * 100 : 100;
  const isPaidOff = remaining <= 0.01;
  const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date() && !isPaidOff;

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!isNaN(amount) && amount > 0 && paymentDate) {
      onAddPayment(debt.id, { amount, date: new Date(paymentDate).toISOString() });
      setPaymentAmount('');
    }
  };
  
  const handleArchive = () => {
    onArchiveDebt(debt.id, 'completed');
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(debt.id);
  };

  const handleExpansionToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Card className="mb-4">
      <div className="flex justify-between items-center cursor-pointer" onClick={handleExpansionToggle}>
        <div>
          <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{debt.name}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">{debt.type}</p>
          {debt.dueDate && !isPaidOff && (
            <p className={`text-xs mt-1 ${isOverdue ? 'text-red-500 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                Due: {new Date(debt.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`font-semibold text-lg ${isPaidOff ? 'text-green-500' : 'text-slate-800 dark:text-slate-100'}`}>{currencyFormatter.format(Math.max(0, remaining))}</p>
              {debt.type === DebtType.Loan && debt.accruedInterest > 0 && !isPaidOff ? (
                <p className="text-xs text-slate-500">(includes {currencyFormatter.format(debt.accruedInterest)} interest)</p>
              ) : (
                <p className="text-xs text-slate-500">of {currencyFormatter.format(debt.totalAmount)}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
                {!isPaidOff && (
                    <button
                        onClick={handleEdit}
                        className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        aria-label="Edit debt"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                )}
                <ChevronDownIcon className={`w-5 h-5 text-slate-500 transform transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </div>
        </div>
      </div>
      <div className="mt-2">
        <ProgressBar progress={progress} colorClassName={isOverdue ? "bg-red-500" : "bg-primary-600 dark:bg-primary-500"} />
      </div>
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          {debt.description && (
            <div className="mb-4">
              <h5 className="font-semibold mb-1 text-slate-700 dark:text-slate-200">Description</h5>
              <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md whitespace-pre-wrap">{debt.description}</p>
            </div>
          )}
          <h5 className="font-semibold mb-2 text-slate-700 dark:text-slate-200">Payment History</h5>
          {debt.payments.length > 0 ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {debt.payments.map(p => (
                <li key={p.id} className="flex justify-between items-center text-sm bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md">
                  <span>{new Date(p.date).toLocaleDateString()}</span>
                  <span className="font-medium">{currencyFormatter.format(p.amount)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">No payments made yet.</p>}
          
          {isPaidOff ? (
             <div className="mt-4 text-center">
                <p className="text-lg font-semibold text-green-500">🎉 Paid Off!</p>
                <p className="text-sm text-slate-500 mb-4">You can now archive this record.</p>
                <button 
                    onClick={handleArchive}
                    className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                >
                    Archive Record
                </button>
            </div>
          ) : (
            <form onSubmit={handleAddPayment} className="mt-4 flex flex-wrap items-center gap-2">
                <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
                />
                <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Payment amount"
                className="flex-grow bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
                />
                <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary-700 transition-colors">
                Log Payment
                </button>
            </form>
          )}
        </div>
      )}
    </Card>
  );
};

const Debts: React.FC<DebtsProps> = ({ debts, onAddPayment, onArchiveDebt, onEdit }) => {
  return (
    <div>
      {debts.length > 0 ? (
        debts.map(debt => <DebtItem key={debt.id} debt={debt} onAddPayment={onAddPayment} onArchiveDebt={onArchiveDebt} onEdit={onEdit} />)
      ) : (
        <Card className="text-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">No Debts Found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Click "Add New Debt" to track money you owe.</p>
        </Card>
      )}
    </div>
  );
};

export default Debts;