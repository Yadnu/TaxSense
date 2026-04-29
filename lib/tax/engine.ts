import type { TaxInput, TaxResult } from "./types";
import { computeFederalIncomeTax, computeFICA } from "./federal";
import { computeStateTax } from "./state";

export { computeFederalIncomeTax, computeFICA } from "./federal";
export { computeCAStateTax, computeStateTax } from "./state";
export { applyBrackets } from "./federal";
export type { FilingStatus, TaxInput, TaxResult } from "./types";

/**
 * Main tax computation entry point.
 * Accepts a structured TaxInput (from extracted W-2 fields) and returns
 * a fully computed TaxResult for tax year 2026.
 */
export function computeTax(input: TaxInput): TaxResult {
  const {
    wagesBox1,
    federalWithheldBox2,
    socialSecurityWithheldBox4,
    medicareWithheldBox6,
    stateWithheldBox17,
    state,
    filingStatus,
  } = input;

  // ── Federal income tax ───────────────────────────────────────────────────

  const { taxableIncome: federalTaxableIncome, federalTax } =
    computeFederalIncomeTax(wagesBox1, filingStatus);

  const federalRefundOrOwed = parseFloat(
    (federalWithheldBox2 - federalTax).toFixed(2),
  );

  // ── FICA ─────────────────────────────────────────────────────────────────

  const { socialSecurityTax, medicareTax } = computeFICA(wagesBox1, filingStatus);

  const ssRefundOrOwed = parseFloat(
    (socialSecurityWithheldBox4 - socialSecurityTax).toFixed(2),
  );
  const medicareRefundOrOwed = parseFloat(
    (medicareWithheldBox6 - medicareTax).toFixed(2),
  );

  // ── State tax ─────────────────────────────────────────────────────────────

  const { stateTaxableIncome, stateTax, sdiTax } = computeStateTax(
    wagesBox1,
    filingStatus,
    state,
  );

  const stateRefundOrOwed = parseFloat(
    (stateWithheldBox17 - stateTax).toFixed(2),
  );

  // ── Summary ───────────────────────────────────────────────────────────────

  const totalTaxOwed = parseFloat(
    (federalTax + socialSecurityTax + medicareTax + stateTax + sdiTax).toFixed(2),
  );
  const totalWithheld = parseFloat(
    (
      federalWithheldBox2 +
      socialSecurityWithheldBox4 +
      medicareWithheldBox6 +
      stateWithheldBox17
    ).toFixed(2),
  );
  const totalRefundOrOwed = parseFloat((totalWithheld - totalTaxOwed).toFixed(2));

  const effectiveFederalRate =
    wagesBox1 > 0
      ? parseFloat(((federalTax / wagesBox1) * 100).toFixed(2))
      : 0;
  const effectiveStateRate =
    wagesBox1 > 0
      ? parseFloat((((stateTax + sdiTax) / wagesBox1) * 100).toFixed(2))
      : 0;

  const result: TaxResult = {
    federal: {
      grossIncome: wagesBox1,
      taxableIncome: federalTaxableIncome,
      taxOwed: federalTax,
      withheld: federalWithheldBox2,
      refundOrOwed: federalRefundOrOwed,
    },
    fica: {
      socialSecurityOwed: socialSecurityTax,
      socialSecurityWithheld: socialSecurityWithheldBox4,
      socialSecurityRefundOrOwed: ssRefundOrOwed,
      medicareOwed: medicareTax,
      medicareWithheld: medicareWithheldBox6,
      medicareRefundOrOwed,
    },
    state: {
      state,
      taxableIncome: stateTaxableIncome,
      taxOwed: stateTax,
      sdiOwed: sdiTax,
      withheld: stateWithheldBox17,
      refundOrOwed: stateRefundOrOwed,
    },
    summary: {
      totalTaxOwed,
      totalWithheld,
      totalRefundOrOwed,
      effectiveFederalRate,
      effectiveStateRate,
    },
  };

  console.log("TAX ENGINE RESULT:", JSON.stringify(result, null, 2));

  return result;
}
