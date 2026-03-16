import Link from "next/link";
import Image from "next/image";
import { Shield, CheckCircle } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ── Left branding panel (desktop only) ───────────────────── */}
      <div className="hidden flex-col justify-between bg-blue-900 p-10 lg:flex lg:w-96 lg:shrink-0">
        <div>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/Logo.png"
              alt="TaxSense"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
            <span className="text-lg font-bold text-white">TaxSense</span>
          </Link>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white leading-snug">
              Your AI-powered California tax assistant
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-blue-200">
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
              <li key={item} className="flex items-center gap-2.5 text-sm text-blue-100">
                <CheckCircle className="h-4 w-4 shrink-0 text-teal-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2.5 rounded-lg border border-blue-700 px-4 py-3">
          <Shield className="h-5 w-5 text-teal-400" />
          <div>
            <p className="text-xs font-semibold text-white">Bank-level security</p>
            <p className="text-xs text-blue-300">AES-256 encrypted · IRS-compliant</p>
          </div>
        </div>
      </div>

      {/* ── Right form area ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <Image
            src="/Logo.png"
            alt="TaxSense"
            width={32}
            height={32}
            className="object-contain"
            priority
          />
          <span className="text-lg font-bold text-gray-900">TaxSense</span>
        </Link>

        <div className="w-full max-w-sm ts-animate-in">
          {children}
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} TaxSense · Your data is encrypted and private
        </p>
      </div>
    </div>
  );
}
