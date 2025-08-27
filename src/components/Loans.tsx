



import React, { useState } from 'react';
import type { Loan, Payment } from '../types';
import Card from './common/Card';
import ProgressBar from './common/ProgressBar';
import { ChevronDownIcon, PencilIcon } from './common/Icons';
import { PaymentModal } from './PaymentModal';
import { formatCurrency } from '../utils/currency';

interface LoansProps {
  loans: Loan[];
  defaultCurrency: string;
  onAddRepayment: (loanId: string, repayment: Omit<Payment, 'id'>) => void;
  onUpdateRepayment: (loanId: string, repaymentId: string, repayment: Omit<Payment, 'id'>) => void;
  onArchiveLoan: (loanId: string, status: 'completed' | 'defaulted') => void;
  onEdit: (loanId: string) => void;
}

const LoanItem: React.FC<{ loan: Loan; defaultCurrency: string; onAddRepayment: LoansProps['onAddRepayment']; onUpdateRepayment: LoansProps['onUpdateRepayment']; onArchiveLoan: LoansProps['onArchiveLoan']; onEdit: LoansProps['onEdit'] }> = ({ loan, defaultCurrency, onAddRepayment, onUpdateRepayment, onArchiveLoan, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingRepayment, setEditingRepayment] = useState<Payment | undefined>(undefined);

  const totalRepaid = loan.repayments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = loan.totalAmount - totalRepaid;
  const progress = loan.totalAmount > 0 ? (totalRepaid / loan.totalAmount) * 100 : 100;
  const isPaidOff = remaining <= 0;
  
  // For recurring loans, use nextPaymentDate if available, otherwise use dueDate
  const isOverdue = (() => {
    if (isPaidOff) return false;
    
    if (loan.isRecurring && loan.nextPaymentDate) {
      return new Date(loan.nextPaymentDate) < new Date();
    }
    
    return loan.dueDate && new Date(loan.dueDate) < new Date();
  })();

  const handleAddRepayment = (payment: Omit<Payment, 'id'>) => {
    onAddRepayment(loan.id, payment);
    setShowPaymentModal(false);
    setEditingRepayment(undefined);
  };

  const handleUpdateRepayment = (repaymentId: string, payment: Omit<Payment, 'id'>) => {
    onUpdateRepayment(loan.id, repaymentId, payment);
    setShowPaymentModal(false);
    setEditingRepayment(undefined);
  };
  
  const handleArchive = (status: 'completed' | 'defaulted') => {
    onArchiveLoan(loan.id, status);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(loan.id);
  };

  const handleEditRepayment = (repayment: Payment, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRepayment(repayment);
    setShowPaymentModal(true);
  };

  const handleExpansionToggle = () => {
    setExpanded(!expanded);
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setEditingRepayment(undefined);
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
          {/* Display next payment info for recurring loans */}
          {loan.nextPaymentDate && loan.suggestedPaymentAmount && !isPaidOff && (
            <div className="mt-1">
              <p className="text-xs text-green-600 dark:text-green-400">
                Next Payment: {new Date(loan.nextPaymentDate).toLocaleDateString()} 
                <span className="ml-1 font-semibold">
                  ({formatCurrency(loan.suggestedPaymentAmount, defaultCurrency)})
                </span>
              </p>
              {loan.isRecurring && loan.recurrenceSettings && (
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  <p>🔄 Recurring ({loan.recurrenceSettings.type})</p>
                  {loan.recurrenceSettings.firstPaymentDate && (
                    <p className="mt-0.5">
                      📅 Expected: {new Date(loan.recurrenceSettings.firstPaymentDate).toLocaleDateString()}
                    </p>
                  )}
                  {loan.recurrenceSettings.paymentAmount && (
                    <p className="mt-0.5">
                      💰 Amount: {formatCurrency(loan.recurrenceSettings.paymentAmount, defaultCurrency)} per payment
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`font-semibold text-lg ${isPaidOff ? 'text-green-500' : 'text-slate-800 dark:text-slate-100'}`}>{formatCurrency(Math.max(0, remaining), defaultCurrency)}</p>
              <p className="text-xs text-slate-500">of {formatCurrency(loan.totalAmount, defaultCurrency)}</p>
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
                <li key={p.id} className="flex justify-between items-center text-sm bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md group">
                  <div>
                    <span>{new Date(p.date).toLocaleDateString()}</span>
                    {p.method && <span className="ml-2 text-xs text-slate-500">({p.method})</span>}
                    {p.isPartial && <span className="ml-2 text-xs text-orange-500">(Partial)</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="font-medium">{formatCurrency(p.amount, defaultCurrency)}</span>
                      {p.notes && <div className="text-xs text-slate-500 mt-1">{p.notes}</div>}
                    </div>
                    <button
                      onClick={(e) => handleEditRepayment(p, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                      aria-label="Edit repayment"
                    >
                      <PencilIcon className="w-3 h-3" />
                    </button>
                  </div>
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
              <div className="mt-4">
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  Record Repayment
                </button>
              </div>
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
      
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={handleCloseModal}
        onSubmit={handleAddRepayment}
        onUpdate={handleUpdateRepayment}
        maxAmount={remaining}
        currency={defaultCurrency}
        itemType="loan"
        itemName={loan.name}
        editingPayment={editingRepayment}
      />
    </Card>
  );
};

const Loans: React.FC<LoansProps> = ({ loans, defaultCurrency, onAddRepayment, onUpdateRepayment, onArchiveLoan, onEdit }) => {
  return (
    <div>
      {loans.length > 0 ? (
        loans.map(loan => <LoanItem key={loan.id} loan={loan} defaultCurrency={defaultCurrency} onAddRepayment={onAddRepayment} onUpdateRepayment={onUpdateRepayment} onArchiveLoan={onArchiveLoan} onEdit={onEdit} />)
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