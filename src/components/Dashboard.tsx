



import React from 'react';
import type { Debt, Loan } from '../types';
import Card from './common/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  debts: (Debt & { accruedInterest: number })[];
  loans: Loan[];
  archivedDebts: Debt[];
  archivedLoans: Loan[];
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

const calculateRemainingLoan = (loan: Loan) => {
    const totalRepaid = loan.repayments.reduce((sum, p) => sum + p.amount, 0);
    return loan.totalAmount - totalRepaid;
}

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

const Dashboard: React.FC<DashboardProps> = ({ debts, loans, archivedDebts, archivedLoans }) => {
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
                <p className="text-3xl font-semibold text-red-500">{currencyFormatter.format(totalOwed)}</p>
            </Card>
            <Card>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total I'm Owed</h3>
                <p className="text-3xl font-semibold text-green-500">{currencyFormatter.format(totalImOwed)}</p>
            </Card>
            <Card>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Debt Paid</h3>
                <p className="text-3xl font-semibold text-blue-500">{currencyFormatter.format(totalDebtPaid)}</p>
            </Card>
             <Card>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Loan Repaid</h3>
                <p className="text-3xl font-semibold text-teal-500">{currencyFormatter.format(totalLoanRepaid)}</p>
            </Card>
        </div>

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
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(val) => currencyFormatter.format(val as number)} />
                <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background-card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} 
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value) => currencyFormatter.format(value as number)}
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