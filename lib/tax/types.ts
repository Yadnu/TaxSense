export type FilingStatus =
  | 'single'
  | 'married_filing_jointly'
  | 'married_filing_separately'
  | 'head_of_household';

export interface TaxInput {
  taxYear: 2026;
  filingStatus: FilingStatus;
  // W-2
  wagesTipsOther: number;
  federalTaxWithheld: number;
  stateTaxWithheld: number;
  socialSecurityTaxWithheld: number;
  medicareTaxWithheld: number;
  state: string; // two-letter state code e.g. 'CA'
  // 1099-NEC
  selfEmploymentIncome: number;
  // 1099-INT
  interestIncome: number;
  // 1099-DIV
  ordinaryDividends: number;
  qualifiedDividends: number;
  // Deductions
  useItemizedDeductions: boolean;
  itemizedDeductions: number; // total if useItemizedDeductions is true
  // Credits
  dependents: number;
  hasChildTaxCredit: boolean;
  hasEarnedIncomeCredit: boolean;
  studentLoanInterestPaid: number;
}

export interface BracketResult {
  rate: number;
  taxableIncome: number;
  taxAmount: number;
}

export interface TaxSummary {
  taxYear: 2026;
  filingStatus: FilingStatus;
  // Income
  grossIncome: number;
  adjustedGrossIncome: number;
  // Deductions
  deductionType: 'standard' | 'itemized';
  deductionAmount: number;
  taxableIncome: number;
  // Federal
  federalTaxBrackets: BracketResult[];
  federalTaxBeforeCredits: number;
  totalCredits: number;
  federalTaxAfterCredits: number;
  federalTaxWithheld: number;
  federalRefundOrOwed: number; // positive = refund, negative = owed
  // Self-employment
  selfEmploymentTax: number;
  // FICA
  socialSecurityTaxWithheld: number;
  medicareTaxWithheld: number;
  // State
  stateTaxableIncome: number;
  stateTaxRate: number;
  stateTaxLiability: number;
  stateTaxWithheld: number;
  stateRefundOrOwed: number;
  // Summary
  effectiveFederalRate: number; // percentage
  effectiveStateRate: number; // percentage
  totalTaxLiability: number;
  totalWithheld: number;
  totalRefundOrOwed: number; // positive = refund, negative = owed
}
