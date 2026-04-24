"use client";

import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  Percent,
  MapPin,
  Receipt,
  BadgeCheck,
  Minus,
  ChevronRight,
} from "lucide-react";
import type { TaxSummary, BracketResult } from "@/lib/tax/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, abs = false): string {
  const v = abs ? Math.abs(n) : n;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(v);
}

function fmtPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

function fmtRate(r: number): string {
  return `${(r * 100).toFixed(0)}%`;
}

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
  CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
  IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming", DC: "D.C.",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`ts-card p-5 ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="section-title">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function DataRow({
  label,
  value,
  bold = false,
  separator = false,
  highlight,
  sub,
}: {
  label: string;
  value: string;
  bold?: boolean;
  separator?: boolean;
  highlight?: "refund" | "owed";
  sub?: string;
}) {
  const valueColor =
    highlight === "refund"
      ? "text-emerald-600 dark:text-emerald-400"
      : highlight === "owed"
        ? "text-red-600 dark:text-red-400"
        : "text-foreground";

  return (
    <>
      {separator && <div className="my-2.5 border-t border-border/50" />}
      <div className="flex items-center justify-between py-1.5">
        <div>
          <p
            className={`text-sm ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}
          >
            {label}
          </p>
          {sub && <p className="text-xs text-muted-foreground/60">{sub}</p>}
        </div>
        <p
          className={`font-numeric text-sm tabular-nums ${bold ? "font-bold" : "font-medium"} ${valueColor}`}
        >
          {value}
        </p>
      </div>
    </>
  );
}

function RefundOwedCallout({
  amount,
  label,
}: {
  amount: number;
  label: string;
}) {
  const isOwed = amount < 0;
  return (
    <div
      className={`mt-4 rounded-xl border-2 p-4 text-center ${
        isOwed
          ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
          : "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${
          isOwed
            ? "text-red-700 dark:text-red-400"
            : "text-emerald-700 dark:text-emerald-400"
        }`}
      >
        {label}
      </p>
      <p
        className={`font-numeric mt-1 text-2xl font-bold tabular-nums ${
          isOwed
            ? "text-red-700 dark:text-red-400"
            : "text-emerald-700 dark:text-emerald-400"
        }`}
      >
        {fmt(amount, true)}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TaxSummaryPanelProps {
  summary: TaxSummary;
  stateCode?: string;
}

export function TaxSummaryPanel({ summary, stateCode }: TaxSummaryPanelProps) {
  const stateName = stateCode
    ? (STATE_NAMES[stateCode.toUpperCase()] ?? stateCode.toUpperCase())
    : "State";

  const isOwed = summary.totalRefundOrOwed < 0;
  const federalIsOwed = summary.federalRefundOrOwed < 0;
  const stateIsOwed = summary.stateRefundOrOwed < 0;

  // Only show brackets that have taxable income
  const activeBrackets = summary.federalTaxBrackets.filter(
    (b: BracketResult) => b.taxableIncome > 0,
  );

  return (
    <div className="space-y-4">
      {/* ── Overall Summary hero ───────────────────────────────────────── */}
      <div
        className={`rounded-2xl border-2 p-6 ${
          isOwed
            ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
            : "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
        }`}
      >
        <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p
              className={`text-sm font-semibold ${isOwed ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}
            >
              {isOwed ? "Total Estimated Amount Owed" : "Total Estimated Refund"}
            </p>
            <p
              className={`font-numeric mt-0.5 text-4xl font-bold tabular-nums ${isOwed ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}
            >
              {fmt(summary.totalRefundOrOwed, true)}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Federal + {stateName} combined · Tax year {summary.taxYear}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:text-right">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Effective Federal Rate
              </p>
              <p className="font-numeric text-lg font-bold text-foreground">
                {fmtPct(summary.effectiveFederalRate)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Effective State Rate
              </p>
              <p className="font-numeric text-lg font-bold text-foreground">
                {fmtPct(summary.effectiveStateRate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick stats row ────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Gross Income",
            value: fmt(summary.grossIncome),
            Icon: DollarSign,
            color: "text-blue-500 bg-blue-500/10",
          },
          {
            label: "Taxable Income",
            value: fmt(summary.taxableIncome),
            Icon: Receipt,
            color: "text-amber-500 bg-amber-500/10",
          },
          {
            label: "Total Liability",
            value: fmt(summary.totalTaxLiability),
            Icon: TrendingUp,
            color: "text-rose-500 bg-rose-500/10",
          },
          {
            label: "Total Withheld",
            value: fmt(summary.totalWithheld),
            Icon: BadgeCheck,
            color: "text-emerald-500 bg-emerald-500/10",
          },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="ts-card flex items-center gap-4 p-4">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="font-numeric text-base font-bold tabular-nums text-foreground">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Income Summary ────────────────────────────────────────────── */}
        <SectionCard title="Income Summary" icon={DollarSign}>
          <div className="space-y-0.5">
            <DataRow label="Gross Income" value={fmt(summary.grossIncome)} />
            <DataRow
              label="Adjusted Gross Income (AGI)"
              value={fmt(summary.adjustedGrossIncome)}
            />
            <DataRow
              label="Taxable Income"
              value={fmt(summary.taxableIncome)}
              bold
              separator
            />
          </div>
        </SectionCard>

        {/* ── Deductions ────────────────────────────────────────────────── */}
        <SectionCard title="Deductions" icon={Minus}>
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                summary.deductionType === "standard"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
              }`}
            >
              {summary.deductionType === "standard" ? "Standard" : "Itemized"}
            </span>
            <span className="text-xs text-muted-foreground">deduction applied</span>
          </div>
          <div className="space-y-0.5">
            <DataRow
              label={
                summary.deductionType === "standard"
                  ? "Standard Deduction"
                  : "Itemized Deductions"
              }
              value={fmt(summary.deductionAmount)}
              bold
            />
            <DataRow
              label="AGI after deduction"
              value={fmt(summary.adjustedGrossIncome - summary.deductionAmount)}
              sub="= Taxable Income"
            />
          </div>
        </SectionCard>
      </div>

      {/* ── Federal Tax ───────────────────────────────────────────────── */}
      <SectionCard title="Federal Income Tax" icon={Receipt}>
        {activeBrackets.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="py-2 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Rate
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Income in Bracket
                  </th>
                  <th className="py-2 pl-2 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tax
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {activeBrackets.map((b: BracketResult, i: number) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2 pl-4 pr-2">
                      <span className="inline-flex items-center gap-1 font-numeric font-semibold text-foreground">
                        <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                        {fmtRate(b.rate)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right font-numeric tabular-nums text-muted-foreground">
                      {fmt(b.taxableIncome)}
                    </td>
                    <td className="py-2 pl-2 pr-4 text-right font-numeric font-semibold tabular-nums text-foreground">
                      {fmt(b.taxAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30">
                  <td colSpan={2} className="py-2 pl-4 pr-2 text-sm font-semibold text-foreground">
                    Total Federal Tax
                  </td>
                  <td className="py-2 pl-2 pr-4 text-right font-numeric font-bold tabular-nums text-foreground">
                    {fmt(summary.federalTaxBeforeCredits)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="space-y-0.5">
          <DataRow
            label="Federal Tax (before credits)"
            value={fmt(summary.federalTaxBeforeCredits)}
          />
          {summary.selfEmploymentTax > 0 && (
            <DataRow
              label="Self-Employment Tax"
              value={fmt(summary.selfEmploymentTax)}
              sub="15.3% on net SE income × 0.9235"
            />
          )}
          {summary.totalCredits > 0 && (
            <DataRow
              label="Credits Applied"
              value={`(${fmt(summary.totalCredits)})`}
            />
          )}
          <DataRow
            label="Federal Tax After Credits"
            value={fmt(summary.federalTaxAfterCredits)}
            bold
            separator
          />
          <DataRow
            label="Federal Tax Withheld"
            value={fmt(summary.federalTaxWithheld)}
          />
        </div>
        <RefundOwedCallout
          amount={summary.federalRefundOrOwed}
          label={federalIsOwed ? "Federal Amount Owed" : "Federal Refund"}
        />
      </SectionCard>

      {/* ── FICA ─────────────────────────────────────────────────────── */}
      {(summary.socialSecurityTaxWithheld > 0 ||
        summary.medicareTaxWithheld > 0) && (
        <SectionCard title="FICA Withholding" icon={BadgeCheck}>
          <div className="space-y-0.5">
            <DataRow
              label="Social Security Withheld"
              value={fmt(summary.socialSecurityTaxWithheld)}
              sub="6.2% up to wage base"
            />
            <DataRow
              label="Medicare Withheld"
              value={fmt(summary.medicareTaxWithheld)}
              sub="1.45% on all wages"
            />
            <DataRow
              label="Total FICA Withheld"
              value={fmt(
                summary.socialSecurityTaxWithheld + summary.medicareTaxWithheld,
              )}
              bold
              separator
            />
          </div>
        </SectionCard>
      )}

      {/* ── State Tax ────────────────────────────────────────────────── */}
      <SectionCard title={`${stateName} State Tax`} icon={MapPin}>
        <div className="space-y-0.5">
          <DataRow
            label="State Taxable Income"
            value={fmt(summary.stateTaxableIncome)}
          />
          <DataRow
            label="State Tax Rate"
            value={fmtPct(summary.stateTaxRate * 100)}
            sub="Flat effective rate (v1)"
          />
          <DataRow
            label="State Tax Liability"
            value={fmt(summary.stateTaxLiability)}
            bold
            separator
          />
          <DataRow
            label="State Tax Withheld"
            value={fmt(summary.stateTaxWithheld)}
          />
        </div>
        <RefundOwedCallout
          amount={summary.stateRefundOrOwed}
          label={stateIsOwed ? "State Amount Owed" : "State Refund"}
        />
      </SectionCard>

      {/* ── Combined Summary ──────────────────────────────────────────── */}
      <SectionCard title="Combined Summary" icon={Percent}>
        <div className="space-y-0.5">
          <DataRow label="Federal Tax Liability" value={fmt(summary.federalTaxAfterCredits)} />
          <DataRow label="State Tax Liability" value={fmt(summary.stateTaxLiability)} />
          <DataRow
            label="Total Tax Liability"
            value={fmt(summary.totalTaxLiability)}
            bold
            separator
          />
          <DataRow label="Total Withheld" value={fmt(summary.totalWithheld)} />
          <DataRow
            label={isOwed ? "Total Amount Owed" : "Total Refund"}
            value={fmt(summary.totalRefundOrOwed, true)}
            bold
            separator
            highlight={isOwed ? "owed" : "refund"}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Effective Federal Rate
            </p>
            <p className="font-numeric mt-0.5 text-xl font-bold text-foreground">
              {fmtPct(summary.effectiveFederalRate)}
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Effective State Rate
            </p>
            <p className="font-numeric mt-0.5 text-xl font-bold text-foreground">
              {fmtPct(summary.effectiveStateRate)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5">
          <TrendingDown className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Estimated figures only. Consult a licensed tax professional before filing.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
