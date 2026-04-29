"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Table2,
  Bot,
  Settings,
  BarChart3,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",      label: "Dashboard",        icon: LayoutDashboard },
  { href: "/documents",      label: "Upload Documents", icon: Upload          },
  { href: "/extracted-data", label: "Extracted Data",   icon: Table2          },
  { href: "/tax-breakdown",  label: "Tax Breakdown",    icon: BarChart3       },
  { href: "/chat",           label: "Tax Assistant",    icon: Bot             },
  { href: "/settings",       label: "Settings",         icon: Settings        },
];

interface NavLinksProps {
  onNavigate?: () => void;
  /** "dark" = always-dark sidebar (default), "light" = light-mode panel */
  theme?: "dark" | "light";
}

export function NavLinks({ onNavigate, theme = "dark" }: NavLinksProps = {}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-3 py-4">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
        Menu
      </p>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
              isActive
                ? theme === "dark"
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "bg-blue-600 text-white"
                : theme === "dark"
                  ? "text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
