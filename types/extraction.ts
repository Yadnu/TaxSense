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

// ─── Form 1098 (mortgage interest; common layout) ───────────────────────────

export const FORM_1098_FIELD_DEFS: FieldDef[] = [
  { name: "lender_name",                     group: "lender_info",     label: "Lender Name" },
  { name: "lender_address",                  group: "lender_info",     label: "Lender Address" },
  { name: "lender_phone",                    group: "lender_info",     label: "Lender Phone" },
  { name: "lender_tin",                      group: "lender_info",     label: "Lender TIN / EIN" },
  { name: "borrower_name",                   group: "borrower_info",   label: "Borrower Name" },
  { name: "borrower_address",                group: "borrower_info",   label: "Borrower Address" },
  { name: "borrower_tin",                    group: "borrower_info",   label: "Borrower SSN / TIN" },
  { name: "account_number",                  group: "loan_detail",     label: "Account Number" },
  { name: "mortgage_interest_received",      group: "loan_detail",     label: "Mortgage Interest Received",          boxNumber: "1" },
  { name: "outstanding_mortgage_principal",  group: "loan_detail",     label: "Outstanding Mortgage Principal",    boxNumber: "2" },
  { name: "mortgage_origination_date",       group: "loan_detail",     label: "Mortgage Origination Date",         boxNumber: "3" },
  { name: "refund_of_overpaid_interest",     group: "loan_detail",     label: "Refund of Overpaid Interest",       boxNumber: "4" },
  { name: "mortgage_insurance_premiums",     group: "loan_detail",     label: "Mortgage Insurance Premiums",       boxNumber: "5" },
  { name: "points_paid_on_purchase",           group: "loan_detail",     label: "Points Paid on Purchase",           boxNumber: "6" },
  { name: "property_address",                group: "loan_detail",     label: "Property Address",                  boxNumber: "8" },
  { name: "tax_year",                        group: "loan_detail",     label: "Tax Year" },
];

// ─── Form 1095 (health coverage; A/B/C variants) ─────────────────────────────

export const FORM_1095_FIELD_DEFS: FieldDef[] = [
  { name: "form_subtype",                    group: "issuer_info",     label: "Form Variant (A / B / C)" },
  { name: "issuer_name",                     group: "issuer_info",     label: "Issuer / Employer / Insurance Name" },
  { name: "issuer_ein",                      group: "issuer_info",     label: "Issuer EIN" },
  { name: "recipient_name",                  group: "recipient_info",  label: "Recipient / Employee Name" },
  { name: "recipient_ssn",                   group: "recipient_info",  label: "Recipient SSN" },
  { name: "policy_number",                   group: "coverage",        label: "Policy Number" },
  { name: "plan_name",                       group: "coverage",        label: "Plan Name" },
  { name: "coverage_start",                  group: "coverage",        label: "Coverage Start Date" },
  { name: "coverage_end",                    group: "coverage",        label: "Coverage End Date" },
  { name: "annual_premium_total",            group: "coverage",        label: "Annual Premium or Total Premium" },
  { name: "covered_individuals_summary",     group: "coverage",        label: "Covered Individuals (summary)" },
];

// ─── Receipt ─────────────────────────────────────────────────────────────────

export const RECEIPT_FIELD_DEFS: FieldDef[] = [
  { name: "merchant_name",                   group: "merchant_info",   label: "Merchant Name" },
  { name: "merchant_address",                group: "merchant_info",   label: "Merchant Address" },
  { name: "transaction_date",                group: "merchant_info",   label: "Transaction Date" },
  { name: "receipt_id",                      group: "merchant_info",   label: "Receipt / Order ID" },
  { name: "currency",                        group: "totals",          label: "Currency" },
  { name: "subtotal",                        group: "totals",          label: "Subtotal" },
  { name: "sales_tax",                       group: "totals",          label: "Sales Tax" },
  { name: "tip",                             group: "totals",          label: "Tip" },
  { name: "total",                           group: "totals",          label: "Total" },
  { name: "payment_method",                  group: "payment",         label: "Payment Method" },
  { name: "items_description",               group: "payment",         label: "Line Items (summary text)" },
];

