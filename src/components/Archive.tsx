



import React, { useState } from 'react';
import type { Debt, Loan } from '../types';
import Card from './common/Card';
import { ChevronDownIcon, ExclamationTriangleIcon } from './common/Icons';

interface ArchiveProps {
  archivedDebts: Debt[];
  archivedLoans: Loan[];
  onDeleteDebt: (debtId: string) => void;
  onDeleteLoan: (loanId: string) => void;
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

const ArchivedItem: React.FC<{item: Debt | Loan, onDelete: (id: string) => void, type: 'Debt' | 'Loan'}> = ({item, onDelete, type}) => {
    const [expanded, setExpanded] = useState(false);

    const payments = 'payments' in item ? item.payments : item.repayments;
    const lastPaymentDate = payments?.slice(-1)[0]?.date;
    const completionDate = lastPaymentDate ? new Date(lastPaymentDate) : (item.dueDate ? new Date(item.dueDate) : new Date());

    const handleExpansionToggle = () => {
        setExpanded(!expanded);
    };
    
    const handleDelete = () => {
        onDelete(item.id);
    }

    const StatusBadge = () => {
        if (item.status === 'completed') {
            return <span className="text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 px-2 py-1 rounded-full">Completed</span>;
        }
        if (item.status === 'defaulted') {
            return <span className="flex items-center gap-1 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-1 rounded-full"><ExclamationTriangleIcon className="w-3.5 h-3.5" />Defaulted</span>;
        }
        return null;
    }

    return (
        <Card className="mb-4 opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex justify-between items-center cursor-pointer" onClick={handleExpansionToggle}>
                <div>
                    <div className="flex items-center gap-3">
                        <h4 className="font-bold text-lg text-slate-700 dark:text-slate-300">{item.name}</h4>
                        <StatusBadge />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {type === 'Debt' ? `Debt of ${currencyFormatter.format(item.totalAmount)}` : `Loan of ${currencyFormatter.format(item.totalAmount)}`}
                    </p>
                     <p className="text-xs text-slate-400 mt-1">
                        Archived on: {completionDate.toLocaleDateString()}
                    </p>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-slate-500 transform transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </div>

            {expanded && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    {item.description && (
                        <div className="mb-4">
                            <h5 className="font-semibold mb-1 text-slate-700 dark:text-slate-200">Description</h5>
                            <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md whitespace-pre-wrap">{item.description}</p>
                        </div>
                    )}
                    <h5 className="font-semibold mb-2 text-slate-700 dark:text-slate-200">{type === 'Debt' ? 'Payment History' : 'Repayment History'}</h5>
                    {payments.length > 0 ? (
                        <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {payments.map(p => (
                                <li key={p.id} className="flex justify-between items-center text-sm bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md">
                                    <span>{new Date(p.date).toLocaleDateString()}</span>
                                    <span className="font-medium">{currencyFormatter.format(p.amount)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-slate-500">{item.status === 'defaulted' ? 'No payments were made.' : 'No history found.'}</p>}
                    
                    <div className="mt-6 text-center">
                         <button 
                            onClick={handleDelete}
                            className="text-sm bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-semibold py-2 px-4 rounded-md transition-colors"
                        >
                            Delete Permanently
                        </button>
                    </div>
                </div>
            )}
        </Card>
    );
};

const Archive: React.FC<ArchiveProps> = ({ archivedDebts, archivedLoans, onDeleteDebt, onDeleteLoan }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100 border-b pb-2 border-slate-300 dark:border-slate-700">Archived Debts</h2>
        {archivedDebts.length > 0 ? (
          archivedDebts.map(debt => <ArchivedItem key={debt.id} item={debt} onDelete={onDeleteDebt} type="Debt" />)
        ) : (
          <p className="text-slate-500 dark:text-slate-400">No archived debts.</p>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100 border-b pb-2 border-slate-300 dark:border-slate-700">Archived Loans</h2>
        {archivedLoans.length > 0 ? (
          archivedLoans.map(loan => <ArchivedItem key={loan.id} item={loan} onDelete={onDeleteLoan} type="Loan" />)
        ) : (
          <p className="text-slate-500 dark:text-slate-400">No archived loans.</p>
        )}
      </div>
    </div>
  );
};

export default Archive;