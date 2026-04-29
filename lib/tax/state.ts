import type { FilingStatus } from "./types";
import { CA_TAX_CONFIG_2026 } from "./constants";
import { applyBrackets } from "./federal";

// ─── California ───────────────────────────────────────────────────────────────

export function computeCAStateTax(
  grossIncome: number,
  filingStatus: FilingStatus,
): { stateTaxableIncome: number; stateTax: number; sdiTax: number } {
  const deduction =
    CA_TAX_CONFIG_2026.standardDeduction[filingStatus] ??
    CA_TAX_CONFIG_2026.standardDeduction.single;
  const stateTaxableIncome = Math.max(0, grossIncome - deduction);

  const brackets =
    CA_TAX_CONFIG_2026.brackets[filingStatus] ??
    CA_TAX_CONFIG_2026.brackets.single;
  let stateTax = applyBrackets(stateTaxableIncome, brackets);

  // Mental Health Services Tax: 1% on income above $1M
  if (grossIncome > CA_TAX_CONFIG_2026.mentalHealthServicesTax.threshold) {
    stateTax += parseFloat(
      (
        (grossIncome - CA_TAX_CONFIG_2026.mentalHealthServicesTax.threshold) *
        CA_TAX_CONFIG_2026.mentalHealthServicesTax.rate
      ).toFixed(2),
    );
  }

  // SDI: 0.9% on all wages, no wage base cap in 2026
  const sdiTax = parseFloat((grossIncome * CA_TAX_CONFIG_2026.sdi.rate).toFixed(2));

  return {
    stateTaxableIncome,
    stateTax: parseFloat(stateTax.toFixed(2)),
    sdiTax,
  };
}

// ─── Other states ─────────────────────────────────────────────────────────────
// TODO: add progressive brackets for remaining 49 states + DC

export function computeStateTax(
  grossIncome: number,
  filingStatus: FilingStatus,
  stateCode: string,
): { stateTaxableIncome: number; stateTax: number; sdiTax: number } {
  const code = stateCode.trim().toUpperCase();

  if (code === "CA") {
    return computeCAStateTax(grossIncome, filingStatus);
  }

  // All other states: return zeros until progressive brackets are added
  return { stateTaxableIncome: 0, stateTax: 0, sdiTax: 0 };
}
