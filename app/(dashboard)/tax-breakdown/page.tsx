"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Info,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Percent,
  FileText,
  AlertCircle,
  Minus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

// ─── Sample data (replace with real API data) ─────────────────────────────────

const TAX_DATA = {
  grossIncome: 87450,
  freelanceIncome: 24800,
  interestIncome: 320,
  totalIncome: 112570,

  iraContribution: 6500,
  studentLoanInterest: 2500,
  totalAdjustments: 9000,

  agi: 103570,
  standardDeduction: 14600,
  taxableIncomeFederal: 88970,

  federalTax: 15290,
  selfEmploymentTax: 3508,
  californiaAGI: 103570,
  californiaDeduction: 5202,
  californiaTaxableIncome: 98368,
  californiaTax: 7218,

  childTaxCredit: 0,
  earnedIncomeCredit: 0,
  totalCredits: 0,

  federalWithheld: 14320,
  californiaWithheld: 5820,
  estimatedPayments: 0,
  totalPayments: 20140,

  totalTaxLiability: 26016,
  federalRefundOwed: -970,
  californiaRefundOwed: -1398,
  combinedRefundOwed: -2368,
};

const federalBrackets = [
  { bracket: "10%",  upTo: 11600,  rate: 0.10, color: "#3b82f6" },
  { bracket: "12%",  upTo: 47150,  rate: 0.12, color: "#6366f1" },
  { bracket: "22%",  upTo: 100525, rate: 0.22, color: "#8b5cf6" },
  { bracket: "24%",  upTo: 191950, rate: 0.24, color: "#a855f7" },
  { bracket: "32%",  upTo: 243725, rate: 0.32, color: "#d946ef" },
  { bracket: "35%",  upTo: 609350, rate: 0.35, color: "#ec4899" },
  { bracket: "37%",  upTo: Infinity, rate: 0.37, color: "#f43f5e" },
];

const bracketChartData = [
  { name: "10%",  tax: 1160  },
  { name: "12%",  tax: 4266  },
  { name: "22%",  tax: 9218  },
  { name: "24%",  tax: 556   },
  { name: "32%",  tax: 0     },
  { name: "35%",  tax: 0     },
  { name: "37%",  tax: 0     },
];

