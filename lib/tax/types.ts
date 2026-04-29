export type FilingStatus =
  | "single"
  | "marriedFilingJointly"
  | "marriedFilingSeparately"
  | "headOfHousehold";

export interface TaxInput {
  wagesBox1: number;
  federalWithheldBox2: number;
  socialSecurityWithheldBox4: number;
  medicareWithheldBox6: number;
  stateWithheldBox17: number;
  state: string; // two-letter state code e.g. "CA"
  filingStatus: FilingStatus;
}

export interface TaxResult {
  federal: {
    grossIncome: number;
    taxableIncome: number;
    taxOwed: number;
    withheld: number;
    refundOrOwed: number; // positive = refund, negative = owed
  };
  fica: {
    socialSecurityOwed: number;
    socialSecurityWithheld: number;
    socialSecurityRefundOrOwed: number;
    medicareOwed: number;
    medicareWithheld: number;
    medicareRefundOrOwed: number;
  };
  state: {
    state: string;
    taxableIncome: number;
    taxOwed: number;
    sdiOwed: number;
    withheld: number;
    refundOrOwed: number; // positive = refund, negative = owed
  };
  summary: {
    totalTaxOwed: number;
    totalWithheld: number;
    totalRefundOrOwed: number; // positive = refund, negative = owed
    effectiveFederalRate: number; // percentage e.g. 12.34
    effectiveStateRate: number;   // percentage e.g. 1.14
  };
}
