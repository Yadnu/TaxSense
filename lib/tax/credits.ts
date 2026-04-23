import type { TaxInput } from './types';
import {
  CHILD_TAX_CREDIT_AMOUNT,
  CHILD_TAX_CREDIT_PHASE_OUT,
} from './constants';

// 2026 EIC maximum amounts by number of qualifying children (IRS estimates)
const EIC_BY_DEPENDENTS: Record<number, number> = {
  0: 632,
  1: 4213,
  2: 6960,
};
const EIC_THREE_OR_MORE = 7830;
const EIC_AGI_LIMIT = 66819;

/**
 * Compute total available tax credits.
 * Returns the total credits (capped at federalTaxBeforeCredits in the engine).
 */
export function computeCredits(input: TaxInput, agi: number): number {
  let totalCredits = 0;

  // ── Child Tax Credit ────────────────────────────────────────────────────────
  if (input.hasChildTaxCredit && input.dependents > 0) {
    const baseCredit = input.dependents * CHILD_TAX_CREDIT_AMOUNT;
    const phaseOutThreshold = CHILD_TAX_CREDIT_PHASE_OUT[input.filingStatus];

    if (agi <= phaseOutThreshold) {
      totalCredits += baseCredit;
    } else {
      // Reduce $50 per $1,000 (or fraction thereof) over threshold
      const excessIncome = agi - phaseOutThreshold;
      const reductionUnits = Math.ceil(excessIncome / 1000);
      const reduction = reductionUnits * 50;
      const credit = Math.max(0, baseCredit - reduction);
      totalCredits += credit;
    }
  }

  // ── Earned Income Credit ────────────────────────────────────────────────────
  if (input.hasEarnedIncomeCredit && agi < EIC_AGI_LIMIT) {
    const dependents = Math.floor(input.dependents);
    let eic = 0;
    if (dependents >= 3) {
      eic = EIC_THREE_OR_MORE;
    } else {
      eic = EIC_BY_DEPENDENTS[dependents] ?? 0;
    }
    totalCredits += eic;
  }

  return round2(totalCredits);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
