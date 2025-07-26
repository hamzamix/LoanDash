import { AmortizationEntry } from '../types';

/**
 * Calculate amortization schedule for a loan
 * @param principal - The loan principal amount
 * @param annualRate - Annual interest rate (as percentage, e.g., 5.5 for 5.5%)
 * @param termMonths - Loan term in months
 * @param startDate - Loan start date
 * @returns Array of amortization entries
 */
export function calculateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
  startDate: string
): AmortizationEntry[] {
  if (annualRate === 0) {
    // Handle zero interest rate
    const monthlyPayment = principal / termMonths;
    const schedule: AmortizationEntry[] = [];
    
    for (let i = 1; i <= termMonths; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + i);
      
      schedule.push({
        paymentNumber: i,
        paymentDate: paymentDate.toISOString(),
        paymentAmount: monthlyPayment,
        principalAmount: monthlyPayment,
        interestAmount: 0,
        remainingBalance: principal - (monthlyPayment * i)
      });
    }
    
    return schedule;
  }

  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                        (Math.pow(1 + monthlyRate, termMonths) - 1);

  const schedule: AmortizationEntry[] = [];
  let remainingBalance = principal;

  for (let i = 1; i <= termMonths; i++) {
    const interestAmount = remainingBalance * monthlyRate;
    const principalAmount = monthlyPayment - interestAmount;
    remainingBalance -= principalAmount;

    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + i);

    schedule.push({
      paymentNumber: i,
      paymentDate: paymentDate.toISOString(),
      paymentAmount: monthlyPayment,
      principalAmount,
      interestAmount,
      remainingBalance: Math.max(0, remainingBalance)
    });
  }

  return schedule;
}

/**
 * Calculate monthly payment for a loan
 * @param principal - The loan principal amount
 * @param annualRate - Annual interest rate (as percentage)
 * @param termMonths - Loan term in months
 * @returns Monthly payment amount
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (annualRate === 0) {
    return principal / termMonths;
  }

  const monthlyRate = annualRate / 100 / 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
         (Math.pow(1 + monthlyRate, termMonths) - 1);
}

/**
 * Calculate total interest for a loan
 * @param principal - The loan principal amount
 * @param annualRate - Annual interest rate (as percentage)
 * @param termMonths - Loan term in months
 * @returns Total interest amount
 */
export function calculateTotalInterest(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (annualRate === 0) {
    return 0;
  }

  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  return (monthlyPayment * termMonths) - principal;
}

