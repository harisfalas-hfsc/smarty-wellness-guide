import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Sprout, BookOpen, CalendarCheck, ChevronLeft, ClipboardList, Compass, FlaskConical, Heart, Home, LineChart, ListChecks, LogIn, LogOut, Menu, Settings, Sparkles, Target, User, UserCircle, X, Sunrise, Sun, Moon, Wind, Droplets } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWellness } from "@/lib/wellness-store";
import { useAuth } from "@/lib/auth";

export function Navigation() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [navCount, setNavCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { state } = useWellness();
  const { session, user, signOut } = useAuth();

  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => setNavCount((n) => n + 1));
    return unsub;
  }, [router]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const canGoBack = navCount > 0 && pathname !== "/";
  const accountName =
    state.profile.personal.name ||
    (user?.user_metadata?.["display_name"] as string | undefined) ||
    user?.email ||
    "Account";
  const initial = accountName.slice(0, 1).toUpperCase();

  return (
    <header
      className="sticky top-0 z-40 w-full bg-background"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-11 items-center justify-between gap-2 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary/10"
          >
            <Menu className="h-5 w-5" />
          </button>
          {canGoBack && (
            <button
              type="button"
              onClick={() => router.history.back()}
              aria-label="Go back"
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary text-primary hover:bg-primary/10 sm:inline-flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              await router.navigate({ to: "/" });
              void router.invalidate();
              window.scrollTo({ top: 0, behavior: "auto" });
            }}
            aria-label="Smarty Wellness home"
            className="bg-transparent p-0 text-lg font-extrabold leading-none tracking-tight no-underline hover:no-underline"
            style={{ textDecoration: "none" }}
          >
            <span className="text-primary">SMARTY</span>
            <span className="text-emerald-500">WELLNESS</span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary text-primary hover:bg-primary/10"
                >
                  <User className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/auth" search={{ mode: "signin" }}>
                    <LogIn className="mr-2 h-4 w-4" /> Sign in
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                to="/check-in"
                aria-label="Daily check-in"
                className="hidden h-8 items-center rounded-full border-2 border-primary px-3 text-[11px] font-bold uppercase tracking-wide text-primary hover:bg-primary/10 sm:inline-flex"
                style={{ textDecoration: "none" }}
              >
                Check in
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Account"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-primary text-xs font-bold text-primary-foreground"
                  >
                    {initial}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{accountName}</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <UserCircle className="mr-2 h-4 w-4" /> Wellness profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/journey">
                      <LineChart className="mr-2 h-4 w-4" /> My journey
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="mr-2 h-4 w-4" /> Settings & account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={async () => {
                      await signOut();
                      await router.navigate({ to: "/" });
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {menuOpen && <NavDrawer onClose={() => setMenuOpen(false)} />}
    </header>
  );
}

function NavDrawer({ onClose }: { onClose: () => void }) {
  const { session } = useAuth();
  const sections: {
    heading: string;
    items: { to: string; label: string; Icon: typeof Home }[];
  }[] = session ? [
    {
      heading: "Daily",
      items: [
        { to: "/", label: "Home", Icon: Home },
        { to: "/today", label: "Today", Icon: CalendarCheck },
        { to: "/check-in", label: "Daily check-in", Icon: Heart },
        { to: "/morning", label: "Morning Activation", Icon: Sunrise },
        { to: "/midday", label: "Midday Reset", Icon: Sun },
        { to: "/evening", label: "Evening Unwind", Icon: Moon },
        { to: "/breathing", label: "Breathing", Icon: Wind },
        { to: "/habits", label: "Water, protein & me-time", Icon: Droplets },
        { to: "/coach", label: "Smarty Coach", Icon: Sparkles },
      ],
    },
    {
      heading: "Progress",
      items: [
        { to: "/progress", label: "Personal development", Icon: Sprout },
        { to: "/missions", label: "Missions", Icon: Target },
        { to: "/challenges", label: "Daily challenges", Icon: ListChecks },
        { to: "/bucket-list", label: "Bucket list", Icon: Compass },
        { to: "/experiments", label: "Wellness experiments", Icon: FlaskConical },
        { to: "/journey", label: "Journey", Icon: LineChart },
        { to: "/insights", label: "Your insights", Icon: Compass },
        { to: "/review", label: "Weekly review", Icon: ClipboardList },
      ],
    },
    {
      heading: "You",
      items: [
        { to: "/profile", label: "Wellness profile", Icon: UserCircle },
        { to: "/onboarding", label: "Set up Smarty Wellness", Icon: BookOpen },
        { to: "/settings", label: "Settings & account", Icon: User },
      ],
    },
  ] : [
    {
      heading: "Smarty Wellness",
      items: [
        { to: "/", label: "Home", Icon: Home },
        { to: "/auth", label: "Sign in", Icon: LogIn },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside
        className="absolute left-0 top-0 flex h-full w-[85%] max-w-[340px] flex-col bg-background shadow-2xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex h-12 items-center justify-between px-4">
          <div className="text-base font-extrabold">
            <span className="text-primary">SMARTY</span>
            <span className="text-emerald-500">WELLNESS</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav
          className="flex-1 overflow-y-auto px-3"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        >
          {sections.map((s) => (
            <div key={s.heading} className="mt-2">
              <div className="px-2 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {s.heading}
              </div>
              <ul className="space-y-1">
                {s.items.map(({ to, label, Icon }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-primary/10"
                      style={{ textDecoration: "none" }}
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-xl brand-gradient-soft text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
