import React from 'react';
import { AmortizationEntry } from '../types';
import { formatCurrency } from '../utils/currency';

interface AmortizationScheduleProps {
  schedule: AmortizationEntry[];
  currency: string;
  className?: string;
}

const AmortizationSchedule: React.FC<AmortizationScheduleProps> = ({
  schedule,
  currency,
  className = ''
}) => {
  if (schedule.length === 0) {
    return (
      <div className={`text-center py-8 text-slate-500 dark:text-slate-400 ${className}`}>
        No amortization schedule available
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Amortization Schedule
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Payment breakdown showing principal and interest over time
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Payment #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Payment Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Principal
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Interest
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Remaining Balance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {schedule.map((entry) => (
              <tr key={entry.paymentNumber} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                  {entry.paymentNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                  {new Date(entry.paymentDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 dark:text-slate-100">
                  {formatCurrency(entry.paymentAmount, currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">
                  {formatCurrency(entry.principalAmount, currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 dark:text-orange-400">
                  {formatCurrency(entry.interestAmount, currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 dark:text-slate-100">
                  {formatCurrency(entry.remainingBalance, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-600 dark:text-slate-400">Total Payments:</span>
            <span className="ml-2 font-semibold text-slate-900 dark:text-slate-100">
              {formatCurrency(
                schedule.reduce((sum, entry) => sum + entry.paymentAmount, 0),
                currency
              )}
            </span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Total Principal:</span>
            <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(
                schedule.reduce((sum, entry) => sum + entry.principalAmount, 0),
                currency
              )}
            </span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Total Interest:</span>
            <span className="ml-2 font-semibold text-orange-600 dark:text-orange-400">
              {formatCurrency(
                schedule.reduce((sum, entry) => sum + entry.interestAmount, 0),
                currency
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmortizationSchedule;

