/** Static mock FX — replace with API. `etbPerUnit` = ETB for 1 unit of `code` (e.g. 1 USD → ETB). */

export type MockFxCurrency = {
  code: string;
  symbol: string;
  /** ETB per 1 unit of this currency */
  etbPerUnit: number;
};

export const MOCK_FX_ETB_PER_UNIT: MockFxCurrency[] = [
  { code: 'ETB', symbol: 'Br', etbPerUnit: 1 },
  { code: 'USD', symbol: '$', etbPerUnit: 129.47 },
  { code: 'EUR', symbol: '€', etbPerUnit: 140.22 },
  { code: 'GBP', symbol: '£', etbPerUnit: 163.8 },
  { code: 'SAR', symbol: 'SR', etbPerUnit: 34.52 },
  { code: 'AED', symbol: 'Dh', etbPerUnit: 35.24 },
];

export const MOCK_FX_AS_OF_ISO = '2026-04-25T00:00:00.000Z';

/** Convert menu price (ETB) to selected currency amount. */
export function convertEtbToCurrency(priceEtb: number, currency: MockFxCurrency): number {
  if (currency.code === 'ETB') return priceEtb;
  return priceEtb / currency.etbPerUnit;
}
