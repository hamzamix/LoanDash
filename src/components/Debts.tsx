



import React, { useState } from 'react';
import type { Debt, Payment } from '../types';
import { DebtType, PaymentAutomationType } from '../types';
import Card from './common/Card';
import ProgressBar from './common/ProgressBar';
import { ChevronDownIcon, PencilIcon } from './common/Icons';
import { PaymentModal } from './PaymentModal';
import { formatCurrency } from '../utils/currency';

type DebtWithInterest = Debt & { accruedInterest: number };

interface DebtsProps {
  debts: DebtWithInterest[];
  defaultCurrency: string;
  onAddPayment: (debtId: string, payment: Omit<Payment, 'id'>) => void;
  onUpdatePayment: (debtId: string, paymentId: string, payment: Omit<Payment, 'id'>) => void;
  onArchiveDebt: (debtId: string, status: 'completed' | 'defaulted') => void;
  onEdit: (debtId: string) => void;
}

const DebtItem: React.FC<{ debt: DebtWithInterest; defaultCurrency: string; onAddPayment: DebtsProps['onAddPayment']; onUpdatePayment: DebtsProps['onUpdatePayment']; onArchiveDebt: DebtsProps['onArchiveDebt']; onEdit: DebtsProps['onEdit'] }> = ({ debt, defaultCurrency, onAddPayment, onUpdatePayment, onArchiveDebt, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>(undefined);

  const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOwedWithInterest = debt.totalAmount + debt.accruedInterest;
  const remaining = totalOwedWithInterest - totalPaid;
  const progress = (totalOwedWithInterest) > 0 ? (totalPaid / totalOwedWithInterest) * 100 : 100;
  const isPaidOff = remaining <= 0.01;
  const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date() && !isPaidOff;

  const handleAddPayment = (payment: Omit<Payment, 'id'>) => {
    onAddPayment(debt.id, payment);
    setShowPaymentModal(false);
    setEditingPayment(undefined);
  };

  const handleUpdatePayment = (paymentId: string, payment: Omit<Payment, 'id'>) => {
    onUpdatePayment(debt.id, paymentId, payment);
    setShowPaymentModal(false);
    setEditingPayment(undefined);
  };
  
  const handleArchive = () => {
    onArchiveDebt(debt.id, 'completed');
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(debt.id);
  };

  const handleEditPayment = (payment: Payment, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPayment(payment);
    setShowPaymentModal(true);
  };

  const handleExpansionToggle = () => {
    setExpanded(!expanded);
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setEditingPayment(undefined);
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
          {/* Display next payment info for auto-payment and recurring debts */}
          {debt.nextPaymentDate && debt.suggestedPaymentAmount && !isPaidOff && (
            <div className="mt-1">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Next Payment: {new Date(debt.nextPaymentDate).toLocaleDateString()} 
                <span className="ml-1 font-semibold">
                  ({formatCurrency(debt.suggestedPaymentAmount, defaultCurrency)})
                </span>
              </p>
              {debt.paymentAutomation === PaymentAutomationType.Auto && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  🤖 Auto-payment enabled
                </p>
              )}
              {debt.isRecurring && debt.recurrenceSettings && (
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  <p>🔄 Recurring ({debt.recurrenceSettings.type})</p>
                  {debt.recurrenceSettings.firstPaymentDate && (
                    <p className="mt-0.5">
                      📅 Started: {new Date(debt.recurrenceSettings.firstPaymentDate).toLocaleDateString()}
                    </p>
                  )}
                  {debt.recurrenceSettings.paymentAmount && (
                    <p className="mt-0.5">
                      💰 Amount: {formatCurrency(debt.recurrenceSettings.paymentAmount, defaultCurrency)} per payment
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
              {debt.type === DebtType.Loan && debt.accruedInterest > 0 && !isPaidOff ? (
                <p className="text-xs text-slate-500">(includes {formatCurrency(debt.accruedInterest, defaultCurrency)} interest)</p>
              ) : (
                <p className="text-xs text-slate-500">of {formatCurrency(debt.totalAmount, defaultCurrency)}</p>
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
                      onClick={(e) => handleEditPayment(p, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                      aria-label="Edit payment"
                    >
                      <PencilIcon className="w-3 h-3" />
                    </button>
                  </div>
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
            <div className="mt-4">
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary-700 transition-colors"
              >
                Record Payment
              </button>
            </div>
          )}
        </div>
      )}
      
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={handleCloseModal}
        onSubmit={handleAddPayment}
        onUpdate={handleUpdatePayment}
        maxAmount={remaining}
        currency={defaultCurrency}
        itemType="debt"
        itemName={debt.name}
        editingPayment={editingPayment}
      />
    </Card>
  );
};

const Debts: React.FC<DebtsProps> = ({ debts, defaultCurrency, onAddPayment, onUpdatePayment, onArchiveDebt, onEdit }) => {
  return (
    <div>
      {debts.length > 0 ? (
        debts.map(debt => <DebtItem key={debt.id} debt={debt} defaultCurrency={defaultCurrency} onAddPayment={onAddPayment} onUpdatePayment={onUpdatePayment} onArchiveDebt={onArchiveDebt} onEdit={onEdit} />)
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