// ─── Bank statement ──────────────────────────────────────────────────────────

export const BANK_STATEMENT_FIELD_DEFS: FieldDef[] = [
  { name: "financial_institution",           group: "account",         label: "Financial Institution" },
  { name: "account_holder_name",             group: "account",         label: "Account Holder Name" },
  { name: "account_type",                    group: "account",         label: "Account Type" },
  { name: "account_last_four",               group: "account",         label: "Account Number (last 4)" },
  { name: "statement_start_date",            group: "statement_period", label: "Statement Start Date" },
  { name: "statement_end_date",              group: "statement_period", label: "Statement End Date" },
  { name: "beginning_balance",               group: "balances",        label: "Beginning Balance" },
  { name: "ending_balance",                  group: "balances",        label: "Ending Balance" },
  { name: "total_credits",                   group: "activity",        label: "Total Deposits / Credits" },
  { name: "total_debits",                    group: "activity",        label: "Total Withdrawals / Debits" },
];

// ─── Other / unknown layout ──────────────────────────────────────────────────

export const OTHER_FIELD_DEFS: FieldDef[] = [
  { name: "document_title",                  group: "summary",         label: "Document Title" },
  { name: "issuer_or_party",                 group: "summary",         label: "Issuer or Primary Party" },
  { name: "primary_date",                    group: "summary",         label: "Primary Date" },
  { name: "total_amount",                    group: "summary",         label: "Total Amount (if any)" },
  { name: "topic_summary",                   group: "summary",         label: "One-line Summary" },
  { name: "extracted_notes",                 group: "summary",         label: "Visible Content Notes" },
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
    case "FORM_1098":     return FORM_1098_FIELD_DEFS;
    case "FORM_1095":     return FORM_1095_FIELD_DEFS;
    case "RECEIPT":       return RECEIPT_FIELD_DEFS;
    case "BANK_STATEMENT": return BANK_STATEMENT_FIELD_DEFS;
    case "OTHER":         return OTHER_FIELD_DEFS;
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
  lender_info:       "Lender Information",
  borrower_info:     "Borrower Information",
  loan_detail:       "Loan / Mortgage Details",
  issuer_info:       "Issuer Information",
  coverage:          "Coverage",
  merchant_info:     "Merchant",
  totals:            "Totals",
  payment:           "Payment",
  account:           "Account",
  statement_period:  "Statement Period",
  balances:          "Balances",
  activity:          "Activity",
  summary:           "Summary",
  other:             "Other",
};

/** Returns the display order for field groups (lower = shown first). */
export const FIELD_GROUP_ORDER: Record<string, number> = {
  employer_info:     1,
  payer_info:        1,
  taxpayer_info:     1,
  lender_info:       1,
  issuer_info:       1,
  merchant_info:     1,
  account:           1,
  summary:           1,
  employee_info:     2,
  recipient_info:    2,
  borrower_info:     2,
  visa_residency:    3,
  loan_detail:       3,
  coverage:          3,
  totals:            4,
  balances:          4,
  income:            4,
  adjustments:       5,
  deductions:        5,
  tax_and_credits:   6,
  payments:          7,
  withholding:       7,
  payment:           7,
  activity:          7,
  state_local:       8,
  statement_period:  8,
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
  | "FORM_1099_R"
  | "FORM_1098"
  | "FORM_1095"
  | "RECEIPT"
  | "BANK_STATEMENT"
  | "OTHER";

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
    "FORM_1098",
    "FORM_1095",
    "RECEIPT",
    "BANK_STATEMENT",
    "OTHER",
  ];
  return supported.includes(docType);
}
