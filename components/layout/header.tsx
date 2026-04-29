"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, HelpCircle, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":      "Dashboard",
  "/documents":      "Documents",
  "/extracted-data": "Extracted Data",
  "/tax-breakdown":  "Tax Breakdown",
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
    <header className="hidden h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6 lg:flex">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <span className="text-muted-foreground">TaxSense</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" aria-hidden="true" />
        <span className="font-semibold text-foreground">{label}</span>
      </nav>

      {/* Quick actions */}
      <div className="flex items-center gap-0.5">
        <ThemeToggle />
        <button
          aria-label="Help and documentation"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        <button
          aria-label="Notifications"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
