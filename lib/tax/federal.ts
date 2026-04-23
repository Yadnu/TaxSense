import type { BracketResult, FilingStatus } from './types';
import {
  FEDERAL_BRACKETS_2026,
  SELF_EMPLOYMENT_TAX_RATE,
  SELF_EMPLOYMENT_DEDUCTION_RATE,
  ADDITIONAL_MEDICARE_THRESHOLD,
  ADDITIONAL_MEDICARE_RATE,
} from './constants';

export interface FederalTaxResult {
  brackets: BracketResult[];
  totalTax: number;
}

export interface SelfEmploymentTaxResult {
  selfEmploymentTax: number;
  deductiblePortion: number;
}

/**
 * Apply progressive federal tax brackets and return per-bracket breakdown.
 */
export function computeFederalTax(
  taxableIncome: number,
  filingStatus: FilingStatus,
): FederalTaxResult {
  const brackets = FEDERAL_BRACKETS_2026[filingStatus];
  const results: BracketResult[] = [];
  let totalTax = 0;

  for (const bracket of brackets) {
    if (taxableIncome <= 0) {
      results.push({ rate: bracket.rate, taxableIncome: 0, taxAmount: 0 });
      continue;
    }

    const bracketMax = bracket.max === Infinity ? Infinity : bracket.max;
    const lower = bracket.min;
    const upper = bracketMax === Infinity ? taxableIncome : Math.min(taxableIncome, bracketMax);
    const inBracket = Math.max(0, upper - lower);

    const taxAmount = round2(inBracket * bracket.rate);
    totalTax += taxAmount;

    results.push({
      rate: bracket.rate,
      taxableIncome: round2(inBracket),
      taxAmount,
    });

    if (taxableIncome <= bracketMax) break;
  }

  return { brackets: results, totalTax: round2(totalTax) };
}

/**
 * Self-employment tax (both employee and employer portions).
 * SE income is net self-employment income × 0.9235 before applying the SE rate.
 */
export function computeSelfEmploymentTax(selfEmploymentIncome: number): SelfEmploymentTaxResult {
  if (selfEmploymentIncome <= 0) {
    return { selfEmploymentTax: 0, deductiblePortion: 0 };
  }

  // Net SE income subject to SE tax
  const netSEIncome = selfEmploymentIncome * 0.9235;
  const selfEmploymentTax = round2(netSEIncome * SELF_EMPLOYMENT_TAX_RATE);
  // The employer-equivalent half is deductible from gross income
  const deductiblePortion = round2(selfEmploymentTax * SELF_EMPLOYMENT_DEDUCTION_RATE);

  return { selfEmploymentTax, deductiblePortion };
}

/**
 * Additional 0.9% Medicare tax on wages above the filing-status threshold.
 */
export function computeAdditionalMedicareTax(
  wages: number,
  filingStatus: FilingStatus,
): number {
  const threshold = ADDITIONAL_MEDICARE_THRESHOLD[filingStatus];
  if (wages <= threshold) return 0;
  return round2((wages - threshold) * ADDITIONAL_MEDICARE_RATE);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
