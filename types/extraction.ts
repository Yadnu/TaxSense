import { z } from "zod";
import type { DocumentType } from "@prisma/client";

// ─── Core extracted field result shape ────────────────────────────────────────
// This mirrors the ExtractedField DB model (return shape for OCR / AI parsing).

export const ExtractedFieldResultSchema = z.object({
  fieldName: z.string(),
  fieldValue: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  pageNumber: z.number().int().nullable().default(null),
  fieldGroup: z.string(),
});

export type ExtractedFieldResult = z.infer<typeof ExtractedFieldResultSchema>;

/** Wrapper schema for the full LLM JSON response. */
export const LLMExtractionOutputSchema = z.object({
  fields: z.array(ExtractedFieldResultSchema),
});

export type LLMExtractionOutput = z.infer<typeof LLMExtractionOutputSchema>;

// ─── Shared field definition type ─────────────────────────────────────────────

export interface FieldDef {
  name: string;
  group: string;
  label: string;
  /** IRS box number (W-2, 1099) */
  boxNumber?: string;
  /** IRS line number (1040, 1040-NR) */
  lineNumber?: string;
}

// ─── W-2 field definitions ────────────────────────────────────────────────────

export const W2_FIELD_DEFS: FieldDef[] = [
  // Employer information
  { name: "employer_name",                   group: "employer_info",   label: "Employer Name" },
  { name: "employer_address",                group: "employer_info",   label: "Employer Address" },
  { name: "employer_ein",                    group: "employer_info",   label: "Employer EIN" },
  // Employee information
  { name: "employee_name",                   group: "employee_info",   label: "Employee Name" },
  { name: "employee_address",                group: "employee_info",   label: "Employee Address" },
  { name: "employee_ssn",                    group: "employee_info",   label: "Employee SSN" },
  // Income (boxes 1, 3, 5, 7–11)
  { name: "wages_tips_other_compensation",   group: "income",          label: "Wages, Tips, Other Compensation",  boxNumber: "1" },
  { name: "social_security_wages",           group: "income",          label: "Social Security Wages",             boxNumber: "3" },
  { name: "medicare_wages_and_tips",         group: "income",          label: "Medicare Wages & Tips",             boxNumber: "5" },
  { name: "social_security_tips",            group: "income",          label: "Social Security Tips",              boxNumber: "7" },
  { name: "allocated_tips",                  group: "income",          label: "Allocated Tips",                    boxNumber: "8" },
  { name: "dependent_care_benefits",         group: "income",          label: "Dependent Care Benefits",           boxNumber: "10" },
  { name: "nonqualified_plans",              group: "income",          label: "Nonqualified Plans",                boxNumber: "11" },
  // Federal withholding (boxes 2, 4, 6)
  { name: "federal_income_tax_withheld",     group: "withholding",     label: "Federal Income Tax Withheld",       boxNumber: "2" },
  { name: "social_security_tax_withheld",    group: "withholding",     label: "Social Security Tax Withheld",      boxNumber: "4" },
  { name: "medicare_tax_withheld",           group: "withholding",     label: "Medicare Tax Withheld",             boxNumber: "6" },
  // State & local (boxes 15–20)
  { name: "state",                           group: "state_local",     label: "State",                             boxNumber: "15" },
  { name: "employer_state_id",               group: "state_local",     label: "Employer State ID Number",          boxNumber: "15" },
  { name: "state_wages_tips",                group: "state_local",     label: "State Wages, Tips, Etc.",           boxNumber: "16" },
  { name: "state_income_tax",                group: "state_local",     label: "State Income Tax",                  boxNumber: "17" },
  { name: "local_wages_tips",                group: "state_local",     label: "Local Wages, Tips, Etc.",           boxNumber: "18" },
  { name: "local_income_tax",                group: "state_local",     label: "Local Income Tax",                  boxNumber: "19" },
  { name: "locality_name",                   group: "state_local",     label: "Locality Name",                     boxNumber: "20" },
];

// ─── Form 1040 field definitions ──────────────────────────────────────────────

