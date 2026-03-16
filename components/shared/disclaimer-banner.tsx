"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";

export function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-5 py-2.5"
    >
      <AlertCircle
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
        aria-hidden="true"
      />
      <p className="flex-1 text-xs leading-relaxed text-amber-700">
        <span className="font-semibold">For educational purposes only.</span>{" "}
        TaxSense provides general tax information based on IRS and California FTB
        publications. This is not professional tax, legal, or financial advice.{" "}
        <span className="font-medium">
          Always consult a qualified tax professional or CPA before making any
          tax decisions.
        </span>
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss disclaimer"
        className="shrink-0 rounded p-0.5 text-amber-500 transition-colors hover:bg-amber-100 hover:text-amber-700"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
