const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
};

export function formatPrice(amount: string | number, currencyCode = 'USD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const symbol = CURRENCY_SYMBOLS[currencyCode] || `${currencyCode} `;
  return `${symbol}${num.toFixed(2)}`;
}