export const FORM_1040_FIELD_DEFS: FieldDef[] = [
  // Taxpayer information
  { name: "first_name",                            group: "taxpayer_info",     label: "First Name" },
  { name: "last_name",                             group: "taxpayer_info",     label: "Last Name" },
  { name: "ssn",                                   group: "taxpayer_info",     label: "Social Security Number" },
  { name: "spouse_first_name",                     group: "taxpayer_info",     label: "Spouse First Name" },
  { name: "spouse_last_name",                      group: "taxpayer_info",     label: "Spouse Last Name" },
  { name: "spouse_ssn",                            group: "taxpayer_info",     label: "Spouse SSN" },
  { name: "address",                               group: "taxpayer_info",     label: "Home Address" },
  { name: "city_state_zip",                        group: "taxpayer_info",     label: "City, State, ZIP" },
  { name: "filing_status",                         group: "taxpayer_info",     label: "Filing Status" },
  // Income
  { name: "total_wages_salaries_tips",             group: "income",            label: "Total Wages, Salaries, Tips",            lineNumber: "1z" },
  { name: "taxable_interest",                      group: "income",            label: "Taxable Interest",                       lineNumber: "2b" },
  { name: "ordinary_dividends",                    group: "income",            label: "Ordinary Dividends",                     lineNumber: "3b" },
  { name: "ira_distributions",                     group: "income",            label: "IRA Distributions (taxable)",            lineNumber: "4b" },
  { name: "pension_annuities",                     group: "income",            label: "Pensions & Annuities (taxable)",         lineNumber: "5b" },
  { name: "social_security_benefits",              group: "income",            label: "Social Security Benefits (taxable)",     lineNumber: "6b" },
  { name: "capital_gain_or_loss",                  group: "income",            label: "Capital Gain or (Loss)",                 lineNumber: "7" },
  { name: "other_income",                          group: "income",            label: "Additional Income (Schedule 1)",         lineNumber: "8" },
  { name: "total_income",                          group: "income",            label: "Total Income",                           lineNumber: "9" },
  // Adjustments
  { name: "adjustments_to_income",                 group: "adjustments",       label: "Adjustments to Income",                  lineNumber: "10" },
  { name: "adjusted_gross_income",                 group: "adjustments",       label: "Adjusted Gross Income",                  lineNumber: "11" },
  // Tax and credits
  { name: "standard_or_itemized_deduction",        group: "tax_and_credits",   label: "Standard or Itemized Deduction",         lineNumber: "12" },
  { name: "qualified_business_income_deduction",   group: "tax_and_credits",   label: "QBI Deduction",                          lineNumber: "13" },
  { name: "taxable_income",                        group: "tax_and_credits",   label: "Taxable Income",                         lineNumber: "15" },
  { name: "tax",                                   group: "tax_and_credits",   label: "Tax",                                    lineNumber: "16" },
  { name: "alternative_minimum_tax",               group: "tax_and_credits",   label: "Alternative Minimum Tax",                lineNumber: "17" },
  { name: "child_tax_credit",                      group: "tax_and_credits",   label: "Child Tax Credit",                       lineNumber: "19" },
  { name: "total_credits",                         group: "tax_and_credits",   label: "Total Credits",                          lineNumber: "21" },
  { name: "total_tax",                             group: "tax_and_credits",   label: "Total Tax",                              lineNumber: "24" },
  // Payments
  { name: "federal_income_tax_withheld",           group: "payments",          label: "Federal Income Tax Withheld",            lineNumber: "25" },
  { name: "estimated_tax_payments",                group: "payments",          label: "Estimated Tax Payments",                 lineNumber: "26" },
  { name: "earned_income_credit",                  group: "payments",          label: "Earned Income Credit",                   lineNumber: "27" },
  { name: "refundable_child_tax_credit",           group: "payments",          label: "Refundable Child Tax Credit",            lineNumber: "28" },
  { name: "total_payments",                        group: "payments",          label: "Total Payments",                         lineNumber: "33" },
  // Refund or balance due
  { name: "refund_amount",                         group: "refund_or_balance",  label: "Refund Amount",                         lineNumber: "35a" },
  { name: "amount_applied_next_year",              group: "refund_or_balance",  label: "Amount Applied to Next Year",           lineNumber: "36" },
  { name: "amount_owed",                           group: "refund_or_balance",  label: "Amount Owed",                           lineNumber: "37" },
  { name: "estimated_tax_penalty",                 group: "refund_or_balance",  label: "Estimated Tax Penalty",                 lineNumber: "38" },
];

