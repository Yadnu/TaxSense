import type { FilingStatus, TaxInput } from './types';

// Maps common raw field name variants to canonical TaxInput keys.
// Handles both snake_case and camelCase from different document types.
const FIELD_ALIASES: Record<string, keyof TaxInput> = {
  // W-2 Box 1 — wages
  wages_tips_other:         'wagesTipsOther',
  wagestipsother:           'wagesTipsOther',
  box1:                     'wagesTipsOther',
  box_1:                    'wagesTipsOther',
  wages:                    'wagesTipsOther',
  // W-2 Box 2 — federal withholding
  federal_tax_withheld:     'federalTaxWithheld',
  federaltaxwithheld:       'federalTaxWithheld',
  box2:                     'federalTaxWithheld',
  box_2:                    'federalTaxWithheld',
  federal_income_tax_withheld: 'federalTaxWithheld',
  // W-2 Box 17 / state withholding
  state_tax_withheld:       'stateTaxWithheld',
  statetaxwithheld:         'stateTaxWithheld',
  box17:                    'stateTaxWithheld',
  box_17:                   'stateTaxWithheld',
  state_income_tax:         'stateTaxWithheld',
  // W-2 Box 4 — SS withheld
  social_security_tax_withheld:  'socialSecurityTaxWithheld',
  socialsecuritytaxwithheld:     'socialSecurityTaxWithheld',
  box4:                          'socialSecurityTaxWithheld',
  box_4:                         'socialSecurityTaxWithheld',
  // W-2 Box 6 — Medicare withheld
  medicare_tax_withheld:    'medicareTaxWithheld',
  medicaretaxwithheld:      'medicareTaxWithheld',
  box6:                     'medicareTaxWithheld',
  box_6:                    'medicareTaxWithheld',
  // W-2 Box 15 — state
  state:                    'state',
  state_code:               'state',
  employer_state:           'state',
  // 1099-NEC
  nonemployee_compensation: 'selfEmploymentIncome',
  self_employment_income:   'selfEmploymentIncome',
  selfemploymentincome:     'selfEmploymentIncome',
  nec_amount:               'selfEmploymentIncome',
  box1_1099nec:             'selfEmploymentIncome',
  // 1099-INT
  interest_income:          'interestIncome',
  interestincome:           'interestIncome',
  interest_earned:          'interestIncome',
  box1_1099int:             'interestIncome',
  // 1099-DIV
  ordinary_dividends:       'ordinaryDividends',
  ordinarydividends:        'ordinaryDividends',
  total_ordinary_dividends: 'ordinaryDividends',
  box1a:                    'ordinaryDividends',
  qualified_dividends:      'qualifiedDividends',
  qualifieddividends:       'qualifiedDividends',
  box1b:                    'qualifiedDividends',
  // Credits / dependents
  dependents:               'dependents',
  number_of_dependents:     'dependents',
  student_loan_interest_paid: 'studentLoanInterestPaid',
  studentloaninterestpaid:    'studentLoanInterestPaid',
  student_loan_interest:      'studentLoanInterestPaid',
};

function normalizeKey(raw: string): string {
  return raw.toLowerCase().replace(/[\s-]/g, '_');
}

function parseNum(v: string | undefined): number {
  if (!v) return 0;
  const cleaned = v.replace(/[$,\s]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function normalizeStateCode(raw: string): string {
  const trimmed = raw.trim().toUpperCase();
  // Already a 2-letter code
  if (trimmed.length === 2) return trimmed;
  // Simple map for full state names to codes
  const STATE_NAMES: Record<string, string> = {
    ALABAMA: 'AL', ALASKA: 'AK', ARIZONA: 'AZ', ARKANSAS: 'AR',
    CALIFORNIA: 'CA', COLORADO: 'CO', CONNECTICUT: 'CT', DELAWARE: 'DE',
    FLORIDA: 'FL', GEORGIA: 'GA', HAWAII: 'HI', IDAHO: 'ID',
    ILLINOIS: 'IL', INDIANA: 'IN', IOWA: 'IA', KANSAS: 'KS',
    KENTUCKY: 'KY', LOUISIANA: 'LA', MAINE: 'ME', MARYLAND: 'MD',
    MASSACHUSETTS: 'MA', MICHIGAN: 'MI', MINNESOTA: 'MN', MISSISSIPPI: 'MS',
    MISSOURI: 'MO', MONTANA: 'MT', NEBRASKA: 'NE', NEVADA: 'NV',
    'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM',
    'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND',
    OHIO: 'OH', OKLAHOMA: 'OK', OREGON: 'OR', PENNSYLVANIA: 'PA',
    'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC', 'SOUTH DAKOTA': 'SD',
    TENNESSEE: 'TN', TEXAS: 'TX', UTAH: 'UT', VERMONT: 'VT',
    VIRGINIA: 'VA', WASHINGTON: 'WA', 'WEST VIRGINIA': 'WV',
    WISCONSIN: 'WI', WYOMING: 'WY', 'DISTRICT OF COLUMBIA': 'DC',
  };
  return STATE_NAMES[trimmed] ?? trimmed.slice(0, 2);
}

export function normalizeFields(
  rawFields: Record<string, string>,
  filingStatus: FilingStatus,
  overrides?: Partial<TaxInput>,
): TaxInput {
  // Resolve raw field values by alias lookup
  const resolved: Partial<Record<keyof TaxInput, string>> = {};

  for (const [rawKey, rawValue] of Object.entries(rawFields)) {
    const key = normalizeKey(rawKey);
    // Try exact alias match
    const canonical = FIELD_ALIASES[key];
    if (canonical) {
      // Only set if not already set by a higher-priority key
      if (!resolved[canonical]) {
        resolved[canonical] = rawValue;
      }
    } else {
      // Try camelCase match by normalizing the raw key
      const camelNorm = rawKey
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '');
      const camelCanonical = FIELD_ALIASES[camelNorm];
      if (camelCanonical && !resolved[camelCanonical]) {
        resolved[camelCanonical] = rawValue;
      }
    }
  }

  const stateRaw = resolved.state ?? '';
  const state = stateRaw ? normalizeStateCode(stateRaw) : 'CA';

  const input: TaxInput = {
    taxYear: 2026,
    filingStatus,
    wagesTipsOther:             parseNum(resolved.wagesTipsOther),
    federalTaxWithheld:         parseNum(resolved.federalTaxWithheld),
    stateTaxWithheld:           parseNum(resolved.stateTaxWithheld),
    socialSecurityTaxWithheld:  parseNum(resolved.socialSecurityTaxWithheld),
    medicareTaxWithheld:        parseNum(resolved.medicareTaxWithheld),
    state,
    selfEmploymentIncome:       parseNum(resolved.selfEmploymentIncome),
    interestIncome:             parseNum(resolved.interestIncome),
    ordinaryDividends:          parseNum(resolved.ordinaryDividends),
    qualifiedDividends:         parseNum(resolved.qualifiedDividends),
    useItemizedDeductions:      false,
    itemizedDeductions:         0,
    dependents:                 parseNum(resolved.dependents),
    hasChildTaxCredit:          false,
    hasEarnedIncomeCredit:      false,
    studentLoanInterestPaid:    parseNum(resolved.studentLoanInterestPaid),
  };

  // Apply overrides last
  if (overrides) {
    return { ...input, ...overrides };
  }

  return input;
}
