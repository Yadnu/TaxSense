import type { ComponentProps } from "react";

type Variant = "light" | "dark" | "auto";

/**
 * Text logo: "Tax" + "Sense" (lime accent).
 * variant="dark"  → white "Tax" (for dark backgrounds, e.g. sidebar)
 * variant="light" → dark "Tax"  (for light backgrounds)
 * variant="auto"  → follows CSS theme via text-foreground
 */
export function TaxSenseLogo({
  variant = "dark",
  className = "",
  ...rest
}: ComponentProps<"span"> & { variant?: Variant }) {
  const taxColor =
    variant === "dark"  ? "text-white"      :
    variant === "light" ? "text-gray-900"   :
                          "text-foreground";
  return (
    <span
      className={`font-bold tracking-tight ${className}`}
      {...rest}
    >
      <span className={taxColor}>Tax</span>
      <span className="text-lime-400">Sense</span>
    </span>
  );
}