// ─── Form 1040-NR field definitions ───────────────────────────────────────────

export const FORM_1040NR_FIELD_DEFS: FieldDef[] = [
  // Taxpayer information
  { name: "first_name",                               group: "taxpayer_info",     label: "First Name" },
  { name: "last_name",                                group: "taxpayer_info",     label: "Last Name" },
  { name: "ssn_or_itin",                              group: "taxpayer_info",     label: "SSN or ITIN" },
  { name: "address_in_us",                            group: "taxpayer_info",     label: "US Address" },
  { name: "foreign_address",                          group: "taxpayer_info",     label: "Foreign Address" },
  { name: "country_of_citizenship",                   group: "taxpayer_info",     label: "Country of Citizenship" },
  // Visa & residency
  { name: "visa_type",                                group: "visa_residency",    label: "Visa Type" },
  { name: "date_entered_us",                          group: "visa_residency",    label: "Date Entered US" },
  { name: "date_left_us",                             group: "visa_residency",    label: "Date Left US" },
  { name: "number_of_days_in_us",                     group: "visa_residency",    label: "Number of Days in US" },
  { name: "treaty_country",                           group: "visa_residency",    label: "Tax Treaty Country" },
  { name: "treaty_article",                           group: "visa_residency",    label: "Treaty Article Number" },
  // Effectively connected income
  { name: "wages_salaries_tips",                      group: "income",            label: "Wages, Salaries, Tips" },
  { name: "taxable_interest",                         group: "income",            label: "Taxable Interest" },
  { name: "ordinary_dividends",                       group: "income",            label: "Ordinary Dividends" },
  { name: "taxable_ira_distributions",                group: "income",            label: "IRA Distributions (taxable)" },
  { name: "capital_gain_or_loss",                     group: "income",            label: "Capital Gain or (Loss)" },
  { name: "other_income",                             group: "income",            label: "Other Income" },
  { name: "total_effectively_connected_income",       group: "income",            label: "Total Effectively Connected Income" },
  { name: "nonresident_fixed_determinable_income",    group: "income",            label: "NEC Income (Schedule NEC)" },
  // Deductions
  { name: "adjusted_gross_income",                    group: "deductions",        label: "Adjusted Gross Income" },
  { name: "standard_deduction",                       group: "deductions",        label: "Standard Deduction" },
  { name: "itemized_deductions",                      group: "deductions",        label: "Itemized Deductions" },
  // Tax and credits
  { name: "tax",                                      group: "tax_and_credits",   label: "Tax" },
  { name: "total_tax",                                group: "tax_and_credits",   label: "Total Tax" },
  // Payments
  { name: "federal_income_tax_withheld",              group: "payments",          label: "Federal Income Tax Withheld" },
  { name: "total_payments",                           group: "payments",          label: "Total Payments" },
  // Refund or balance due
  { name: "refund_amount",                            group: "refund_or_balance",  label: "Refund Amount" },
  { name: "amount_owed",                              group: "refund_or_balance",  label: "Amount Owed" },
];

// ─── Form 1099 field definitions (covers NEC, INT, DIV, MISC, R) ──────────────

