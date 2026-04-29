import type { FilingStatus } from "./types";
import { FEDERAL_TAX_CONFIG_2026, type TaxBracket } from "./constants";

// ─── Shared bracket helper ────────────────────────────────────────────────────

export function applyBrackets(
  taxableIncome: number,
  brackets: TaxBracket[],
): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const inBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += inBracket * bracket.rate;
  }
  return parseFloat(tax.toFixed(2));
}

// ─── Federal income tax ───────────────────────────────────────────────────────

export function computeFederalIncomeTax(
  grossIncome: number,
  filingStatus: FilingStatus,
): { taxableIncome: number; federalTax: number } {
  const deduction =
    FEDERAL_TAX_CONFIG_2026.standardDeduction[filingStatus] ??
    FEDERAL_TAX_CONFIG_2026.standardDeduction.single;
  const taxableIncome = Math.max(0, grossIncome - deduction);
  const brackets =
    FEDERAL_TAX_CONFIG_2026.brackets[filingStatus] ??
    FEDERAL_TAX_CONFIG_2026.brackets.single;
  const federalTax = applyBrackets(taxableIncome, brackets);
  return { taxableIncome, federalTax };
}

// ─── FICA ─────────────────────────────────────────────────────────────────────

export function computeFICA(
  grossIncome: number,
  filingStatus: FilingStatus,
): { socialSecurityTax: number; medicareTax: number } {
  const { fica } = FEDERAL_TAX_CONFIG_2026;

  const socialSecurityTax = parseFloat(
    (Math.min(grossIncome, fica.socialSecurityWageBase) * fica.socialSecurityRate).toFixed(2),
  );

  const additionalThreshold = fica.additionalMedicareThreshold[filingStatus];
  const medicareTax =
    grossIncome <= additionalThreshold
      ? parseFloat((grossIncome * fica.medicareRate).toFixed(2))
      : parseFloat(
          (
            additionalThreshold * fica.medicareRate +
            (grossIncome - additionalThreshold) *
              (fica.medicareRate + fica.additionalMedicareRate)
          ).toFixed(2),
        );

  return { socialSecurityTax, medicareTax };
}
