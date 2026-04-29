"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { TaxSenseLogo } from "@/components/branding/taxsense-logo";
import { ClerkUserButton } from "@/components/layout/clerk-user-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavLinks } from "@/components/dashboard/nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:hidden">

      {/* Hamburger */}
      <Sheet open={open} onOpenChange={(v) => setOpen(v)}>
        <SheetTrigger
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>

        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          {/* Sheet header */}
          <div className="flex h-14 items-center border-b border-sidebar-border px-5">
            <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center">
              <TaxSenseLogo variant="dark" className="text-xl" />
            </Link>
          </div>

          {/* Tax year pill */}
          <div className="px-4 pt-4">
            <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/60 px-3 py-2.5">
              <p className="text-xs font-semibold text-sidebar-foreground">Tax Year 2025</p>
              <p className="text-[11px] text-sidebar-foreground/40">California · FTB 540</p>
            </div>
          </div>

          <NavLinks onNavigate={() => setOpen(false)} theme="dark" />
        </SheetContent>
      </Sheet>

      {/* Centered logo */}
      <Link href="/dashboard" className="absolute left-1/2 -translate-x-1/2">
        <TaxSenseLogo variant="auto" className="text-lg" />
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <ClerkUserButton />
      </div>
    </header>
  );
}
