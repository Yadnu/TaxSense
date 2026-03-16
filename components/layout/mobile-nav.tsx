"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, FileText } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavLinks } from "@/components/dashboard/nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">

      {/* Hamburger that opens the slide-out nav */}
      <Sheet open={open} onOpenChange={(v) => setOpen(v)}>
        <SheetTrigger
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-slate-100 hover:text-gray-700"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>

        <SheetContent side="left" className="w-72 p-0">
          {/* Sheet header — logo */}
          <div className="flex h-16 items-center border-b border-slate-200 px-5 pt-0">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-white">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-gray-900">TaxSense</span>
            </Link>
          </div>

          {/* Tax year indicator */}
          <div className="px-4 pt-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
              <p className="text-xs font-semibold text-blue-900">Tax Year 2025</p>
              <p className="text-[11px] text-blue-600/70">California · FTB 540</p>
            </div>
          </div>

          {/* Nav — passes close callback so tapping a link closes the sheet */}
          <NavLinks onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Centered logo */}
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-900 text-white">
          <FileText className="h-3.5 w-3.5" />
        </div>
        <span className="font-bold text-gray-900">TaxSense</span>
      </Link>

      {/* User avatar */}
      <UserButton />
    </header>
  );
}
