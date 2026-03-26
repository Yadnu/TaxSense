"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={`h-8 w-8 rounded-lg ${className}`} />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`group relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground ${className}`}
    >
      <Sun
        className={`absolute h-4 w-4 transition-all duration-300 ${
          isDark ? "scale-0 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0"
        }`}
      />
      <Moon
        className={`absolute h-4 w-4 transition-all duration-300 ${
          isDark ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 -rotate-90"
        }`}
      />
    </button>
  );
}
