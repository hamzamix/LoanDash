export const SUPPORTED_CURRENCIES = [
  'MAD', // Moroccan Dirham
  'USD', // US Dollar
  'EUR', // Euro
  'GBP', // British Pound
  'JPY', // Japanese Yen
  'CAD', // Canadian Dollar
  'AUD', // Australian Dollar
  'CHF', // Swiss Franc
  'CNY', // Chinese Yuan
  'SEK', // Swedish Krona
  'NZD', // New Zealand Dollar
  'MXN', // Mexican Peso
  'SGD', // Singapore Dollar
  'HKD', // Hong Kong Dollar
  'NOK', // Norwegian Krone
  'TRY', // Turkish Lira
  'RUB', // Russian Ruble
  'INR', // Indian Rupee
  'BRL', // Brazilian Real
  'ZAR', // South African Rand
];

export const formatCurrency = (amount: number, currency: string = 'MAD'): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported currencies
    return `${amount.toFixed(2)} ${currency}`;
  }
};

