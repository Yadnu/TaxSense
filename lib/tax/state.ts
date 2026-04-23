import { STATE_TAX_RATES } from './constants';

export interface StateTaxResult {
  rate: number;
  liability: number;
}

/**
 * Compute state income tax using a flat effective rate (v1).
 * v2 should replace this with per-state progressive brackets.
 */
export function computeStateTax(
  taxableIncome: number,
  stateCode: string,
): StateTaxResult {
  const code = stateCode.trim().toUpperCase();

  if (!(code in STATE_TAX_RATES)) {
    console.warn(
      `[tax/state] State code "${code}" not found in STATE_TAX_RATES. Defaulting to 5% effective rate.`,
    );
  }

  const rate = STATE_TAX_RATES[code] ?? 0.05;
  const liability = round2(taxableIncome * rate);

  return { rate, liability };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
