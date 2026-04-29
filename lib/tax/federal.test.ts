import { describe, it, expect } from "vitest";
import { computeFederalIncomeTax, computeFICA } from "./federal";

// ─── computeFederalIncomeTax ──────────────────────────────────────────────────
// Standard deduction is applied first: single = $15,000, MFJ = $30,000, HoH = $22,500

describe("computeFederalIncomeTax", () => {
  it("returns zero tax when gross income is at or below the standard deduction (single)", () => {
    const { taxableIncome, federalTax } = computeFederalIncomeTax(15000, "single");
    expect(taxableIncome).toBe(0);
    expect(federalTax).toBe(0);
  });

  it("taxes income in the first bracket only — single, gross $25,000", () => {
    // taxable = 25000 - 15000 = 10000, entirely in 10% bracket (max 11925)
    const { taxableIncome, federalTax } = computeFederalIncomeTax(25000, "single");
    expect(taxableIncome).toBe(10000);
    expect(federalTax).toBe(1000);
  });

  it("spans multiple brackets — single, gross $60,000", () => {
    // taxable = 60000 - 15000 = 45000
    // 10% on 0–11925 = 1192.50
    // 12% on 11925–45000 = 12% × 33075 = 3969.00
    const { taxableIncome, federalTax } = computeFederalIncomeTax(60000, "single");
    expect(taxableIncome).toBe(45000);
    const expected = parseFloat((11925 * 0.10 + (45000 - 11925) * 0.12).toFixed(2));
    expect(federalTax).toBeCloseTo(expected, 1);
  });

  it("spans multiple brackets — marriedFilingJointly, gross $130,000", () => {
    // taxable = 130000 - 30000 = 100000
    // 10% on 0–23850 = 2385.00
    // 12% on 23850–96950 = 12% × 73100 = 8772.00
    // 22% on 96950–100000 = 22% × 3050 = 671.00
    const { taxableIncome, federalTax } = computeFederalIncomeTax(130000, "marriedFilingJointly");
    expect(taxableIncome).toBe(100000);
    const expected = parseFloat(
      (23850 * 0.10 + (96950 - 23850) * 0.12 + (100000 - 96950) * 0.22).toFixed(2),
    );
    expect(federalTax).toBeCloseTo(expected, 1);
  });

  it("reaches the 37% bracket — single, gross $650,000", () => {
    // taxable = 650000 - 15000 = 635000; top bracket starts at 626350
    const { taxableIncome, federalTax } = computeFederalIncomeTax(650000, "single");
    expect(taxableIncome).toBe(635000);
    // Spot-check: income above 626350 at 37%
    const topSlice = parseFloat(((635000 - 626350) * 0.37).toFixed(2));
    expect(federalTax).toBeGreaterThan(topSlice);
  });

  it("headOfHousehold — gross $40,000 uses HoH standard deduction $22,500", () => {
    // taxable = 40000 - 22500 = 17500; 10% on 17000 = 1700, 12% on 500 = 60
    const { taxableIncome, federalTax } = computeFederalIncomeTax(40000, "headOfHousehold");
    expect(taxableIncome).toBe(17500);
    const expected = parseFloat((17000 * 0.10 + 500 * 0.12).toFixed(2));
    expect(federalTax).toBeCloseTo(expected, 1);
  });

  it("marriedFilingSeparately — uses same brackets/deduction as single", () => {
    const mfs = computeFederalIncomeTax(50000, "marriedFilingSeparately");
    const single = computeFederalIncomeTax(50000, "single");
    expect(mfs.taxableIncome).toBe(single.taxableIncome);
    expect(mfs.federalTax).toBe(single.federalTax);
  });

  it("returns zero for zero gross income", () => {
    const { taxableIncome, federalTax } = computeFederalIncomeTax(0, "single");
    expect(taxableIncome).toBe(0);
    expect(federalTax).toBe(0);
  });
});

// ─── computeFICA ─────────────────────────────────────────────────────────────

describe("computeFICA", () => {
  it("returns zero SS and Medicare for zero income", () => {
    const { socialSecurityTax, medicareTax } = computeFICA(0, "single");
    expect(socialSecurityTax).toBe(0);
    expect(medicareTax).toBe(0);
  });

  it("SS is capped at the $176,100 wage base", () => {
    const { socialSecurityTax } = computeFICA(300000, "single");
    expect(socialSecurityTax).toBe(parseFloat((176100 * 0.062).toFixed(2)));
  });

  it("SS is not capped below the wage base", () => {
    const { socialSecurityTax } = computeFICA(50000, "single");
    expect(socialSecurityTax).toBe(parseFloat((50000 * 0.062).toFixed(2)));
  });

  it("Medicare is flat 1.45% below the additional threshold (single = $200k)", () => {
    const { medicareTax } = computeFICA(150000, "single");
    expect(medicareTax).toBe(parseFloat((150000 * 0.0145).toFixed(2)));
  });

  it("Medicare includes 0.9% additional rate above $200k (single)", () => {
    const { medicareTax } = computeFICA(250000, "single");
    const expected = parseFloat(
      (200000 * 0.0145 + 50000 * (0.0145 + 0.009)).toFixed(2),
    );
    expect(medicareTax).toBeCloseTo(expected, 1);
  });

  it("Medicare additional threshold is $250k for marriedFilingJointly", () => {
    // No additional Medicare below $250k
    const { medicareTax: below } = computeFICA(249999, "marriedFilingJointly");
    expect(below).toBe(parseFloat((249999 * 0.0145).toFixed(2)));

    // Above $250k additional 0.9% kicks in
    const { medicareTax: above } = computeFICA(300000, "marriedFilingJointly");
    const expected = parseFloat(
      (250000 * 0.0145 + 50000 * (0.0145 + 0.009)).toFixed(2),
    );
    expect(above).toBeCloseTo(expected, 1);
  });
});
