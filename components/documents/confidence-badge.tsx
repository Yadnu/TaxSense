import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  /** Confidence score from 0.0 to 1.0 */
  confidence: number;
  /** Show the percentage number. Default: true */
  showPercent?: boolean;
  /** Size variant. Default: "sm" */
  size?: "sm" | "md";
  className?: string;
}

type ConfidenceLevel = "high" | "medium" | "low" | "none";

function getLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.5) return "medium";
  if (confidence > 0)    return "low";
  return "none";
}

const LEVEL_STYLES: Record<
  ConfidenceLevel,
  { badge: string; dot: string; label: string }
> = {
  high: {
    badge: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    dot:   "bg-emerald-500 dark:bg-emerald-400",
    label: "High",
  },
  medium: {
    badge: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    dot:   "bg-amber-500 dark:bg-amber-400",
    label: "Medium",
  },
  low: {
    badge: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900",
    dot:   "bg-red-500 dark:bg-red-400",
    label: "Low",
  },
  none: {
    badge: "bg-muted text-muted-foreground border-border",
    dot:   "bg-muted-foreground/40",
    label: "None",
  },
};

export function ConfidenceBadge({
  confidence,
  showPercent = true,
  size = "sm",
  className,
}: ConfidenceBadgeProps) {
  const level = getLevel(confidence);
  const { badge, dot, label } = LEVEL_STYLES[level];
  const pct = Math.round(confidence * 100);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        badge,
        className
      )}
      title={`${label} confidence — ${pct}%`}
      aria-label={`${label} confidence, ${pct} percent`}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} aria-hidden />
      {showPercent ? `${pct}%` : label}
    </span>
  );
}