export const FORM_1099_FIELD_DEFS: FieldDef[] = [
  // Payer information
  { name: "form_subtype",                    group: "payer_info",      label: "Form Subtype (NEC / INT / DIV / MISC / R)" },
  { name: "payer_name",                      group: "payer_info",      label: "Payer Name" },
  { name: "payer_address",                   group: "payer_info",      label: "Payer Address" },
  { name: "payer_tin",                       group: "payer_info",      label: "Payer TIN / EIN" },
  // Recipient information
  { name: "recipient_name",                  group: "recipient_info",  label: "Recipient Name" },
  { name: "recipient_address",               group: "recipient_info",  label: "Recipient Address" },
  { name: "recipient_tin",                   group: "recipient_info",  label: "Recipient SSN / TIN" },
  // Income amounts (generic box labels — model adapts per subtype)
  { name: "box_1_amount",                    group: "income",          label: "Box 1 Amount",  boxNumber: "1" },
  { name: "box_2_amount",                    group: "income",          label: "Box 2 Amount",  boxNumber: "2" },
  { name: "box_3_amount",                    group: "income",          label: "Box 3 Amount",  boxNumber: "3" },
  { name: "box_4_amount",                    group: "income",          label: "Box 4 Amount",  boxNumber: "4" },
  { name: "box_5_amount",                    group: "income",          label: "Box 5 Amount",  boxNumber: "5" },
  { name: "box_6_amount",                    group: "income",          label: "Box 6 Amount",  boxNumber: "6" },
  { name: "box_7_amount",                    group: "income",          label: "Box 7 Amount",  boxNumber: "7" },
  { name: "box_8_amount",                    group: "income",          label: "Box 8 Amount",  boxNumber: "8" },
  // Withholding
  { name: "federal_income_tax_withheld",     group: "withholding",     label: "Federal Income Tax Withheld" },
  { name: "state_tax_withheld",              group: "withholding",     label: "State Tax Withheld" },
  { name: "state",                           group: "withholding",     label: "State" },
  { name: "state_payer_id",                  group: "withholding",     label: "State Payer ID" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the field definitions for a given document type. */
export function getFieldDefsForDocType(docType: string): FieldDef[] {
  switch (docType) {
    case "W2":            return W2_FIELD_DEFS;
    case "FORM_1040":     return FORM_1040_FIELD_DEFS;
    case "FORM_1040_NR":  return FORM_1040NR_FIELD_DEFS;
    case "FORM_1099":
    case "FORM_1099_NEC":
    case "FORM_1099_INT":
    case "FORM_1099_DIV":
    case "FORM_1099_MISC":
    case "FORM_1099_R":   return FORM_1099_FIELD_DEFS;
    default:              return [];
  }
}

/**
 * Looks up the human-readable label for a fieldName given a document type.
 * Falls back to a prettified version of the snake_case name.
 */
export function getFieldLabel(fieldName: string, docType: string): string {
  const defs = getFieldDefsForDocType(docType);
  const def = defs.find((d) => d.name === fieldName);
  if (def) return def.label;
  // Prettify snake_case or camelCase as fallback
  return fieldName
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Human-readable labels for fieldGroup values. */
export const FIELD_GROUP_LABELS: Record<string, string> = {
  employer_info:     "Employer Information",
  employee_info:     "Employee Information",
  income:            "Income",
  withholding:       "Federal Withholding",
  state_local:       "State & Local",
  taxpayer_info:     "Taxpayer Information",
  filing_status:     "Filing Status",
  adjustments:       "Adjustments to Income",
  tax_and_credits:   "Tax & Credits",
  payments:          "Payments",
  refund_or_balance: "Refund or Balance Due",
  visa_residency:    "Visa & Residency",
  deductions:        "Deductions",
  payer_info:        "Payer Information",
  recipient_info:    "Recipient Information",
  other:             "Other",
};

/** Returns the display order for field groups (lower = shown first). */
export const FIELD_GROUP_ORDER: Record<string, number> = {
  employer_info:     1,
  payer_info:        1,
  taxpayer_info:     1,
  employee_info:     2,
  recipient_info:    2,
  visa_residency:    3,
  income:            4,
  adjustments:       5,
  deductions:        5,
  tax_and_credits:   6,
  payments:          7,
  withholding:       7,
  state_local:       8,
  refund_or_balance: 9,
  other:             10,
};

/** Supported document types that have structured extraction support. */
export type SupportedDocType =
  | "W2"
  | "FORM_1040"
  | "FORM_1040_NR"
  | "FORM_1099"
  | "FORM_1099_NEC"
  | "FORM_1099_INT"
  | "FORM_1099_DIV"
  | "FORM_1099_MISC"
  | "FORM_1099_R";

export function isSupportedDocType(docType: DocumentType): boolean {
  const supported: DocumentType[] = [
    "W2",
    "FORM_1040",
    "FORM_1040_NR",
    "FORM_1099",
    "FORM_1099_NEC",
    "FORM_1099_INT",
    "FORM_1099_DIV",
    "FORM_1099_MISC",
    "FORM_1099_R",
  ];
  return supported.includes(docType);
}
