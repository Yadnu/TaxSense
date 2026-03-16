import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import {
  Upload,
  Bot,
  FileCheck2,
  Shield,
  Lock,
  CheckCircle,
  ArrowRight,
  FileText,
  TrendingUp,
  Clock,
} from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-800">

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-white">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-gray-900">TaxSense</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <SignedOut>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                Sign in
              </Link>
              <Link href="/sign-up" className="btn-primary">
                Get started free
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      <main>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="bg-white px-6 pb-20 pt-20 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">

            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-800" />
              California Tax Filing · 2025
            </span>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Your AI-powered California
              <br />
              tax assistant
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-gray-500">
              Upload your tax documents, let AI extract and review your data,
              then ask any tax question — all in a secure, guided workflow.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/sign-up" className="btn-primary w-full sm:w-auto px-6 py-3 text-base">
                Upload my documents
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/sign-in" className="btn-secondary w-full sm:w-auto px-6 py-3 text-base">
                Sign in to account
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
              {[
                "No credit card required",
                "Bank-level encryption",
                "IRS-compliant forms",
                "California tax rules built-in",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats bar ────────────────────────────────────────────────── */}
        <section className="border-y border-slate-200 bg-slate-50 px-6 py-10">
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
            {[
              { Icon: TrendingUp, stat: "$2,400", label: "Average additional savings found" },
              { Icon: Clock,      stat: "< 15 min", label: "Average time to complete filing" },
              { Icon: FileCheck2, stat: "99.2%",  label: "Document extraction accuracy"   },
            ].map(({ Icon, stat, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <Icon className="h-5 w-5 text-blue-900" />
                <p className="text-3xl font-bold text-gray-900">{stat}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-900">
                How TaxSense works
              </p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                Three steps to a complete filing
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-gray-500">
                A guided workflow so nothing gets missed. No tax expertise needed.
              </p>
            </div>

            <div className="mt-14 grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  Icon: Upload,
                  title: "Upload your documents",
                  desc: "Drag and drop your W-2s, 1099s, receipts, and bank statements. TaxSense accepts PDFs and image files.",
                },
                {
                  step: "02",
                  Icon: FileCheck2,
                  title: "Review extracted data",
                  desc: "AI reads every document and extracts key fields. You review, correct, and approve before moving on.",
                },
                {
                  step: "03",
                  Icon: Bot,
                  title: "Ask your tax assistant",
                  desc: "Chat with the AI about deductions, credits, and California-specific rules. Get plain-language answers.",
                },
              ].map(({ step, Icon, title, desc }) => (
                <div key={step} className="ts-card p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-900 text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      Step {step}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Security & privacy ───────────────────────────────────────── */}
        <section className="border-t border-slate-200 bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col items-center gap-10 sm:flex-row sm:gap-16">
              <div className="flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-900 text-white">
                  <Shield className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  Your data is private and secure
                </h2>
                <p className="mt-3 text-gray-500 leading-relaxed">
                  Tax documents contain your most sensitive information. TaxSense
                  uses bank-level security to protect everything you upload.
                </p>
                <ul className="mt-6 flex flex-col gap-3">
                  {[
                    "AES-256 encryption for all stored documents",
                    "Documents never shared with third parties",
                    "Full audit trail of every action",
                    "You can delete all data at any time",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <Lock className="h-4 w-4 shrink-0 text-blue-900" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-full flex-1 max-w-sm">
                <div className="ts-card divide-y divide-slate-200 overflow-hidden">
                  {[
                    { label: "Encryption",    value: "AES-256",       icon: "🔐" },
                    { label: "Storage",       value: "AWS S3",         icon: "☁️" },
                    { label: "Auth",          value: "Multi-factor",  icon: "🔑" },
                    { label: "Compliance",    value: "IRS + CA FTB",  icon: "✅" },
                    { label: "Availability",  value: "99.9% uptime",  icon: "📶" },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3">
                      <span className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{icon}</span>
                        {label}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="border-t border-slate-200 bg-blue-900 px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold text-white">
              Start your California tax filing today
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-blue-200">
              Free to start. No tax knowledge required. Guided step-by-step
              from upload to completed return.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/sign-up"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-blue-900 transition-colors hover:bg-blue-50 sm:w-auto"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sign-in"
                className="flex w-full items-center justify-center rounded-lg border border-blue-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-800 sm:w-auto"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-900 text-white">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold text-gray-700">TaxSense</span>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} TaxSense. Not a licensed tax advisor. For
            informational purposes only.
          </p>
          <div className="flex gap-5 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-600">Privacy Policy</a>
            <a href="#" className="hover:text-gray-600">Terms of Service</a>
            <a href="#" className="hover:text-gray-600">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
