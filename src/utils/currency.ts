export const SUPPORTED_CURRENCIES = [
  'MAD', // Moroccan Dirham
  'USD', // US Dollar
  'EUR', // Euro
  'GBP', // British Pound
  'JPY', // Japanese Yen
  'CAD', // Canadian Dollar
  'AED', // UAE Dirham
  'ARS', // Argentine Peso
  'AUD', // Australian Dollar
  'BDT', // Bangladeshi Taka
  'BGN', // Bulgarian Lev
  'BRL', // Brazilian Real
  'CHF', // Swiss Franc
  'CLP', // Chilean Peso
  'CNY', // Chinese Yuan
  'COP', // Colombian Peso
  'CZK', // Czech Koruna
  'DKK', // Danish Krone
  'EGP', // Egyptian Pound
  'GHS', // Ghanaian Cedi
  'HKD', // Hong Kong Dollar
  'HUF', // Hungarian Forint
  'IDR', // Indonesian Rupiah
  'ILS', // Israeli Shekel
  'INR', // Indian Rupee
  'ISK', // Icelandic Krona
  'JOD', // Jordanian Dinar
  'KES', // Kenyan Shilling
  'KRW', // South Korean Won
  'KWD', // Kuwaiti Dinar
  'LKR', // Sri Lankan Rupee
  'MXN', // Mexican Peso
  'MYR', // Malaysian Ringgit
  'NGN', // Nigerian Naira
  'NOK', // Norwegian Krone
  'NZD', // New Zealand Dollar
  'PEN', // Peruvian Sol
  'PHP', // Philippine Peso
  'PKR', // Pakistani Rupee
  'PLN', // Polish Zloty
  'QAR', // Qatari Riyal
  'RON', // Romanian Leu
  'RUB', // Russian Ruble
  'SAR', // Saudi Riyal
  'SEK', // Swedish Krona
  'SGD', // Singapore Dollar
  'THB', // Thai Baht
  'TRY', // Turkish Lira
  'TWD', // Taiwan Dollar
  'TZS', // Tanzanian Shilling
  'UGX', // Ugandan Shilling
  'UYU', // Uruguayan Peso
  'VND', // Vietnamese Dong
  'ZAR'  // South African Rand
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

