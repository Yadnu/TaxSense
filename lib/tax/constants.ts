/**
 * 2026 tax brackets are projected based on IRS Revenue Procedure inflation adjustments.
 * Update with official IRS figures when published.
 *
 * Values derived by applying the ~2.8% inflation adjustment to 2025 IRS figures.
 * Source: IRS Rev. Proc. 2024-40 methodology.
 */

import type { FilingStatus } from './types';

export interface TaxBracket {
  min: number;
  max: number; // Infinity for the top bracket
  rate: number;
}

// ─── Federal Income Tax Brackets (2026 projected) ─────────────────────────────

export const FEDERAL_BRACKETS_2026: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { min: 0,       max: 11925,   rate: 0.10 },
    { min: 11926,   max: 48475,   rate: 0.12 },
    { min: 48476,   max: 103350,  rate: 0.22 },
    { min: 103351,  max: 197300,  rate: 0.24 },
    { min: 197301,  max: 250525,  rate: 0.32 },
    { min: 250526,  max: 626350,  rate: 0.35 },
    { min: 626351,  max: Infinity, rate: 0.37 },
  ],
  married_filing_jointly: [
    { min: 0,       max: 23850,   rate: 0.10 },
    { min: 23851,   max: 96950,   rate: 0.12 },
    { min: 96951,   max: 206700,  rate: 0.22 },
    { min: 206701,  max: 394600,  rate: 0.24 },
    { min: 394601,  max: 501050,  rate: 0.32 },
    { min: 501051,  max: 751600,  rate: 0.35 },
    { min: 751601,  max: Infinity, rate: 0.37 },
  ],
  married_filing_separately: [
    { min: 0,       max: 11925,   rate: 0.10 },
    { min: 11926,   max: 48475,   rate: 0.12 },
    { min: 48476,   max: 103350,  rate: 0.22 },
    { min: 103351,  max: 197300,  rate: 0.24 },
    { min: 197301,  max: 250525,  rate: 0.32 },
    { min: 250526,  max: 375800,  rate: 0.35 },
    { min: 375801,  max: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { min: 0,       max: 17000,   rate: 0.10 },
    { min: 17001,   max: 64850,   rate: 0.12 },
    { min: 64851,   max: 103350,  rate: 0.22 },
    { min: 103351,  max: 197300,  rate: 0.24 },
    { min: 197301,  max: 250500,  rate: 0.32 },
    { min: 250501,  max: 626350,  rate: 0.35 },
    { min: 626351,  max: Infinity, rate: 0.37 },
  ],
};

// ─── Standard Deductions (2026 projected) ─────────────────────────────────────

export const STANDARD_DEDUCTION_2026: Record<FilingStatus, number> = {
  single:                    15000,
  married_filing_jointly:    30000,
  married_filing_separately: 15000,
  head_of_household:         22500,
};

// ─── Self-Employment Tax ───────────────────────────────────────────────────────

export const SELF_EMPLOYMENT_TAX_RATE = 0.153;
export const SELF_EMPLOYMENT_DEDUCTION_RATE = 0.5;

// ─── FICA / Social Security / Medicare ────────────────────────────────────────

export const SOCIAL_SECURITY_WAGE_BASE_2026 = 176100;
export const SOCIAL_SECURITY_RATE = 0.062;
export const MEDICARE_RATE = 0.0145;

export const ADDITIONAL_MEDICARE_THRESHOLD: Record<FilingStatus, number> = {
  single:                    200000,
  married_filing_jointly:    250000,
  married_filing_separately: 200000,
  head_of_household:         200000,
};

export const ADDITIONAL_MEDICARE_RATE = 0.009;

// ─── Child Tax Credit ──────────────────────────────────────────────────────────

export const CHILD_TAX_CREDIT_AMOUNT = 2000; // per qualifying child

export const CHILD_TAX_CREDIT_PHASE_OUT: Record<FilingStatus, number> = {
  single:                    200000,
  married_filing_jointly:    400000,
  married_filing_separately: 200000,
  head_of_household:         200000,
};

// ─── Student Loan Interest Deduction ──────────────────────────────────────────

export const STUDENT_LOAN_INTEREST_DEDUCTION_MAX = 2500;
export const STUDENT_LOAN_PHASE_OUT_RANGE = 15000;

export const STUDENT_LOAN_PHASE_OUT_START: Record<FilingStatus, number> = {
  single:                    80000,
  married_filing_jointly:    165000,
  married_filing_separately: 80000,
  head_of_household:         80000,
};

// ─── State Tax Rates ───────────────────────────────────────────────────────────
// v1 uses flat effective rates — replace with progressive brackets per state in v2

export const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.05,
  AK: 0,
  AZ: 0.025,
  AR: 0.047,
  CA: 0.093,
  CO: 0.044,
  CT: 0.0699,
  DE: 0.066,
  FL: 0,
  GA: 0.055,
  HI: 0.11,
  ID: 0.058,
  IL: 0.0495,
  IN: 0.0323,
  IA: 0.06,
  KS: 0.057,
  KY: 0.045,
  LA: 0.0425,
  ME: 0.075,
  MD: 0.0575,
  MA: 0.05,
  MI: 0.0425,
  MN: 0.0985,
  MS: 0.05,
  MO: 0.054,
  MT: 0.069,
  NE: 0.0664,
  NV: 0,
  NH: 0,
  NJ: 0.0637,
  NM: 0.059,
  NY: 0.0685,
  NC: 0.0499,
  ND: 0.029,
  OH: 0.04,
  OK: 0.05,
  OR: 0.099,
  PA: 0.0307,
  RI: 0.0599,
  SC: 0.07,
  SD: 0,
  TN: 0,
  TX: 0,
  UT: 0.0485,
  VT: 0.0875,
  VA: 0.0575,
  WA: 0,
  WV: 0.065,
  WI: 0.0765,
  WY: 0,
  DC: 0.085,
};
