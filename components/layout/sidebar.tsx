import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import { NavLinks } from "@/components/dashboard/nav-links";

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">

      {/* Logo — matches header height (h-14) */}
      <div className="flex h-14 items-center border-b border-slate-200 px-5">
        <Link href="/dashboard" className="group flex items-center gap-2.5">
          <Image
            src="/Logo.png"
            alt="TaxSense"
            width={32}
            height={32}
            className="object-contain"
            priority
          />
          <span className="text-[17px] font-bold tracking-tight text-gray-900">
            TaxSense
          </span>
        </Link>
      </div>

      {/* Tax year indicator */}
      <div className="px-4 pt-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-blue-900">Tax Year 2025</p>
          <p className="text-[11px] text-blue-600/70">California · FTB 540</p>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto">
        <NavLinks />
      </div>

      {/* User + sign out */}
      <div className="border-t border-slate-200 p-3">
        <div className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2">
          <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
          <span className="text-sm font-medium text-gray-600">My Account</span>
        </div>
        <SignOutButton redirectUrl="/">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600">
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
