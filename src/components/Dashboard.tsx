
import React from 'react';
import type { Debt, Loan } from '../types';
import Card from './common/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../utils/currency';

interface DashboardProps {
  debts: (Debt & { accruedInterest: number })[];
  loans: Loan[];
  archivedDebts: Debt[];
  archivedLoans: Loan[];
  defaultCurrency: string;
}

const Dashboard: React.FC<DashboardProps> = ({ debts, loans, archivedDebts, archivedLoans, defaultCurrency }) => {
    const currencyFormatter = {
        format: (value: number, currency?: string) => {
            const formattedValue = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(value);
            return `${formattedValue} ${currency || defaultCurrency}`;
        }
    };

    const calculateRemainingLoan = (loan: Loan) => {
        const totalRepaid = loan.repayments.reduce((sum, p) => sum + p.amount, 0);
        return loan.totalAmount - totalRepaid;
    };

    const CustomPieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
          return (
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">{`${payload[0].name}`}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <span className='font-medium text-slate-500 dark:text-slate-400'>Remaining: </span>
                {currencyFormatter.format(payload[0].value)}
              </p>
            </div>
          );
        }
        return null;
    };
    const totalOwed = debts.reduce((sum, debt) => {
        const totalPaid = debt.payments.reduce((pSum, p) => pSum + p.amount, 0);
        const remainingPrincipal = debt.totalAmount - totalPaid;
        return sum + remainingPrincipal + debt.accruedInterest;
    }, 0);
    const totalImOwed = loans.reduce((sum, loan) => sum + calculateRemainingLoan(loan), 0);
    
    const allDebts = [...debts, ...archivedDebts];
    const allLoans = [...loans, ...archivedLoans];

    const totalDebtPaid = allDebts.reduce((sum, debt) => sum + debt.payments.reduce((pSum, p) => pSum + p.amount, 0), 0);
    const totalLoanRepaid = allLoans.reduce((sum, loan) => sum + loan.repayments.reduce((pSum, p) => pSum + p.amount, 0), 0);

    const debtPieData = debts
      .map(d => {
        const totalPaid = d.payments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = d.totalAmount - totalPaid + d.accruedInterest;
        return { name: d.name, value: remaining };
      })
      .filter(d => d.value > 0.01);
      
    const loanPieData = loans
      .filter(l => calculateRemainingLoan(l) > 0)
      .map(l => ({ name: l.name, value: calculateRemainingLoan(l) }));
    
    const allTransactions = [
        ...allDebts.flatMap(d => d.payments.map(p => ({ date: p.date, amount: p.amount, type: 'Payment' }))),
        ...allLoans.flatMap(l => l.repayments.map(r => ({ date: r.date, amount: r.amount, type: 'Repayment' })))
    ];
    
    const transactionsByMonth = allTransactions.reduce<Record<string, { Payments: number, Repayments: number }>>((acc, transaction) => {
        const month = new Date(transaction.date).toISOString().slice(0, 7);
        if (!acc[month]) {
            acc[month] = { Payments: 0, Repayments: 0 };
        }
        if (transaction.type === 'Payment') {
            acc[month].Payments += transaction.amount;
        } else {
            acc[month].Repayments += transaction.amount;
        }
        return acc;
    }, {});

    const transactionLineData = Object.entries(transactionsByMonth)
        .map(([month, amounts]) => ({ month: month, Payments: amounts.Payments, Repayments: amounts.Repayments }))
        .sort((a,b) => a.month.localeCompare(b.month));

    const DEBT_PIE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16'];
    const LOAN_PIE_COLORS = ['#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#8b5cf6'];


  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total I Owe</h3>
                <p className="text-3xl font-semibold text-red-500">{currencyFormatter.format(totalOwed, defaultCurrency)}</p>
            </Card>
            <Card>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total I'm Owed</h3>
                <p className="text-3xl font-semibold text-green-500">{currencyFormatter.format(totalImOwed, defaultCurrency)}</p>
            </Card>
            <Card>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Debt Paid</h3>
                <p className="text-3xl font-semibold text-blue-500">{currencyFormatter.format(totalDebtPaid, defaultCurrency)}</p>
            </Card>
             <Card>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Loan Repaid</h3>
                <p className="text-3xl font-semibold text-teal-500">{currencyFormatter.format(totalLoanRepaid, defaultCurrency)}</p>
            </Card>
        </div>

        {/* Upcoming Payments Section */}
        {(() => {
            const upcomingDebtPayments = debts
                .filter(debt => debt.nextPaymentDate && debt.suggestedPaymentAmount && debt.status === 'active')
                .map(debt => ({
                    ...debt,
                    nextPaymentDateObj: new Date(debt.nextPaymentDate!),
                    itemType: 'debt' as const
                }));

            const upcomingLoanPayments = loans
                .filter(loan => loan.nextPaymentDate && loan.suggestedPaymentAmount && loan.status === 'active')
                .map(loan => ({
                    ...loan,
                    nextPaymentDateObj: new Date(loan.nextPaymentDate!),
                    itemType: 'loan' as const
                }));

            const upcomingPayments = [...upcomingDebtPayments, ...upcomingLoanPayments]
                .sort((a, b) => a.nextPaymentDateObj.getTime() - b.nextPaymentDateObj.getTime())
                .slice(0, 8); // Show next 8 upcoming payments

            return upcomingPayments.length > 0 ? (
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Upcoming Payments</h3>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            {upcomingPayments.length} scheduled payment{upcomingPayments.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="space-y-3">
                        {upcomingPayments.map(item => {
                            const isOverdue = item.nextPaymentDateObj < new Date();
                            const isDueToday = item.nextPaymentDateObj.toDateString() === new Date().toDateString();
                            const daysUntilDue = Math.ceil((item.nextPaymentDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            
                            return (
                                <div key={`${item.itemType}-${item.id}`} className={`flex justify-between items-center p-4 rounded-lg border-l-4 ${
                                    isOverdue ? 'bg-red-50 dark:bg-red-900/20 border-l-red-500' :
                                    isDueToday ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-yellow-500' :
                                    daysUntilDue <= 3 ? 'bg-orange-50 dark:bg-orange-900/20 border-l-orange-500' :
                                    'bg-slate-50 dark:bg-slate-700/50 border-l-slate-300 dark:border-l-slate-600'
                                }`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                item.itemType === 'debt' ? (
                                                    (item as any).type === 'Bank Loan' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                                ) : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                            }`}>
                                                {item.itemType === 'debt' ? (item as any).type : 'Loan'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                📅 {item.nextPaymentDateObj.toLocaleDateString()}
                                            </span>
                                            {item.itemType === 'debt' && (item as any).paymentAutomation === 'Auto' && (
                                                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    🤖 Auto-Payment
                                                </span>
                                            )}
                                            {item.isRecurring && item.recurrenceSettings && (
                                                <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    🔄 {item.recurrenceSettings.type.charAt(0).toUpperCase() + item.recurrenceSettings.type.slice(1)}
                                                </span>
                                            )}
                                        </div>
                                        {/* Payment Progress Bar */}
                                        {(() => {
                                            const totalPaid = item.itemType === 'debt' 
                                                ? (item as Debt & { accruedInterest: number }).payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
                                                : (item as Loan).repayments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
                                            const totalOwed = item.totalAmount + (item.itemType === 'debt' ? ((item as Debt & { accruedInterest: number }).accruedInterest || 0) : 0);
                                            const progressPercentage = Math.min((totalPaid / totalOwed) * 100, 100);
                                            
                                            return (
                                                <div className="mt-2">
                                                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                                                        <span>Progress: {formatCurrency(totalPaid, defaultCurrency)} / {formatCurrency(totalOwed, defaultCurrency)}</span>
                                                        <span>{progressPercentage.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                        <div 
                                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                                progressPercentage >= 100 ? 'bg-green-500' :
                                                                progressPercentage >= 75 ? 'bg-blue-500' :
                                                                progressPercentage >= 50 ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                            }`}
                                                            style={{ width: `${progressPercentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                                            {formatCurrency(item.suggestedPaymentAmount!, defaultCurrency)}
                                        </p>
                                        <p className={`text-xs font-medium ${
                                            isOverdue ? 'text-red-600 dark:text-red-400' :
                                            isDueToday ? 'text-yellow-600 dark:text-yellow-400' :
                                            daysUntilDue <= 3 ? 'text-orange-600 dark:text-orange-400' :
                                            'text-slate-500 dark:text-slate-400'
                                        }`}>
                                            {isOverdue ? `⚠️ ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue` : 
                                             isDueToday ? '🔔 Due Today' :
                                             daysUntilDue <= 3 ? `⏰ Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}` :
                                             `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Summary Statistics */}
                    {(() => {
                        const overduePayments = upcomingPayments.filter(item => item.nextPaymentDateObj < new Date());
                        const dueTodayPayments = upcomingPayments.filter(item => item.nextPaymentDateObj.toDateString() === new Date().toDateString());
                        const totalUpcomingAmount = upcomingPayments.reduce((sum, item) => sum + (item.suggestedPaymentAmount || 0), 0);
                        
                        return (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-red-500">{overduePayments.length}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Overdue</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-yellow-500">{dueTodayPayments.length}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Due Today</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-blue-500">{currencyFormatter.format(totalUpcomingAmount, defaultCurrency)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Due</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </Card>
            ) : null;
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Debt Breakdown</h3>
                {debtPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={debtPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {debtPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={DEBT_PIE_COLORS[index % DEBT_PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.15)' }} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
                ) : <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-10">No outstanding debts to show.</p>}
            </Card>
            <Card>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Loan Breakdown</h3>
                {loanPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={loanPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {loanPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={LOAN_PIE_COLORS[index % LOAN_PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.15)' }} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
                ) : <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-10">No outstanding loans to show.</p>}
            </Card>
        </div>
        <Card>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Financial Activity Over Time</h3>
        {transactionLineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
            <LineChart data={transactionLineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" strokeOpacity={0.5} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(val) => currencyFormatter.format(val as number, defaultCurrency)} />
                <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background-card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} 
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value) => currencyFormatter.format(value as number, defaultCurrency)}
                />
                <Legend />
                <Line type="monotone" dataKey="Payments" name="Debt Payments" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Repayments" name="Loan Repayments" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
            </ResponsiveContainer>
        ) : <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-10">No financial data available. Add a transaction to see your progress.</p>}
    </Card>
    </div>
  );
};

export default Dashboard;