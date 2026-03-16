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
} from "lucide-react";

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

  return (
    <div className="flex flex-col">

      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="text-lg font-semibold text-gray-900">
          {user?.firstName ? `Welcome back, ${user.firstName}` : "Dashboard"}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Tax Year 2025 · California FTB 540
        </p>
      </div>

      <div className="p-6 space-y-6">

        {/* ── Progress steps ────────────────────────────────────────── */}
        <section>
          <div className="ts-card divide-y divide-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h2 className="section-title">Filing progress</h2>
                <p className="section-caption">
                  {completedSteps} of {steps.length} steps complete
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-900 transition-all duration-500"
                    style={{ width: `${(completedSteps / steps.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500">
                  {Math.round((completedSteps / steps.length) * 100)}%
                </span>
              </div>
            </div>

            {steps.map(({ n, label, desc, href, done }) => (
              <div
                key={n}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div className="shrink-0">
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-300" />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <span className={`text-sm font-medium truncate ${done ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {label}
                  </span>
                  <span className="text-xs text-gray-400 truncate">{desc}</span>
                </div>
                {!done && (
                  <Link
                    href={href}
                    className="shrink-0 flex items-center gap-1 rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
                  >
                    Start
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Summary cards ─────────────────────────────────────────── */}
        <section>
          <h2 className="section-title mb-3">Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Documents",
                value: "0",
                sub: "uploaded",
                Icon: Upload,
                href: "/documents",
              },
              {
                label: "Fields Extracted",
                value: "0",
                sub: "data points",
                Icon: Table2,
                href: "/extracted-data",
              },
              {
                label: "Needs Review",
                value: "0",
                sub: "low-confidence fields",
                Icon: AlertCircle,
                href: "/extracted-data",
              },
              {
                label: "Questions Asked",
                value: "0",
                sub: "via tax assistant",
                Icon: Bot,
                href: "/chat",
              },
            ].map(({ label, value, sub, Icon, href }) => (
              <Link
                key={label}
                href={href}
                className="ts-card group flex items-start gap-4 p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Quick actions ─────────────────────────────────────────── */}
        <section>
          <h2 className="section-title mb-3">Quick actions</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                Icon: Upload,
                label: "Upload Documents",
                desc: "Add W-2s, 1099s, receipts",
                href: "/documents",
              },
              {
                Icon: FileCheck2,
                label: "Review Extracted Data",
                desc: "Verify and correct fields",
                href: "/extracted-data",
              },
              {
                Icon: Bot,
                label: "Ask Tax Assistant",
                desc: "Get answers to tax questions",
                href: "/chat",
              },
            ].map(({ Icon, label, desc, href }) => (
              <Link
                key={label}
                href={href}
                className="ts-card group flex items-center gap-4 p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-900">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{label}</p>
                  <p className="text-xs text-gray-400 truncate">{desc}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-900" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── Notice ────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              California filing deadline: April 15, 2026
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Upload your documents early to allow time for review and correction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
