import Link from "next/link";
import { Shield, CheckCircle } from "lucide-react";
import { TaxSenseLogo } from "@/components/branding/taxsense-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Left branding panel (always dark — intentional brand choice) ── */}
      <div className="hidden flex-col justify-between border-r border-sidebar-border bg-sidebar p-10 lg:flex lg:w-96 lg:shrink-0">
        <div>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <TaxSenseLogo variant="dark" className="text-2xl" />
          </Link>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-sidebar-foreground leading-snug">
              Your AI-powered California tax assistant
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-sidebar-foreground/50">
              Upload documents, review extracted data, and ask any tax
              question — guided step by step.
            </p>
          </div>

          <ul className="mt-8 flex flex-col gap-3">
            {[
              "Guided document upload",
              "AI data extraction & review",
              "California tax rules built-in",
              "Secure, encrypted storage",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-sidebar-foreground/80">
                <CheckCircle className="h-4 w-4 shrink-0 text-lime-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/60 px-4 py-3">
          <Shield className="h-5 w-5 text-blue-400" />
          <div>
            <p className="text-xs font-semibold text-sidebar-foreground">Bank-level security</p>
            <p className="text-xs text-sidebar-foreground/40">AES-256 encrypted · IRS-compliant</p>
          </div>
        </div>
      </div>

      {/* ── Right form area ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <TaxSenseLogo variant="auto" className="text-xl" />
        </Link>

        <div className="w-full max-w-sm ts-animate-in">
          {children}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground/40">
          © {new Date().getFullYear()} TaxSense · Your data is encrypted and private
        </p>
      </div>
    </div>
  );
}
