import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { TaxSenseLogo } from "@/components/branding/taxsense-logo";
import { redirect } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Upload,
  Bot,
  FileCheck2,
  Shield,
  Lock,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Clock,
} from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <TaxSenseLogo variant="auto" className="text-xl" />
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignedOut>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
        <section className="px-6 pb-20 pt-20 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">

            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500 dark:text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
              California Tax Filing · 2025
            </span>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Your AI-powered California
              <br />
              tax assistant
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
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

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              {[
                "No credit card required",
                "Bank-level encryption",
                "IRS-compliant forms",
                "California tax rules built-in",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-lime-500 dark:text-lime-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats bar ────────────────────────────────────────────────── */}
        <section className="border-y border-border bg-card px-6 py-10">
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
            {[
              { Icon: TrendingUp, stat: "$2,400",   label: "Average additional savings found" },
              { Icon: Clock,      stat: "< 15 min", label: "Average time to complete filing"  },
              { Icon: FileCheck2, stat: "99.2%",    label: "Document extraction accuracy"     },
            ].map(({ Icon, stat, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <Icon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                <p className="text-3xl font-bold text-foreground">{stat}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-lime-500 dark:text-lime-400">
                How TaxSense works
              </p>
              <h2 className="mt-2 text-3xl font-bold text-foreground">
                Three steps to a complete filing
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                A guided workflow so nothing gets missed. No tax expertise needed.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-3">
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
                <div key={step} className="ts-card p-6 transition-colors hover:border-border/80">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 ring-1 ring-blue-500/20">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
                      Step {step}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Security & privacy ───────────────────────────────────────── */}
        <section className="border-t border-border bg-card px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col items-center gap-10 sm:flex-row sm:gap-16">
              <div className="flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 ring-1 ring-blue-500/20">
                  <Shield className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-foreground">
                  Your data is private and secure
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
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
                    <li key={item} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <Lock className="h-4 w-4 shrink-0 text-lime-500 dark:text-lime-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-full flex-1 max-w-sm">
                <div className="ts-card divide-y divide-border overflow-hidden">
                  {[
                    { label: "Encryption",   value: "AES-256",      icon: "🔐" },
                    { label: "Storage",      value: "AWS S3",        icon: "☁️" },
                    { label: "Auth",         value: "Multi-factor", icon: "🔑" },
                    { label: "Compliance",   value: "IRS + CA FTB", icon: "✅" },
                    { label: "Availability", value: "99.9% uptime", icon: "📶" },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{icon}</span>
                        {label}
                      </span>
                      <span className="text-sm font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="border-t border-border bg-background px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Start your California tax filing today
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Free to start. No tax knowledge required. Guided step-by-step
              from upload to completed return.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/sign-up" className="btn-primary w-full sm:w-auto px-6 py-3 text-base">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/sign-in" className="btn-secondary w-full sm:w-auto px-6 py-3 text-base">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <TaxSenseLogo variant="auto" className="text-lg" />
          </div>
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} TaxSense. Not a licensed tax advisor. For
            informational purposes only.
          </p>
          <div className="flex gap-5 text-xs text-muted-foreground/60">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
