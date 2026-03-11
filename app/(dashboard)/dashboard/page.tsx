import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Here&apos;s an overview of your tax preparation progress.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Documents Uploaded", value: "0", hint: "Upload W-2s, 1099s, receipts" },
          { label: "Deductions Found", value: "0", hint: "AI-powered discovery" },
          { label: "Forms Generated", value: "0", hint: "IRS-compliant PDFs" },
          { label: "Estimated Refund", value: "$0", hint: "Based on current data" },
        ].map(({ label, value, hint }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {hint}
            </p>
          </div>
        ))}
      </div>

      {/* Getting started checklist */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Get started with TaxSense
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Complete these steps to prepare your taxes.
        </p>
        <ol className="mt-4 flex flex-col gap-3">
          {[
            { step: "1", label: "Upload your tax documents", done: false },
            { step: "2", label: "Review extracted data", done: false },
            { step: "3", label: "Discover deductions", done: false },
            { step: "4", label: "Generate tax forms", done: false },
            { step: "5", label: "Validate & export", done: false },
          ].map(({ step, label, done }) => (
            <li key={step} className="flex items-center gap-3">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {done ? "✓" : step}
              </div>
              <span
                className={`text-sm ${
                  done
                    ? "text-slate-400 line-through dark:text-slate-500"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
