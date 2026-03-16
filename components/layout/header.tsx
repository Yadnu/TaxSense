"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, HelpCircle, Bell } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":      "Dashboard",
  "/documents":      "Documents",
  "/extracted-data": "Extracted Data",
  "/chat":           "Tax Assistant",
  "/settings":       "Settings",
};

export function Header() {
  const pathname = usePathname();
  const label =
    ROUTE_LABELS[pathname] ??
    pathname.split("/").filter(Boolean).at(-1) ??
    "Dashboard";

  return (
    <header className="hidden h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 lg:flex">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <span className="text-gray-400">TaxSense</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden="true" />
        <span className="font-semibold text-gray-800">{label}</span>
      </nav>

      {/* Quick actions */}
      <div className="flex items-center gap-0.5">
        <button
          aria-label="Help and documentation"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-slate-100 hover:text-gray-600"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        <button
          aria-label="Notifications"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-slate-100 hover:text-gray-600"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
