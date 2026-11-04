import type { ErrorComponentProps } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Navigation } from "@/components/Navigation";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNav } from "@/components/DesktopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/CookieBanner";
import { WellnessProvider } from "@/lib/wellness-store";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useSubscription } from "@/lib/use-subscription";
import { FREE_PATHS } from "@/lib/membership";
import { Paywall } from "@/components/Paywall";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { LegacyImportBanner } from "@/components/LegacyImportBanner";
import { useWellness } from "@/lib/wellness-store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const DESCRIPTION =
  "Your personal guide to a healthier, more balanced, and more fulfilling life. One honest check-in. One clear action. Every day.";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Smarty Wellness — Personal Wellness Guidance System" },
      { name: "description", content: DESCRIPTION },
      { name: "author", content: "Smarty" },
      { name: "theme-color", content: "#67B2C4" },
      { name: "application-name", content: "SMARTY WELLNESS" },
      { name: "apple-mobile-web-app-title", content: "SMARTY WELLNESS" },
      { name: "mobile-web-app-capable", content: "yes" },
      { property: "og:site_name", content: "Smarty Wellness" },
      { property: "og:title", content: "Smarty Wellness" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/smarty-wellness-icon.png" },
      { rel: "apple-touch-icon", href: "/smarty-wellness-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WellnessProvider>
          <AppFrame />
        </WellnessProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}


function AppFrame() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  void navigate;
  const { isActive, loading: subLoading } = useSubscription();
  const isFree = FREE_PATHS.includes(pathname) || pathname.startsWith("/api/");
  const locked = !isFree && !loading && !subLoading && !isActive;
  const member = !!session && isActive;

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <Navigation />
      <div className="mx-auto flex w-full max-w-7xl">
        {member && <DesktopNav />}
        <div className="min-w-0 flex-1">
          {member && <LegacyImportBanner />}
          {session && <WellnessLoadError />}
          {/* Required: nested routes render here. */}
          {locked ? <Paywall /> : !isFree && (loading || subLoading) ? null : <Outlet />}
        </div>
      </div>
      {!member && <SiteFooter />}
      {member && <BottomNav />}
      <CookieBanner />
      <Toaster />
    </div>
  );
}

function WellnessLoadError() {
  const { error } = useWellness();
  const qc = useQueryClient();
  if (!error) return null;
  return (
    <div className="mx-4 mt-4 rounded-3xl border-2 border-coral bg-card p-4 text-sm md:mx-6">
      We couldn't load your wellness data.{" "}
      <button className="font-bold underline" onClick={() => void qc.invalidateQueries({ queryKey: ["wellness"] })}>
        Try again
      </button>
    </div>
  );
}
