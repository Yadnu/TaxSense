import type { FilingStatus } from "./types";

export interface TaxBracket {
  min: number;
  max: number; // Infinity for the top bracket
  rate: number;
}

// ─── Federal 2026 ─────────────────────────────────────────────────────────────

export const FEDERAL_TAX_CONFIG_2026 = {
  standardDeduction: {
    single:                   15000,
    marriedFilingJointly:     30000,
    marriedFilingSeparately:  15000,
    headOfHousehold:          22500,
  } as Record<FilingStatus, number>,

  brackets: {
    single: [
      { min: 0,       max: 11925,    rate: 0.10 },
      { min: 11925,   max: 48475,    rate: 0.12 },
      { min: 48475,   max: 103350,   rate: 0.22 },
      { min: 103350,  max: 197300,   rate: 0.24 },
      { min: 197300,  max: 250525,   rate: 0.32 },
      { min: 250525,  max: 626350,   rate: 0.35 },
      { min: 626350,  max: Infinity, rate: 0.37 },
    ],
    marriedFilingJointly: [
      { min: 0,       max: 23850,    rate: 0.10 },
      { min: 23850,   max: 96950,    rate: 0.12 },
      { min: 96950,   max: 206700,   rate: 0.22 },
      { min: 206700,  max: 394600,   rate: 0.24 },
      { min: 394600,  max: 501050,   rate: 0.32 },
      { min: 501050,  max: 751600,   rate: 0.35 },
      { min: 751600,  max: Infinity, rate: 0.37 },
    ],
    headOfHousehold: [
      { min: 0,       max: 17000,    rate: 0.10 },
      { min: 17000,   max: 64850,    rate: 0.12 },
      { min: 64850,   max: 103350,   rate: 0.22 },
      { min: 103350,  max: 197300,   rate: 0.24 },
      { min: 197300,  max: 250500,   rate: 0.32 },
      { min: 250500,  max: 626350,   rate: 0.35 },
      { min: 626350,  max: Infinity, rate: 0.37 },
    ],
    // marriedFilingSeparately uses the same thresholds as single (IRS parity)
    marriedFilingSeparately: [
      { min: 0,       max: 11925,    rate: 0.10 },
      { min: 11925,   max: 48475,    rate: 0.12 },
      { min: 48475,   max: 103350,   rate: 0.22 },
      { min: 103350,  max: 197300,   rate: 0.24 },
      { min: 197300,  max: 250525,   rate: 0.32 },
      { min: 250525,  max: 626350,   rate: 0.35 },
      { min: 626350,  max: Infinity, rate: 0.37 },
    ],
  } as Record<FilingStatus, TaxBracket[]>,

  fica: {
    socialSecurityRate:        0.062,
    socialSecurityWageBase:    176100,
    medicareRate:              0.0145,
    additionalMedicareRate:    0.009,
    additionalMedicareThreshold: {
      single:                  200000,
      marriedFilingJointly:    250000,
      marriedFilingSeparately: 200000,
      headOfHousehold:         200000,
    } as Record<FilingStatus, number>,
  },
} as const;

// ─── California 2026 ──────────────────────────────────────────────────────────

export const CA_TAX_CONFIG_2026 = {
  standardDeduction: {
    single:                   5540,
    marriedFilingJointly:     11080,
    marriedFilingSeparately:  5540,
    headOfHousehold:          11080,
  } as Record<FilingStatus, number>,

  brackets: {
    single: [
      { min: 0,       max: 10412,    rate: 0.010 },
      { min: 10412,   max: 24684,    rate: 0.020 },
      { min: 24684,   max: 38959,    rate: 0.040 },
      { min: 38959,   max: 54081,    rate: 0.060 },
      { min: 54081,   max: 68350,    rate: 0.080 },
      { min: 68350,   max: 349137,   rate: 0.093 },
      { min: 349137,  max: 418961,   rate: 0.103 },
      { min: 418961,  max: 698274,   rate: 0.113 },
      { min: 698274,  max: Infinity, rate: 0.123 },
    ],
    marriedFilingJointly: [
      { min: 0,       max: 20824,    rate: 0.010 },
      { min: 20824,   max: 49368,    rate: 0.020 },
      { min: 49368,   max: 77918,    rate: 0.040 },
      { min: 77918,   max: 108162,   rate: 0.060 },
      { min: 108162,  max: 136700,   rate: 0.080 },
      { min: 136700,  max: 698274,   rate: 0.093 },
      { min: 698274,  max: 837922,   rate: 0.103 },
      { min: 837922,  max: 1000000,  rate: 0.113 },
      { min: 1000000, max: Infinity, rate: 0.123 },
    ],
    // MFS and HoH use single brackets per CA FTB
    marriedFilingSeparately: [
      { min: 0,       max: 10412,    rate: 0.010 },
      { min: 10412,   max: 24684,    rate: 0.020 },
      { min: 24684,   max: 38959,    rate: 0.040 },
      { min: 38959,   max: 54081,    rate: 0.060 },
      { min: 54081,   max: 68350,    rate: 0.080 },
      { min: 68350,   max: 349137,   rate: 0.093 },
      { min: 349137,  max: 418961,   rate: 0.103 },
      { min: 418961,  max: 698274,   rate: 0.113 },
      { min: 698274,  max: Infinity, rate: 0.123 },
    ],
    headOfHousehold: [
      { min: 0,       max: 20824,    rate: 0.010 },
      { min: 20824,   max: 49368,    rate: 0.020 },
      { min: 49368,   max: 77918,    rate: 0.040 },
      { min: 77918,   max: 108162,   rate: 0.060 },
      { min: 108162,  max: 136700,   rate: 0.080 },
      { min: 136700,  max: 698274,   rate: 0.093 },
      { min: 698274,  max: 837922,   rate: 0.103 },
      { min: 837922,  max: 1000000,  rate: 0.113 },
      { min: 1000000, max: Infinity, rate: 0.123 },
    ],
  } as Record<FilingStatus, TaxBracket[]>,

  mentalHealthServicesTax: {
    rate:      0.01,
    threshold: 1000000,
  },

  sdi: {
    rate:     0.009,
    wageBase: Infinity, // no cap in 2026
  },
} as const;
