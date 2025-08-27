import React, { useState, useEffect } from 'react';
import { Payment } from '../types';
import { formatCurrency } from '../utils/currency';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payment: Omit<Payment, 'id'>) => void;
  onUpdate?: (paymentId: string, payment: Omit<Payment, 'id'>) => void;
  maxAmount: number;
  currency: string;
  itemType: 'debt' | 'loan';
  itemName: string;
  editingPayment?: Payment; // New prop for editing existing payment
}

const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'Check',
  'Mobile Payment',
  'Online Banking',
  'Other'
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  maxAmount,
  currency,
  itemType,
  itemName,
  editingPayment
}) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [isPartial, setIsPartial] = useState(false);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const isEditing = !!editingPayment;

  // Populate form when editing
  useEffect(() => {
    if (editingPayment) {
      setAmount(editingPayment.amount.toString());
      setMethod(editingPayment.method || 'Cash');
      setIsPartial(editingPayment.isPartial || false);
      setNotes(editingPayment.notes || '');
      setDate(new Date(editingPayment.date).toISOString().split('T')[0]);
    } else {
      // Reset form for new payment
      setAmount('');
      setMethod('Cash');
      setIsPartial(false);
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [editingPayment, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (!date) {
      alert('Please select a payment date');
      return;
    }

    const paymentDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (paymentDate > today) {
      alert('Payment date cannot be in the future');
      return;
    }

    // For editing, we need to consider the current payment amount in the max calculation
    const effectiveMaxAmount = isEditing ? maxAmount + editingPayment!.amount : maxAmount;
    
    if (paymentAmount > effectiveMaxAmount) {
      alert(`Payment amount cannot exceed ${formatCurrency(effectiveMaxAmount, currency)}`);
      return;
    }

    const payment: Omit<Payment, 'id'> = {
      amount: paymentAmount,
      date: new Date(date).toISOString(),
      method,
      isPartial: isPartial || paymentAmount < effectiveMaxAmount,
      notes: notes.trim() || undefined
    };

    if (isEditing && onUpdate) {
      onUpdate(editingPayment!.id, payment);
    } else {
      onSubmit(payment);
    }
    
    onClose(); // Close modal after successful submission
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    
    const numValue = parseFloat(value);
    const effectiveMaxAmount = isEditing ? maxAmount + editingPayment!.amount : maxAmount;
    
    if (!isNaN(numValue) && numValue < effectiveMaxAmount) {
      setIsPartial(true);
    } else if (!isNaN(numValue) && numValue >= effectiveMaxAmount) {
      setIsPartial(false);
    }
  };

  if (!isOpen) return null;

  const effectiveMaxAmount = isEditing ? maxAmount + editingPayment!.amount : maxAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {isEditing ? 'Edit' : 'Record'} {itemType === 'debt' ? 'Payment' : 'Repayment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-700 rounded">
          <p className="text-sm text-gray-300">
            {itemType === 'debt' ? 'Paying to' : 'Receiving from'}: <span className="text-white font-medium">{itemName}</span>
          </p>
          <p className="text-sm text-gray-300">
            {isEditing ? 'Available amount' : 'Outstanding amount'}: <span className="text-white font-medium">{formatCurrency(effectiveMaxAmount, currency)}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Payment Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={effectiveMaxAmount}
              value={amount}
              onChange={handleAmountChange}
              placeholder={`0.00 ${currency}`}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Payment Method *
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {PAYMENT_METHODS.map((paymentMethod) => (
                <option key={paymentMethod} value={paymentMethod}>
                  {paymentMethod}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPartial"
              checked={isPartial}
              onChange={(e) => setIsPartial(e.target.checked)}
              className="mr-2 rounded"
            />
            <label htmlFor="isPartial" className="text-sm text-gray-300">
              This is a partial payment
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this payment..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {isEditing ? 'Update Payment' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

