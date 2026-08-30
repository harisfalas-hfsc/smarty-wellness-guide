import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-wellness.jpg";

const TAGLINE =
  "Your personal guide to a healthier, more balanced, and more fulfilling life.";

/** Public marketing page shown to visitors who are not signed in. */
export function Landing() {
  return (
    <main>
      {/* MOBILE — centered header + stacked CTAs (matches Smarty Workout) */}
      <section className="px-5 py-10 text-center sm:hidden">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-calm-deep">
          Smarty Wellness
        </p>
        <h1 className="mx-auto mt-3 max-w-sm text-3xl font-extrabold leading-[1.15] text-foreground">
          Your personal guide to a{" "}
          <span className="text-calm-deep">healthier, more balanced,</span> and
          more fulfilling life.
        </h1>
        <div className="mx-auto mt-8 flex max-w-xs flex-col gap-3">
          <Link to="/auth" style={{ textDecoration: "none" }}>
            <Button size="lg" className="w-full">
              Create free account
            </Button>
          </Link>
          <Link to="/auth" style={{ textDecoration: "none" }}>
            <Button size="lg" variant="outline" className="w-full">
              Sign in
            </Button>
          </Link>
        </div>
        <p className="mt-5 text-[13px] text-muted-foreground">
          One honest check-in. One clear action. Every day.
        </p>
      </section>

      {/* FULL-BLEED HERO — desktop/tablet (unchanged) */}
      <section className="relative hidden min-h-[calc(100dvh-3.5rem)] overflow-hidden sm:block">
        <img
          src={heroImage}
          alt="A happy couple walking together along the beach at sunrise"
          width={1920}
          height={1088}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-6xl items-center justify-end px-8 py-12 lg:px-6">
          <div className="max-w-[48%] lg:max-w-xl">
            <h1 className="text-5xl font-extrabold uppercase leading-[1.08] text-foreground drop-shadow-[0_1px_2px_var(--color-card)] lg:text-6xl">
              Your personal guide to a{" "}
              <span className="text-calm-deep">healthier, more balanced,</span>{" "}
              and more fulfilling life.
            </h1>
            <p className="mt-4 text-lg font-bold leading-7 text-foreground drop-shadow-[0_1px_2px_var(--color-card)]">
              One honest check-in. One clear action. Every day.
            </p>
            <div className="mt-7 flex flex-row gap-3">
              <Link to="/auth" style={{ textDecoration: "none" }}>
                <Button size="lg">Create free account</Button>
              </Link>
              <Link to="/auth" style={{ textDecoration: "none" }}>
                <Button size="lg" variant="outline" className="bg-card/90">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
