import { Link } from "@tanstack/react-router";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type SmartyTone =
  | "cyan"
  | "green"
  | "orange"
  | "purple"
  | "yellow"
  | "pink"
  | "blue";

// Wellness tone system: Smarty blue + calm green, mind violet, sun yellow,
// energy coral and bloom pink. Borders only — card backgrounds stay white.
const BLUE = {
  border: "border-primary",
  text: "text-primary",
  softBg: "bg-primary/10",
  softBorder: "border-primary/40",
};
const GREEN = {
  border: "border-calm",
  text: "text-calm-deep",
  softBg: "bg-calm/15",
  softBorder: "border-calm/60",
};
const PURPLE = {
  border: "border-mind",
  text: "text-mind-deep",
  softBg: "bg-mind/10",
  softBorder: "border-mind/50",
};
const YELLOW = {
  border: "border-sun",
  text: "text-sun-deep",
  softBg: "bg-sun/25",
  softBorder: "border-sun/70",
};
const ORANGE = {
  border: "border-energy",
  text: "text-energy-deep",
  softBg: "bg-energy/10",
  softBorder: "border-energy/50",
};
const PINK = {
  border: "border-bloom",
  text: "text-bloom-deep",
  softBg: "bg-bloom/10",
  softBorder: "border-bloom/50",
};

const TONE: Record<
  SmartyTone,
  { border: string; text: string; softBg: string; softBorder: string }
> = {
  cyan: BLUE,
  blue: BLUE,
  green: GREEN,
  purple: PURPLE,
  yellow: YELLOW,
  orange: ORANGE,
  pink: PINK,
};


export function toneClasses(tone: SmartyTone) {
  return TONE[tone];
}

interface SmartyCardProps {
  tone?: SmartyTone;
  eyebrow?: string;
  eyebrowIcon?: LucideIcon | string; // Lucide icon component or emoji
  cornerIcon?: LucideIcon | string;
  align?: "left" | "center";
  title?: ReactNode;
  accent?: ReactNode; // colored trailing word appended to title
  description?: ReactNode;
  children?: ReactNode;
  ctaLabel?: string;
  ctaTo?: string;
  ctaHref?: string;
  className?: string;
}

function IconOrEmoji({
  icon,
  className,
}: {
  icon: LucideIcon | string;
  className?: string;
}) {
  if (typeof icon === "string") {
    return (
      <span
        className={cn(
          "inline-flex h-5 w-5 shrink-0 items-center justify-center text-center text-lg leading-none",
          className,
        )}
      >
        {icon}
      </span>
    );
  }
  const Comp = icon;
  return <Comp className={cn("h-4 w-4 shrink-0", className)} />;
}

export function SmartyCard({
  tone = "cyan",
  eyebrow,
  eyebrowIcon,
  align = "left",
  title,
  accent,
  description,
  children,
  ctaLabel,
  ctaTo,
  ctaHref,
  className,
}: SmartyCardProps) {
  const t = TONE[tone];
  const hasHeader = Boolean(eyebrow);
  const centered = align === "center";
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border-2 bg-card p-7 shadow-soft sm:p-9",
        t.border,
        centered && "text-center",
        className,
      )}
    >
      {hasHeader && (
        <div className={cn("flex min-h-9 items-start", centered && "justify-center")}>
          <div
            className={cn(
              "inline-flex max-w-full min-w-0 items-center gap-3 rounded-full border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider sm:text-[11px]",
              t.softBorder,
              t.text,
            )}
          >
            {eyebrowIcon && (
              <IconOrEmoji icon={eyebrowIcon} className="h-4 w-4 shrink-0 text-sm" />
            )}
            <span className="min-w-0 truncate">{eyebrow}</span>
          </div>
        </div>
      )}

      {title && (
        <h2
          className={cn(
            "text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl",
            hasHeader ? "mt-6" : "mt-0",
          )}
        >
          {title}
          {accent && <span className={cn(" ", t.text)}> {accent}</span>}
        </h2>
      )}

      {description && (
        <p
          className={cn(
            "mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7",
            centered && "mx-auto max-w-xl lg:max-w-3xl",
          )}
        >
          {description}
        </p>
      )}


      {children && <div className="mt-7">{children}</div>}

      {ctaLabel && (ctaTo || ctaHref) && (
        <div className="mt-6">
          {ctaTo ? (
            <Link
              to={ctaTo as never}
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-semibold",
                t.text,
              )}
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <a
              href={ctaHref}
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-semibold",
                t.text,
              )}
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

interface SmartyRowProps {
  icon?: LucideIcon | string;
  title: string;
  subtitle?: string;
  tone?: SmartyTone;
}

export function SmartyRow({ icon, title, subtitle, tone = "cyan" }: SmartyRowProps) {
  const t = TONE[tone];
  return (
    <div className="grid min-h-14 grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-4">
      {icon && (
        <div
          className={cn(
            "grid h-10 w-10 flex-none place-items-center rounded-xl border",
            t.softBorder,
            t.softBg,
            t.text,
          )}
        >
          <IconOrEmoji icon={icon} className="h-4 w-4 text-base" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-5 text-foreground">{title}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

interface SmartyPillProps {
  tone?: SmartyTone;
  icon?: LucideIcon | string;
  children: ReactNode;
}

export function SmartyPill({ tone = "cyan", icon, children }: SmartyPillProps) {
  const t = TONE[tone];
  return (
    <div
      className={cn(
        "grid min-h-14 grid-cols-[2rem_minmax(0,1fr)] items-center gap-4 rounded-xl border bg-card px-4 py-3",
        t.softBorder,
      )}
    >
      <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", t.softBg, t.text)}>
        {icon && <IconOrEmoji icon={icon} className="h-4 w-4 text-sm" />}
      </div>
      <span className="text-sm font-medium leading-5 text-foreground">{children}</span>
    </div>
  );
}
