import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarCheck, Heart, Home, Sparkles, Target } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/today", label: "Today", Icon: CalendarCheck },
  { to: "/check-in", label: "Check-in", Icon: Heart },
  { to: "/coach", label: "Coach", Icon: Sparkles },
  { to: "/missions", label: "Missions", Icon: Target },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      <div aria-hidden className="h-[calc(3.5rem+env(safe-area-inset-bottom))] md:hidden" />
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {ITEMS.map(({ to, label, Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold no-underline transition ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                  style={{ textDecoration: "none" }}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
