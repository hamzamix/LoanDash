export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham', decimals: 2 },
  { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2 }
];

/**
 * Format amount with currency symbol
 * @param amount - The amount to format
 * @param currencyCode - Currency code (defaults to MAD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currencyCode: string = 'MAD'): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
  
  const formattedAmount = amount.toFixed(currency.decimals);
  
  // For MAD, put symbol after the amount (traditional format)
  if (currencyCode === 'MAD') {
    return `${formattedAmount} ${currency.symbol}`;
  }
  
  // For most other currencies, put symbol before the amount
  return `${currency.symbol}${formattedAmount}`;
}

/**
 * Get currency configuration by code
 * @param currencyCode - Currency code
 * @returns Currency configuration or default (MAD)
 */
export function getCurrencyConfig(currencyCode: string = 'MAD'): CurrencyConfig {
  return SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
}

/**
 * Parse currency input string to number
 * @param input - Currency input string
 * @param currencyCode - Currency code for context
 * @returns Parsed number or NaN if invalid
 */
export function parseCurrencyInput(input: string, currencyCode: string = 'MAD'): number {
  const currency = getCurrencyConfig(currencyCode);
  
  // Remove currency symbols and spaces
  let cleanInput = input.replace(/[^\d.,\-]/g, '');
  
  // Handle different decimal separators
  if (cleanInput.includes(',') && cleanInput.includes('.')) {
    // Assume comma is thousands separator and dot is decimal
    cleanInput = cleanInput.replace(/,/g, '');
  } else if (cleanInput.includes(',')) {
    // Assume comma is decimal separator
    cleanInput = cleanInput.replace(',', '.');
  }
  
  const parsed = parseFloat(cleanInput);
  return isNaN(parsed) ? NaN : parsed;
}

