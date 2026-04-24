import type { FilingStatus, TaxInput, TaxSummary } from './types';
import { normalizeFields } from './normalizer';
import { computeDeductions, computeStudentLoanDeduction } from './deductions';
import { computeFederalTax, computeSelfEmploymentTax, computeAdditionalMedicareTax } from './federal';
import { computeCredits } from './credits';
import { computeStateTax } from './state';
import { STUDENT_LOAN_PHASE_OUT_START, STUDENT_LOAN_PHASE_OUT_RANGE } from './constants';

/**
 * Orchestrates all tax computation steps and returns a complete TaxSummary.
 * All computations are pure and synchronous — no async, no API calls.
 */
export function computeTaxSummary(
  rawFields: Record<string, string>,
  filingStatus: FilingStatus,
  overrides?: Partial<TaxInput>,
): TaxSummary {
  // Step 1: Normalize raw extracted fields into typed TaxInput
  const input = normalizeFields(rawFields, filingStatus, overrides);

  // Step 2: Gross income
  const grossIncome = round2(
    input.wagesTipsOther +
    input.selfEmploymentIncome +
    input.interestIncome +
    input.ordinaryDividends,
  );

  // Step 3: Self-employment tax
  const { selfEmploymentTax, deductiblePortion } = computeSelfEmploymentTax(input.selfEmploymentIncome);

  // Step 4a: Tentative AGI (without student loan deduction) for phase-out calculation
  const tentativeAGI = round2(grossIncome - deductiblePortion);

  // Step 4b: Student loan deduction with AGI-based phase-out
  const phaseOutStart = STUDENT_LOAN_PHASE_OUT_START[filingStatus];
  const phaseOutEnd = phaseOutStart + STUDENT_LOAN_PHASE_OUT_RANGE;
  const studentLoanDeduction = computeStudentLoanDeduction(
    input.studentLoanInterestPaid,
    tentativeAGI,
    phaseOutStart,
    phaseOutEnd,
  );

  // Step 4c: Final AGI
  const adjustedGrossIncome = round2(tentativeAGI - studentLoanDeduction);

  // Step 5: Deductions (standard vs itemized)
  // Pass overridden input so useItemizedDeductions is respected
  const { type: deductionType, amount: deductionAmount } = computeDeductions(input);

  // Step 6: Taxable income
  const taxableIncome = round2(Math.max(0, adjustedGrossIncome - deductionAmount));

  // Step 7: Federal income tax (progressive brackets)
  const { brackets: federalTaxBrackets, totalTax: federalTaxBeforeCreditsBase } = computeFederalTax(
    taxableIncome,
    input.filingStatus,
  );

  // Step 8: Additional Medicare tax
  const additionalMedicare = computeAdditionalMedicareTax(input.wagesTipsOther, input.filingStatus);

  // Step 9: Credits
  const totalCredits = Math.min(
    computeCredits(input, adjustedGrossIncome),
    federalTaxBeforeCreditsBase,
  );

  const federalTaxBeforeCredits = federalTaxBeforeCreditsBase;

  // Step 10: Federal tax after credits + SE tax + additional Medicare
  const federalTaxAfterCredits = round2(
    Math.max(0, federalTaxBeforeCredits - totalCredits) +
    selfEmploymentTax +
    additionalMedicare,
  );

  // Step 11: Federal refund / owed (positive = refund, negative = owed)
  const federalRefundOrOwed = round2(input.federalTaxWithheld - federalTaxAfterCredits);

  // Step 12: State tax
  const { rate: stateTaxRate, liability: stateTaxLiability } = computeStateTax(
    taxableIncome,
    input.state,
  );
  const stateRefundOrOwed = round2(input.stateTaxWithheld - stateTaxLiability);

  // Step 13: Effective rates (as percentages)
  const effectiveFederalRate = grossIncome > 0
    ? round2((federalTaxAfterCredits / grossIncome) * 100)
    : 0;
  const effectiveStateRate = grossIncome > 0
    ? round2((stateTaxLiability / grossIncome) * 100)
    : 0;

  // Step 14: Totals
  const totalTaxLiability = round2(federalTaxAfterCredits + stateTaxLiability);
  const totalWithheld = round2(input.federalTaxWithheld + input.stateTaxWithheld);
  const totalRefundOrOwed = round2(totalWithheld - totalTaxLiability);

  // Step 15: Assemble and return TaxSummary
  return {
    taxYear: 2026,
    filingStatus: input.filingStatus,
    grossIncome,
    adjustedGrossIncome,
    deductionType,
    deductionAmount,
    taxableIncome,
    federalTaxBrackets,
    federalTaxBeforeCredits: round2(federalTaxBeforeCredits),
    totalCredits: round2(totalCredits),
    federalTaxAfterCredits,
    federalTaxWithheld: round2(input.federalTaxWithheld),
    federalRefundOrOwed,
    selfEmploymentTax,
    socialSecurityTaxWithheld: round2(input.socialSecurityTaxWithheld),
    medicareTaxWithheld: round2(input.medicareTaxWithheld),
    stateTaxableIncome: taxableIncome,
    stateTaxRate,
    stateTaxLiability,
    stateTaxWithheld: round2(input.stateTaxWithheld),
    stateRefundOrOwed,
    effectiveFederalRate,
    effectiveStateRate,
    totalTaxLiability,
    totalWithheld,
    totalRefundOrOwed,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
