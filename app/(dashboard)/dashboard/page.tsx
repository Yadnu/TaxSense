import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  Table2,
  Bot,
  FileCheck2,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Circle,
  TrendingUp,
  DollarSign,
  Percent,
  Minus,
} from "lucide-react";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";

const steps = [
  {
    n: 1,
    label: "Upload your tax documents",
    desc: "W-2, 1099-NEC, 1099-INT, receipts, and more",
    href: "/documents",
    done: false,
  },
  {
    n: 2,
    label: "Review extracted data",
    desc: "Verify fields and correct any errors",
    href: "/extracted-data",
    done: false,
  },
  {
    n: 3,
    label: "View your tax breakdown",
    desc: "See your income, deductions, and estimated tax",
    href: "/tax-breakdown",
    done: false,
  },
  {
    n: 4,
    label: "Ask the Tax Assistant",
    desc: "Get answers to your California tax questions",
    href: "/chat",
    done: false,
  },
];

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();

  const completedSteps = steps.filter((s) => s.done).length;
  const progressPct = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="flex flex-col">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {user?.firstName ? `Welcome back, ${user.firstName}` : "Dashboard"}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Tax Year 2025 · California FTB 540
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="badge-neutral">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Filing in progress
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">

        {/* ── Financial summary cards ───────────────────────────── */}
        <section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Income */}
            <div className="stat-card ts-animate-in ts-delay-1">
              <div className="flex items-center justify-between">
                <p className="stat-label">Total Income</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <p className="stat-value mt-1">—</p>
              <p className="stat-sub">Upload documents to calculate</p>
            </div>

            {/* Estimated Tax */}
            <div className="stat-card ts-animate-in ts-delay-2">
              <div className="flex items-center justify-between">
                <p className="stat-label">Estimated Tax</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="stat-value mt-1">—</p>
              <p className="stat-sub">Federal + California combined</p>
            </div>

            {/* Effective Rate */}
            <div className="stat-card ts-animate-in ts-delay-3">
              <div className="flex items-center justify-between">
                <p className="stat-label">Effective Rate</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 dark:text-purple-400">
                  <Percent className="h-4 w-4" />
                </div>
              </div>
              <p className="stat-value mt-1">—</p>
              <p className="stat-sub">Based on taxable income</p>
            </div>

            {/* Refund / Owed */}
            <div className="stat-card ts-animate-in ts-delay-4">
              <div className="flex items-center justify-between">
                <p className="stat-label">Est. Refund / Owed</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                  <Minus className="h-4 w-4" />
                </div>
              </div>
              <p className="stat-value mt-1">—</p>
              <p className="stat-sub">After withholding applied</p>
            </div>
          </div>
        </section>

        {/* ── Chart + Progress ──────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-5">

          {/* Income vs Tax chart */}
          <div className="ts-card p-5 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="section-title">Tax summary</h2>
                <p className="section-caption">Estimated breakdown for tax year 2025</p>
              </div>
              <span className="badge-neutral">Preliminary</span>
            </div>
            <DashboardChart />
          </div>

          {/* Filing progress */}
          <div className="ts-card overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="section-title">Filing progress</h2>
                <p className="section-caption">{completedSteps} of {steps.length} steps</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {progressPct}%
                </span>
              </div>
            </div>

            <div className="divide-y divide-border">
              {steps.map(({ n, label, desc, href, done }) => (
                <div key={n} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="shrink-0">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/25" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {label}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{desc}</p>
                  </div>
                  {!done && (
                    <Link
                      href={href}
                      className="shrink-0 flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
                    >
                      Start
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick actions ─────────────────────────────────────── */}
        <section>
          <h2 className="section-title mb-3">Quick actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                Icon: Upload,
                label: "Upload Documents",
                desc: "Add W-2s, 1099s, receipts",
                href: "/documents",
                color: "text-blue-500 dark:text-blue-400 bg-blue-500/10",
              },
              {
                Icon: Table2,
                label: "Review Extracted Data",
                desc: "Verify and correct fields",
                href: "/extracted-data",
                color: "text-amber-500 dark:text-amber-400 bg-amber-500/10",
              },
              {
                Icon: FileCheck2,
                label: "Tax Breakdown",
                desc: "See step-by-step calculation",
                href: "/tax-breakdown",
                color: "text-purple-500 dark:text-purple-400 bg-purple-500/10",
              },
              {
                Icon: Bot,
                label: "Ask Tax Assistant",
                desc: "Get answers to tax questions",
                href: "/chat",
                color: "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10",
              },
            ].map(({ Icon, label, desc, href, color }) => (
              <Link
                key={label}
                href={href}
                className="ts-card group flex items-center gap-3 p-4 transition-colors hover:bg-muted/40"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{label}</p>
                  <p className="truncate text-xs text-muted-foreground">{desc}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-foreground/60" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── Deadline notice ───────────────────────────────────── */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="flex flex-1 items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                California filing deadline: April 15, 2026
              </p>
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300/80">
                Upload your documents early to allow time for review and correction.
              </p>
            </div>
            <Link
              href="/documents"
              className="shrink-0 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 transition-colors hover:bg-amber-200 dark:hover:bg-amber-900/60"
            >
              Upload now
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
