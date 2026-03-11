import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      {/* Nav */}
      <header className="flex h-16 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800 sm:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            TaxSense
          </span>
        </div>

        <div className="flex items-center gap-3">
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Get started free
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </SignedIn>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center sm:px-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          AI-Powered Tax Preparation
        </div>

        <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
          Taxes made simple with{" "}
          <span className="text-blue-600">AI intelligence</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-400">
          Upload your documents, let AI extract and organize your data, discover
          hidden deductions, and generate IRS-compliant forms — all in one
          place.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/sign-up"
            className="w-full rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-md hover:bg-blue-700 sm:w-auto"
          >
            Start for free
          </Link>
          <Link
            href="/sign-in"
            className="w-full rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:w-auto"
          >
            Sign in
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="mt-24 grid w-full max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: "📄",
              title: "Smart Document OCR",
              desc: "Auto-extract data from W-2s, 1099s, and receipts with 90%+ accuracy.",
            },
            {
              icon: "💡",
              title: "Deduction Discovery",
              desc: "AI finds 3–5 additional savings opportunities tailored to you.",
            },
            {
              icon: "📝",
              title: "Form Generation",
              desc: "Automatically generate Form 1040 and all required schedules.",
            },
            {
              icon: "✅",
              title: "Compliance Check",
              desc: "100% mathematical validation with real-time error highlighting.",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-5 text-left dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="text-2xl">{icon}</span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400 dark:border-slate-800">
        © {new Date().getFullYear()} TaxSense. All rights reserved.
      </footer>
    </div>
  );
}
