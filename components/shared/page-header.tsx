import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Optional action buttons / badges rendered on the right */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Reusable page-level header: title + optional description + optional
 * right-side actions.  Matches the `.page-header` CSS utility in globals.css
 * but adds structured semantics and an actions slot.
 */
export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-0.5 truncate text-sm text-gray-500">{description}</p>
        )}
      </div>

      {children && (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      )}
    </div>
  );
}
