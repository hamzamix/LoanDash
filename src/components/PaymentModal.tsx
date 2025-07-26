import React, { useState } from 'react';
import { Payment } from '../types';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../utils/currency';
import Modal from './common/Modal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payment: Omit<Payment, 'id'>) => void;
  title: string;
  remainingAmount: number;
  currency: string;
}

const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'Check',
  'Mobile Payment',
  'Other'
];

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  remainingAmount,
  currency
}) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [isPartial, setIsPartial] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors: string[] = [];
    const paymentAmount = parseFloat(amount);
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      validationErrors.push('Payment amount must be a positive number.');
    }
    
    if (paymentAmount > remainingAmount && !isPartial) {
      validationErrors.push('Payment amount cannot exceed the remaining balance.');
    }
    
    if (!date) {
      validationErrors.push('Payment date is required.');
    }
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    onSubmit({
      amount: paymentAmount,
      date: new Date(date).toISOString(),
      method,
      notes: notes.trim() || undefined,
      isPartial: paymentAmount < remainingAmount
    });
    
    // Reset form
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setMethod('Cash');
    setNotes('');
    setIsPartial(false);
    setErrors([]);
    onClose();
  };

  const handleClose = () => {
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setMethod('Cash');
    setNotes('');
    setIsPartial(false);
    setErrors([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.length > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md space-y-1" role="alert">
            <p className="font-bold">Please correct the following errors:</p>
            <ul className="list-disc list-inside text-sm">
              {errors.map((error, i) => <li key={i}>{error}</li>)}
            </ul>
          </div>
        )}
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Remaining Balance:</strong> {formatCurrency(remainingAmount, currency)}
          </p>
        </div>

        <div>
          <label htmlFor="paymentAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Payment Amount
          </label>
          <input
            type="number"
            id="paymentAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder={`0.00 ${currency}`}
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label htmlFor="paymentDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Payment Date
          </label>
          <input
            type="date"
            id="paymentDate"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Payment Method
          </label>
          <select
            id="paymentMethod"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            {PAYMENT_METHODS.map(methodOption => (
              <option key={methodOption} value={methodOption}>{methodOption}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="paymentNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Notes <span className="text-xs text-slate-500">(Optional)</span>
          </label>
          <textarea
            id="paymentNotes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Additional notes about this payment..."
          />
        </div>

        <div className="flex items-center">
          <input
            id="isPartialPayment"
            type="checkbox"
            checked={isPartial}
            onChange={(e) => setIsPartial(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="isPartialPayment" className="ml-2 block text-sm text-slate-900 dark:text-slate-200">
            This is a partial payment
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            Add Payment
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentModal;

