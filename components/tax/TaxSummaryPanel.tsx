"use client";

import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  Percent,
  MapPin,
  Receipt,
  BadgeCheck,
  ChevronRight,
} from "lucide-react";
import type { TaxResult } from "@/lib/tax/types";

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
  summary: TaxResult;
  stateCode?: string;
}

export function TaxSummaryPanel({ summary, stateCode }: TaxSummaryPanelProps) {
  const resolvedStateCode = stateCode ?? summary.state.state;
  const stateName = resolvedStateCode
    ? (STATE_NAMES[resolvedStateCode.toUpperCase()] ?? resolvedStateCode.toUpperCase())
    : "State";

  const isOwed         = summary.summary.totalRefundOrOwed < 0;
  const federalIsOwed  = summary.federal.refundOrOwed < 0;
  const stateIsOwed    = summary.state.refundOrOwed < 0;

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
              {fmt(summary.summary.totalRefundOrOwed, true)}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Federal + {stateName} combined · Tax year 2026
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:text-right">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Effective Federal Rate
              </p>
              <p className="font-numeric text-lg font-bold text-foreground">
                {fmtPct(summary.summary.effectiveFederalRate)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Effective State Rate
              </p>
              <p className="font-numeric text-lg font-bold text-foreground">
                {fmtPct(summary.summary.effectiveStateRate)}
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
            value: fmt(summary.federal.grossIncome),
            Icon: DollarSign,
            color: "text-blue-500 bg-blue-500/10",
          },
          {
            label: "Federal Taxable Income",
            value: fmt(summary.federal.taxableIncome),
            Icon: Receipt,
            color: "text-amber-500 bg-amber-500/10",
          },
          {
            label: "Total Liability",
            value: fmt(summary.summary.totalTaxOwed),
            Icon: TrendingUp,
            color: "text-rose-500 bg-rose-500/10",
          },
          {
            label: "Total Withheld",
            value: fmt(summary.summary.totalWithheld),
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

      {/* ── Federal Income Tax ────────────────────────────────────────── */}
      <SectionCard title="Federal Income Tax" icon={Receipt}>
        <div className="space-y-0.5">
          <DataRow
            label="Gross Income"
            value={fmt(summary.federal.grossIncome)}
          />
          <DataRow
            label="Federal Taxable Income"
            value={fmt(summary.federal.taxableIncome)}
            sub="After standard deduction ($15,000 single / $30,000 MFJ)"
          />
          <DataRow
            label="Federal Tax Owed"
            value={fmt(summary.federal.taxOwed)}
            bold
            separator
          />
          <DataRow
            label="Federal Tax Withheld"
            value={fmt(summary.federal.withheld)}
          />
        </div>
        <RefundOwedCallout
          amount={summary.federal.refundOrOwed}
          label={federalIsOwed ? "Federal Amount Owed" : "Federal Refund"}
        />
      </SectionCard>

      {/* ── FICA ─────────────────────────────────────────────────────── */}
      {(summary.fica.socialSecurityWithheld > 0 || summary.fica.medicareWithheld > 0) && (
        <SectionCard title="FICA" icon={BadgeCheck}>
          <div className="space-y-0.5">
            <DataRow
              label="Social Security Owed"
              value={fmt(summary.fica.socialSecurityOwed)}
              sub="6.2% up to $176,100 wage base"
            />
            <DataRow
              label="Social Security Withheld"
              value={fmt(summary.fica.socialSecurityWithheld)}
            />
            <DataRow
              label="SS Refund / Owed"
              value={fmt(summary.fica.socialSecurityRefundOrOwed, true)}
              highlight={summary.fica.socialSecurityRefundOrOwed >= 0 ? "refund" : "owed"}
              bold
              separator
            />
            <DataRow
              label="Medicare Owed"
              value={fmt(summary.fica.medicareOwed)}
              sub="1.45% + 0.9% above threshold"
            />
            <DataRow
              label="Medicare Withheld"
              value={fmt(summary.fica.medicareWithheld)}
            />
            <DataRow
              label="Medicare Refund / Owed"
              value={fmt(summary.fica.medicareRefundOrOwed, true)}
              highlight={summary.fica.medicareRefundOrOwed >= 0 ? "refund" : "owed"}
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
            value={fmt(summary.state.taxableIncome)}
            sub={resolvedStateCode === "CA" ? "After CA standard deduction ($5,540 single)" : undefined}
          />
          <DataRow
            label="State Income Tax Owed"
            value={fmt(summary.state.taxOwed)}
            bold
          />
          {summary.state.sdiOwed > 0 && (
            <DataRow
              label="SDI (State Disability Insurance)"
              value={fmt(summary.state.sdiOwed)}
              sub="0.9% on all wages — no cap"
            />
          )}
          <DataRow
            label="State Tax Withheld"
            value={fmt(summary.state.withheld)}
            separator
          />
        </div>
        {summary.state.taxOwed > 0 || summary.state.withheld > 0 ? (
          <RefundOwedCallout
            amount={summary.state.refundOrOwed}
            label={stateIsOwed ? "State Amount Owed" : "State Refund"}
          />
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Progressive state brackets for {stateName} are not yet available. Federal result above is complete.
          </p>
        )}
      </SectionCard>

      {/* ── Combined Summary ──────────────────────────────────────────── */}
      <SectionCard title="Combined Summary" icon={Percent}>
        <div className="space-y-0.5">
          <DataRow label="Federal Tax Owed"  value={fmt(summary.federal.taxOwed)} />
          <DataRow
            label="FICA Owed"
            value={fmt(summary.fica.socialSecurityOwed + summary.fica.medicareOwed)}
            sub="Social Security + Medicare"
          />
          <DataRow label="State Tax Owed"    value={fmt(summary.state.taxOwed)} />
          {summary.state.sdiOwed > 0 && (
            <DataRow label="SDI Owed"          value={fmt(summary.state.sdiOwed)} />
          )}
          <DataRow
            label="Total Tax Owed"
            value={fmt(summary.summary.totalTaxOwed)}
            bold
            separator
          />
          <DataRow label="Total Withheld"    value={fmt(summary.summary.totalWithheld)} />
          <DataRow
            label={isOwed ? "Total Amount Owed" : "Total Refund"}
            value={fmt(summary.summary.totalRefundOrOwed, true)}
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
              {fmtPct(summary.summary.effectiveFederalRate)}
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Effective State Rate
            </p>
            <p className="font-numeric mt-0.5 text-xl font-bold text-foreground">
              {fmtPct(summary.summary.effectiveStateRate)}
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

      {/* ── Per-bracket breakdown ─────────────────────────────────────── */}
      <SectionCard title="Federal Bracket Breakdown" icon={ChevronRight}>
        <p className="text-sm text-muted-foreground">
          Progressive bracket detail is computed but not exposed in the current engine output.
          Federal taxable income of {fmt(summary.federal.taxableIncome)} produces{" "}
          <span className="font-semibold text-foreground">{fmt(summary.federal.taxOwed)}</span> in federal income tax.
        </p>
      </SectionCard>
    </div>
  );
}
