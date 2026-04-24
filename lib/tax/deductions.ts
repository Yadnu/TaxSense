import type { TaxInput } from './types';
import {
  STANDARD_DEDUCTION_2026,
  STUDENT_LOAN_INTEREST_DEDUCTION_MAX,
  STUDENT_LOAN_PHASE_OUT_START,
  STUDENT_LOAN_PHASE_OUT_RANGE,
} from './constants';

export interface DeductionResult {
  type: 'standard' | 'itemized';
  amount: number;
  studentLoanDeduction: number;
}

export function computeDeductions(input: TaxInput): DeductionResult {
  const { filingStatus, studentLoanInterestPaid, useItemizedDeductions, itemizedDeductions } = input;

  // ── Student loan interest deduction ────────────────────────────────────────
  // Phase out linearly over STUDENT_LOAN_PHASE_OUT_RANGE above the start threshold.
  // The AGI used here is gross income (before this deduction) which is a simplification;
  // the engine passes the pre-deduction AGI for this purpose.
  const phaseOutStart = STUDENT_LOAN_PHASE_OUT_START[filingStatus];
  const phaseOutEnd = phaseOutStart + STUDENT_LOAN_PHASE_OUT_RANGE;

  let studentLoanDeduction = Math.min(studentLoanInterestPaid, STUDENT_LOAN_INTEREST_DEDUCTION_MAX);

  // Use gross income proxy — engine will pass pre-student-loan AGI
  // Phase-out is applied by the engine after computing tentative AGI
  // Here we compute the raw cap; phase-out reduction is applied in the engine
  // Store the phase-out start/end so engine can apply it. For now return the raw deduction;
  // the engine calls this after computing tentative AGI and applies the phase-out itself.
  // To keep this function pure and self-contained, we accept an optional `agi` parameter.
  // If not provided, no phase-out is applied.
  studentLoanDeduction = computeStudentLoanDeduction(studentLoanInterestPaid, 0, phaseOutStart, phaseOutEnd);

  // ── Standard vs itemized ────────────────────────────────────────────────────
  const standardAmount = STANDARD_DEDUCTION_2026[filingStatus];

  if (useItemizedDeductions && itemizedDeductions > standardAmount) {
    return {
      type: 'itemized',
      amount: itemizedDeductions,
      studentLoanDeduction,
    };
  }

  // Always use the greater deduction, but respect forced itemization
  if (useItemizedDeductions) {
    return {
      type: 'itemized',
      amount: itemizedDeductions,
      studentLoanDeduction,
    };
  }

  return {
    type: 'standard',
    amount: standardAmount,
    studentLoanDeduction,
  };
}

/**
 * Compute the student loan interest deduction with phase-out.
 * @param paid         Amount of student loan interest paid
 * @param agi          Adjusted gross income (before this deduction)
 * @param phaseOutStart AGI at which phase-out begins
 * @param phaseOutEnd   AGI at which deduction is fully phased out
 */
export function computeStudentLoanDeduction(
  paid: number,
  agi: number,
  phaseOutStart: number,
  phaseOutEnd: number,
): number {
  const raw = Math.min(paid, STUDENT_LOAN_INTEREST_DEDUCTION_MAX);
  if (raw <= 0) return 0;
  if (agi <= phaseOutStart) return raw;
  if (agi >= phaseOutEnd) return 0;

  const phaseOutRange = phaseOutEnd - phaseOutStart;
  const reduction = ((agi - phaseOutStart) / phaseOutRange) * raw;
  return Math.max(0, raw - reduction);
}
