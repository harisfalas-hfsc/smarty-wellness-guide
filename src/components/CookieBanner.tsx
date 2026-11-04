import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const KEY = "sw-cookie-consent";

export type CookieConsent = "all" | "essential";

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "all" || v === "essential" ? v : null;
}

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(getCookieConsent() === null);
    const reopen = () => setOpen(true);
    window.addEventListener("sw-open-cookie-settings", reopen);
    return () => window.removeEventListener("sw-open-cookie-settings", reopen);
  }, []);
  if (!open) return null;
  const choose = (v: CookieConsent) => {
    window.localStorage.setItem(KEY, v);
    setOpen(false);
  };
  return (
    <div role="dialog" aria-label="Cookie preferences" className="fixed inset-x-3 bottom-20 z-[80] mx-auto max-w-xl rounded-2xl border-2 border-primary bg-background p-4 shadow-xl md:bottom-6">
      <p className="text-sm font-bold">Cookies on Smarty Wellness</p>
      <p className="mt-1 text-sm text-muted-foreground">
        We use essential cookies and local storage to keep you signed in, remember your settings and process payments.
        With your permission we may also use optional cookies to understand how the app is used. Read our{" "}
        <Link to="/privacy" className="font-semibold text-primary">Privacy Policy</Link>.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" onClick={() => choose("all")}>Accept all</Button>
        <Button variant="outline" className="flex-1" onClick={() => choose("essential")}>Essential only</Button>
      </div>
    </div>
  );
}
