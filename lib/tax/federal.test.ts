import { describe, it, expect } from 'vitest';
import {
  computeFederalTax,
  computeSelfEmploymentTax,
  computeAdditionalMedicareTax,
} from './federal';

// ─── computeFederalTax ────────────────────────────────────────────────────────

describe('computeFederalTax', () => {
  it('returns zero tax for $0 income (single)', () => {
    const result = computeFederalTax(0, 'single');
    expect(result.totalTax).toBe(0);
    result.brackets.forEach((b) => {
      expect(b.taxableIncome).toBe(0);
      expect(b.taxAmount).toBe(0);
    });
  });

  it('taxes income within the first bracket only (single)', () => {
    // $10,000 is entirely in the 10% bracket (max 11,925)
    const result = computeFederalTax(10_000, 'single');
    expect(result.totalTax).toBe(1_000);
    expect(result.brackets[0].rate).toBe(0.10);
    expect(result.brackets[0].taxableIncome).toBe(10_000);
    expect(result.brackets[0].taxAmount).toBe(1_000);
  });

  it('spans multiple brackets correctly (single)', () => {
    // $60,000 single: 10% on 0–11,925, 12% on 11,926–48,475, 22% on 48,476–60,000
    const band1 = Math.round(11_925 * 0.10 * 100) / 100;           // 1,192.50
    const band2 = Math.round((48_475 - 11_926) * 0.12 * 100) / 100; // 4,385.88
    const band3 = Math.round((60_000 - 48_476) * 0.22 * 100) / 100; // 2,535.28
    const expected = Math.round((band1 + band2 + band3) * 100) / 100;

    const result = computeFederalTax(60_000, 'single');
    expect(result.totalTax).toBeCloseTo(expected, 1);
    expect(result.brackets[0].rate).toBe(0.10);
    expect(result.brackets[1].rate).toBe(0.12);
    expect(result.brackets[2].rate).toBe(0.22);
  });

  it('spans multiple brackets correctly (married_filing_jointly)', () => {
    // $100,000 MFJ: 10% on 0–23,850, 12% on 23,851–96,950, 22% on 96,951–100,000
    const band1 = Math.round(23_850 * 0.10 * 100) / 100;
    const band2 = Math.round((96_950 - 23_851) * 0.12 * 100) / 100;
    const band3 = Math.round((100_000 - 96_951) * 0.22 * 100) / 100;
    const expected = Math.round((band1 + band2 + band3) * 100) / 100;

    const result = computeFederalTax(100_000, 'married_filing_jointly');
    expect(result.totalTax).toBeCloseTo(expected, 1);
  });

  it('reaches the top (37%) bracket (single)', () => {
    const result = computeFederalTax(700_000, 'single');
    const topBracket = result.brackets.find((b) => b.rate === 0.37);
    expect(topBracket).toBeDefined();
    expect(topBracket!.taxableIncome).toBeGreaterThan(0);
    expect(topBracket!.taxAmount).toBeGreaterThan(0);
    // Spot-check: income above 626,350 at 37%
    expect(topBracket!.taxableIncome).toBe(700_000 - 626_351);
  });

  it('computes top bracket correctly for married_filing_separately', () => {
    const result = computeFederalTax(800_000, 'married_filing_separately');
    const topBracket = result.brackets.find((b) => b.rate === 0.37);
    expect(topBracket).toBeDefined();
    expect(topBracket!.taxableIncome).toBe(800_000 - 375_801);
  });

  it('computes correctly for head_of_household', () => {
    // Income exactly at top of 10% bracket for HoH = 17,000
    const result = computeFederalTax(17_000, 'head_of_household');
    expect(result.totalTax).toBe(Math.round(17_000 * 0.10 * 100) / 100);
  });

  it('returns only first-bracket entries when income is below second bracket min (MFJ)', () => {
    const result = computeFederalTax(20_000, 'married_filing_jointly');
    // First bracket max = 23,850, so $20k falls entirely in the 10% band
    expect(result.totalTax).toBe(2_000);
    const nonZero = result.brackets.filter((b) => b.taxableIncome > 0);
    expect(nonZero).toHaveLength(1);
    expect(nonZero[0].rate).toBe(0.10);
  });
});

// ─── computeSelfEmploymentTax ─────────────────────────────────────────────────

describe('computeSelfEmploymentTax', () => {
  it('returns zeros for zero income', () => {
    const result = computeSelfEmploymentTax(0);
    expect(result.selfEmploymentTax).toBe(0);
    expect(result.deductiblePortion).toBe(0);
  });

  it('returns zeros for negative income', () => {
    const result = computeSelfEmploymentTax(-5_000);
    expect(result.selfEmploymentTax).toBe(0);
    expect(result.deductiblePortion).toBe(0);
  });

  it('applies 0.9235 × 0.153 correctly for positive income', () => {
    const income = 50_000;
    const netSE = income * 0.9235;
    const expectedTax = Math.round(netSE * 0.153 * 100) / 100;
    const expectedDeductible = Math.round(expectedTax * 0.5 * 100) / 100;

    const result = computeSelfEmploymentTax(income);
    expect(result.selfEmploymentTax).toBe(expectedTax);
    expect(result.deductiblePortion).toBe(expectedDeductible);
  });

  it('deductible portion is exactly half of SE tax', () => {
    const result = computeSelfEmploymentTax(100_000);
    expect(result.deductiblePortion).toBeCloseTo(result.selfEmploymentTax * 0.5, 2);
  });
});

// ─── computeAdditionalMedicareTax ─────────────────────────────────────────────

describe('computeAdditionalMedicareTax', () => {
  it('returns 0 when wages are below the single threshold ($200,000)', () => {
    expect(computeAdditionalMedicareTax(199_999, 'single')).toBe(0);
  });

  it('returns 0 when wages equal the threshold exactly (single)', () => {
    expect(computeAdditionalMedicareTax(200_000, 'single')).toBe(0);
  });

  it('taxes the excess above $200,000 at 0.9% for single filers', () => {
    const wages = 250_000;
    const expected = Math.round((250_000 - 200_000) * 0.009 * 100) / 100;
    expect(computeAdditionalMedicareTax(wages, 'single')).toBe(expected);
  });

  it('uses the higher $250,000 threshold for married_filing_jointly', () => {
    expect(computeAdditionalMedicareTax(249_999, 'married_filing_jointly')).toBe(0);
    const wages = 300_000;
    const expected = Math.round((300_000 - 250_000) * 0.009 * 100) / 100;
    expect(computeAdditionalMedicareTax(wages, 'married_filing_jointly')).toBe(expected);
  });

  it('uses the $200,000 threshold for married_filing_separately', () => {
    const wages = 220_000;
    const expected = Math.round((220_000 - 200_000) * 0.009 * 100) / 100;
    expect(computeAdditionalMedicareTax(wages, 'married_filing_separately')).toBe(expected);
  });

  it('uses the $200,000 threshold for head_of_household', () => {
    const wages = 210_000;
    const expected = Math.round((210_000 - 200_000) * 0.009 * 100) / 100;
    expect(computeAdditionalMedicareTax(wages, 'head_of_household')).toBe(expected);
  });
});
