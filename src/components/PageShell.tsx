import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Standard Smarty page container: centered, max-w-4xl, consistent padding. */
export function PageShell({
  children,
  className,
  width = "4xl",
}: {
  children: ReactNode;
  className?: string;
  width?: "xl" | "3xl" | "4xl" | "6xl";
}) {
  const max = {
    xl: "max-w-xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "6xl": "max-w-6xl",
  }[width];

  return (
    <main className={cn("mx-auto w-full px-4 py-8 sm:px-6 sm:py-10", max, className)}>
      {children}
    </main>
  );
}