const waterfallData = [
  { label: "Gross Income",    value: 112570, type: "positive" },
  { label: "Adjustments",    value: -9000,  type: "negative"  },
  { label: "Deductions",     value: -14600, type: "negative"  },
  { label: "Taxable Income", value: 88970,  type: "result"    },
  { label: "Federal Tax",    value: -15290, type: "tax"       },
  { label: "CA Tax",         value: -7218,  type: "tax"       },
  { label: "Credits",        value: 0,      type: "positive"  },
  { label: "Payments",       value: 20140,  type: "payment"   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, abs = false) {
  const v = abs ? Math.abs(n) : n;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

const effectiveRate = fmtPct((TAX_DATA.federalTax / TAX_DATA.taxableIncomeFederal) * 100);
const marginalBracket = federalBrackets.find((b) => TAX_DATA.taxableIncomeFederal <= b.upTo)?.bracket ?? "22%";

// ─── Sub-components ───────────────────────────────────────────────────────────

interface AccordionSectionProps {
  id: string;
  stepNumber: number;
  stepTotal: number;
  title: string;
  subtitle: string;
  amount: number | null;
  amountLabel?: string;
  isComplete?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({
  stepNumber,
  stepTotal,
  title,
  subtitle,
  amount,
  amountLabel = "",
  isComplete = true,
  isOpen,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <div className="accordion-item">
      <button type="button" onClick={onToggle} className="accordion-trigger">
        <div className="flex items-center gap-4 min-w-0">
          {/* Step number */}
          <div className={`step-number shrink-0 ${isComplete ? "step-number-complete" : "step-number-active"}`}>
            {isComplete ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/50">
                {stepNumber}/{stepTotal}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {amount !== null && (
            <span className={`font-numeric text-sm font-bold tabular-nums ${amount < 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
              {amount < 0 ? `(${fmt(amount, true)})` : fmt(amount)}
            </span>
          )}
          {amountLabel && (
            <span className="hidden text-xs text-muted-foreground sm:block">{amountLabel}</span>
          )}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground/50" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground/50" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="accordion-content">
          {children}
        </div>
      )}
    </div>
  );
}

function LineItem({
  label,
  value,
  sub,
  bold = false,
  dimmed = false,
  separator = false,
}: {
  label: string;
  value: string;
  sub?: string;
  bold?: boolean;
  dimmed?: boolean;
  separator?: boolean;
}) {
  return (
    <>
      {separator && <div className="my-3 border-t border-border/60" />}
      <div className={`flex items-center justify-between py-1.5 ${dimmed ? "opacity-50" : ""}`}>
        <div>
          <p className={`text-sm ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
            {label}
          </p>
          {sub && <p className="text-xs text-muted-foreground/60">{sub}</p>}
        </div>
        <p className={`font-numeric text-sm tabular-nums ${bold ? "font-bold text-foreground" : "text-foreground"}`}>
          {value}
        </p>
      </div>
    </>
  );
}

interface TooltipPayload {
  payload: {
    name: string;
    tax: number;
  };
}

function BracketTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-foreground">Bracket: {payload[0].payload.name}</p>
      <p className="font-numeric text-sm font-bold text-foreground">{fmt(payload[0].payload.tax)}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 6;

export default function TaxBreakdownPage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["income"]));

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const isOpen = (id: string) => openSections.has(id);

  const isOwed = TAX_DATA.combinedRefundOwed < 0;

  return (
    <div className="flex flex-col">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Tax Breakdown</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Tax Year 2025 · Single · California Resident
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="badge-warning">
              <AlertCircle className="h-3 w-3" />
              Estimated — review all values
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">

        {/* ── Summary bar ──────────────────────────────────────────────── */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Income",
              value: fmt(TAX_DATA.totalIncome),
              Icon: DollarSign,
              color: "text-blue-500 bg-blue-500/10",
            },
            {
              label: "Total Tax",
              value: fmt(TAX_DATA.totalTaxLiability),
              Icon: TrendingUp,
              color: "text-amber-500 bg-amber-500/10",
            },
            {
              label: "Effective Rate",
              value: effectiveRate,
              Icon: Percent,
              color: "text-purple-500 bg-purple-500/10",
            },
            {
              label: isOwed ? "Amount Owed" : "Estimated Refund",
              value: fmt(TAX_DATA.combinedRefundOwed, true),
              Icon: isOwed ? TrendingDown : TrendingUp,
              color: isOwed
                ? "text-red-500 bg-red-500/10"
                : "text-emerald-500 bg-emerald-500/10",
            },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="ts-card flex items-center gap-4 p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="font-numeric text-lg font-bold text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Disclaimer ───────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <span className="font-semibold">Estimated figures only.</span>{" "}
            These calculations are based on extracted document data and standard deduction assumptions.
            Consult a licensed CPA or tax professional before filing. Figures may not reflect all income, credits, or deductions.
          </p>
        </div>

        {/* ── Main content: two columns on large screens ──────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Left col: accordion steps */}
          <div className="space-y-3 lg:col-span-2">

            {/* ── Step 1: Income ───────────────────────────────────────── */}
            <AccordionSection
              id="income"
              stepNumber={1}
              stepTotal={TOTAL_STEPS}
              title="Total Income"
              subtitle="All sources: wages, self-employment, interest"
              amount={TAX_DATA.totalIncome}
              isOpen={isOpen("income")}
              onToggle={() => toggleSection("income")}
            >
              <div className="space-y-0.5">
                <LineItem label="W-2 Wages (Acme Corporation)" value={fmt(TAX_DATA.grossIncome)} sub="Box 1" />
                <LineItem label="1099-NEC Freelance Income" value={fmt(TAX_DATA.freelanceIncome)} sub="Startup Inc." />
                <LineItem label="1099-INT Interest Income" value={fmt(TAX_DATA.interestIncome)} sub="Savings account" />
                <LineItem label="Total Income" value={fmt(TAX_DATA.totalIncome)} bold separator />
              </div>
            </AccordionSection>

            {/* ── Step 2: Adjustments (Above-the-line deductions) ──────── */}
            <AccordionSection
              id="adjustments"
              stepNumber={2}
              stepTotal={TOTAL_STEPS}
              title="Adjustments to Income"
              subtitle="Above-the-line deductions that reduce AGI"
              amount={-TAX_DATA.totalAdjustments}
              amountLabel="reduces AGI"
              isOpen={isOpen("adjustments")}
              onToggle={() => toggleSection("adjustments")}
            >
              <div className="space-y-0.5">
                <LineItem label="IRA Contribution (Traditional)" value={`(${fmt(TAX_DATA.iraContribution)})`} sub="Deductible — Pub. 590-A" />
                <LineItem label="Student Loan Interest" value={`(${fmt(TAX_DATA.studentLoanInterest)})`} sub="Form 1098-E" />
                <LineItem label="Total Adjustments" value={`(${fmt(TAX_DATA.totalAdjustments)})`} bold separator />
                <LineItem label="Adjusted Gross Income (AGI)" value={fmt(TAX_DATA.agi)} bold />
              </div>
              <div className="mt-4 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 px-4 py-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-semibold">Your AGI ({fmt(TAX_DATA.agi)})</span> determines eligibility for many credits and deductions. A lower AGI can unlock additional tax benefits.
                </p>
              </div>
            </AccordionSection>

            {/* ── Step 3: Deductions ───────────────────────────────────── */}
            <AccordionSection
              id="deductions"
              stepNumber={3}
              stepTotal={TOTAL_STEPS}
              title="Deductions"
              subtitle="Standard deduction vs. itemized — whichever is greater"
              amount={-TAX_DATA.standardDeduction}
              amountLabel="standard"
              isOpen={isOpen("deductions")}
              onToggle={() => toggleSection("deductions")}
            >
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">Standard Deduction</p>
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">Recommended</span>
                  </div>
                  <p className="font-numeric mt-2 text-2xl font-bold text-blue-700 dark:text-blue-300">{fmt(TAX_DATA.standardDeduction)}</p>
                  <p className="mt-1 text-xs text-blue-600/70 dark:text-blue-400/60">Single filer · 2025</p>
                </div>
                <div className="rounded-xl border border-border p-4 opacity-60">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Itemized Deductions</p>
                  <p className="font-numeric mt-2 text-2xl font-bold text-muted-foreground">—</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">No itemized items found</p>
                </div>
              </div>
              <LineItem label="Taxable Income (Federal)" value={fmt(TAX_DATA.taxableIncomeFederal)} bold />
              <p className="mt-2 text-xs text-muted-foreground/60">
                AGI {fmt(TAX_DATA.agi)} − Standard Deduction {fmt(TAX_DATA.standardDeduction)} = {fmt(TAX_DATA.taxableIncomeFederal)}
              </p>
            </AccordionSection>

            {/* ── Step 4: Federal Tax ──────────────────────────────────── */}
            <AccordionSection
              id="federal"
              stepNumber={4}
              stepTotal={TOTAL_STEPS}
              title="Federal Income Tax"
              subtitle="Calculated using 2025 progressive tax brackets"
              amount={TAX_DATA.federalTax}
              amountLabel={`${marginalBracket} marginal bracket`}
              isOpen={isOpen("federal")}
              onToggle={() => toggleSection("federal")}
            >
              {/* Bracket chart */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Tax by bracket
                </p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={bracketChartData} barSize={28} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<BracketTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" />
                    <Bar dataKey="tax" radius={[3, 3, 0, 0]}>
                      {bracketChartData.map((_, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={bracketChartData[i].tax > 0 ? federalBrackets[i].color : "hsl(var(--muted))"}
                          opacity={bracketChartData[i].tax > 0 ? 1 : 0.3}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-0.5">
                <LineItem label="Taxable income" value={fmt(TAX_DATA.taxableIncomeFederal)} />
                <LineItem label="Federal income tax" value={fmt(TAX_DATA.federalTax)} />
                <LineItem label="Self-employment tax (SE)" value={fmt(TAX_DATA.selfEmploymentTax)} sub="15.3% on freelance net" />
                <LineItem label="Total Federal Tax" value={fmt(TAX_DATA.federalTax + TAX_DATA.selfEmploymentTax)} bold separator />
              </div>

              <div className="mt-3 flex gap-3">
                <div className="flex-1 rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Effective Rate</p>
                  <p className="font-numeric text-lg font-bold text-foreground">{effectiveRate}</p>
                </div>
                <div className="flex-1 rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Marginal Rate</p>
                  <p className="font-numeric text-lg font-bold text-foreground">{marginalBracket}</p>
                </div>
              </div>
            </AccordionSection>

            {/* ── Step 5: California Tax ───────────────────────────────── */}
            <AccordionSection
              id="california"
              stepNumber={5}
              stepTotal={TOTAL_STEPS}
              title="California State Tax"
              subtitle="FTB 540 — CA uses its own brackets and deductions"
              amount={TAX_DATA.californiaTax}
              isOpen={isOpen("california")}
              onToggle={() => toggleSection("california")}
            >
              <div className="space-y-0.5">
                <LineItem label="California AGI" value={fmt(TAX_DATA.californiaAGI)} sub="Generally same as federal AGI" />
                <LineItem label="CA Standard Deduction" value={`(${fmt(TAX_DATA.californiaDeduction)})`} />
                <LineItem label="CA Taxable Income" value={fmt(TAX_DATA.californiaTaxableIncome)} bold separator />
                <LineItem label="CA Income Tax" value={fmt(TAX_DATA.californiaTax)} bold />
              </div>
              <div className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  California does not allow the same adjustments as federal. Capital gains are taxed as ordinary income. The CA SDI rate is 1.1% on wages.
                </p>
              </div>
            </AccordionSection>

            {/* ── Step 6: Final Calculation ────────────────────────────── */}
            <AccordionSection
              id="final"
              stepNumber={6}
              stepTotal={TOTAL_STEPS}
              title="Final Result"
              subtitle="Tax liability minus credits and withholding"
              amount={TAX_DATA.combinedRefundOwed}
              amountLabel={TAX_DATA.combinedRefundOwed < 0 ? "total owed" : "total refund"}
              isOpen={isOpen("final")}
              onToggle={() => toggleSection("final")}
            >
              <div className="space-y-0.5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Federal</p>
                <LineItem label="Federal Tax + SE Tax" value={fmt(TAX_DATA.federalTax + TAX_DATA.selfEmploymentTax)} />
                <LineItem label="Federal Tax Credits" value={TAX_DATA.totalCredits === 0 ? "—" : `(${fmt(TAX_DATA.totalCredits)})`} dimmed={TAX_DATA.totalCredits === 0} />
                <LineItem label="Federal Withholding" value={`(${fmt(TAX_DATA.federalWithheld)})`} />
                <LineItem
                  label={TAX_DATA.federalRefundOwed < 0 ? "Federal Amount Owed" : "Federal Refund"}
                  value={fmt(TAX_DATA.federalRefundOwed, true)}
                  bold
                  separator
                />

                <p className="mb-3 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">California</p>
                <LineItem label="California Income Tax" value={fmt(TAX_DATA.californiaTax)} />
                <LineItem label="California Withholding (W-2)" value={`(${fmt(TAX_DATA.californiaWithheld)})`} />
                <LineItem
                  label={TAX_DATA.californiaRefundOwed < 0 ? "CA Amount Owed" : "CA Refund"}
                  value={fmt(TAX_DATA.californiaRefundOwed, true)}
                  bold
                  separator
                />
              </div>

              {/* Final result callout */}
              <div className={`mt-5 rounded-xl border-2 p-5 text-center ${
                isOwed
                  ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
                  : "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30"
              }`}>
                <p className={`text-sm font-semibold ${isOwed ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                  {isOwed ? "You owe an estimated" : "Estimated total refund"}
                </p>
                <p className={`font-numeric mt-1 text-4xl font-bold tabular-nums ${isOwed ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                  {fmt(TAX_DATA.combinedRefundOwed, true)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {isOwed
                    ? "Federal + California combined. Due by April 15, 2026."
                    : "Federal + California combined. Typically issued within 21 days of filing."}
                </p>
              </div>
            </AccordionSection>
          </div>

          {/* Right col: sidebar summary */}
          <div className="space-y-4">

            {/* Calculation flow */}
            <div className="ts-card p-5">
              <h3 className="section-title mb-4">Calculation flow</h3>
              <div className="space-y-0">
                {[
                  { label: "Gross Income",     value: fmt(TAX_DATA.totalIncome),           icon: DollarSign, color: "text-blue-500"   },
                  { label: "− Adjustments",    value: `(${fmt(TAX_DATA.totalAdjustments)})`, icon: Minus,   color: "text-muted-foreground" },
                  { label: "= AGI",            value: fmt(TAX_DATA.agi),                   icon: null,       color: "text-foreground", bold: true },
                  { label: "− Deductions",     value: `(${fmt(TAX_DATA.standardDeduction)})`, icon: Minus,  color: "text-muted-foreground" },
                  { label: "= Taxable Income", value: fmt(TAX_DATA.taxableIncomeFederal),  icon: null,       color: "text-foreground", bold: true },
                  { label: "Federal Tax",      value: fmt(TAX_DATA.federalTax),            icon: TrendingUp, color: "text-amber-500"  },
                  { label: "California Tax",   value: fmt(TAX_DATA.californiaTax),         icon: TrendingUp, color: "text-amber-500"  },
                  { label: "− Withholding",    value: `(${fmt(TAX_DATA.totalPayments)})`,  icon: Minus,      color: "text-emerald-500" },
                ].map(({ label, value, color, bold }, i) => (
                  <div key={i} className={`flex items-center justify-between py-2 ${i < 7 ? "border-b border-border/50" : ""}`}>
                    <p className={`text-xs ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</p>
                    <p className={`font-numeric text-xs font-semibold tabular-nums ${color}`}>{value}</p>
                  </div>
                ))}
                <div className={`mt-2 flex items-center justify-between rounded-lg px-3 py-3 ${
                  isOwed ? "bg-red-50 dark:bg-red-950/30" : "bg-emerald-50 dark:bg-emerald-950/30"
                }`}>
                  <p className={`text-sm font-bold ${isOwed ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                    {isOwed ? "Owed" : "Refund"}
                  </p>
                  <p className={`font-numeric text-sm font-bold tabular-nums ${isOwed ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                    {fmt(TAX_DATA.combinedRefundOwed, true)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tax-saving tips */}
            <div className="ts-card p-5">
              <h3 className="section-title mb-3">Potential savings</h3>
              <div className="space-y-3">
                {[
                  {
                    title: "Contribute to HSA",
                    desc: "Up to $4,150 deductible (single). Reduces federal and CA AGI.",
                    saving: "~$1,100",
                    color: "text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950",
                  },
                  {
                    title: "Max out 401(k)",
                    desc: "$23,000 limit. Deferred income reduces current-year tax.",
                    saving: "~$5,060",
                    color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950",
                  },
                  {
                    title: "CA Renter's Credit",
                    desc: "$60 non-refundable credit if you paid rent all year.",
                    saving: "$60",
                    color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950",
                  },
                ].map(({ title, desc, saving, color }) => (
                  <div key={title} className="flex items-start gap-3">
                    <span className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${color}`}>
                      {saving}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filing info */}
            <div className="ts-card p-5">
              <h3 className="section-title mb-3">Filing info</h3>
              <div className="space-y-2">
                {[
                  { label: "Filing status",     value: "Single"          },
                  { label: "Tax year",           value: "2025"            },
                  { label: "State",              value: "California"      },
                  { label: "Forms",              value: "1040, FTB 540"   },
                  { label: "Federal deadline",   value: "April 15, 2026"  },
                  { label: "CA deadline",        value: "April 15, 2026"  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xs font-medium text-foreground">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground/60">
                <FileText className="h-3.5 w-3.5" />
                Ask the Tax Assistant for questions
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
