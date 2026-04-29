import Link from "next/link";
import { LogOut } from "lucide-react";
import { TaxSenseLogo } from "@/components/branding/taxsense-logo";
import { SignOutButton } from "@clerk/nextjs";
import { ClerkUserButton } from "@/components/layout/clerk-user-button";
import { NavLinks } from "@/components/dashboard/nav-links";

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col bg-sidebar lg:flex">

      {/* Logo area */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Link href="/dashboard" className="flex items-center">
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

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto">
        <NavLinks />
      </div>

      {/* User + sign out */}
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2">
          <ClerkUserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
          <span className="text-sm font-medium text-sidebar-foreground/50">My Account</span>
        </div>
        <SignOutButton redirectUrl="/">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/40 transition-colors duration-150 hover:bg-red-950/60 hover:text-red-400">
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
