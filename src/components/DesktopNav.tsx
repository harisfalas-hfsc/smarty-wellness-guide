import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarCheck,
  Droplets,
  Moon,
  Sun,
  Sunrise,
  Wind,
  ClipboardList,
  Compass,
  FlaskConical,
  Heart,
  Home,
  LineChart,
  ListChecks,
  Sparkles,
  Target,
} from "lucide-react";

const ITEMS = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/today", label: "Today", Icon: CalendarCheck },
  { to: "/check-in", label: "Check-in", Icon: Heart },
  { to: "/morning", label: "Morning", Icon: Sunrise },
  { to: "/midday", label: "Midday reset", Icon: Sun },
  { to: "/evening", label: "Evening", Icon: Moon },
  { to: "/breathing", label: "Breathing", Icon: Wind },
  { to: "/habits", label: "Habits", Icon: Droplets },
  { to: "/coach", label: "Coach", Icon: Sparkles },
  { to: "/missions", label: "Missions", Icon: Target },
  { to: "/challenges", label: "Challenges", Icon: ListChecks },
  { to: "/progress", label: "Development", Icon: Sprout },
  { to: "/bucket-list", label: "Bucket list", Icon: Compass },
  { to: "/experiments", label: "Experiments", Icon: FlaskConical },
  { to: "/journey", label: "Journey", Icon: LineChart },
  { to: "/insights", label: "Insights", Icon: Compass },
  { to: "/review", label: "Review", Icon: ClipboardList },
] as const;

/** Desktop uses the extra width for a persistent rail instead of a taller page. */
export function DesktopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden w-60 shrink-0 md:block">
      <div className="sticky top-14 px-3 py-6">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Smarty Wellness
        </p>
        <ul className="space-y-1">
          {ITEMS.map(({ to, label, Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold no-underline transition ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-primary/10"
                  }`}
                  style={{ textDecoration: "none" }}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-xl brand-gradient-soft text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
