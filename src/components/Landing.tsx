import { Link } from "@tanstack/react-router";
import { LogIn, UserPlus } from "lucide-react";
import heroImage from "@/assets/hero-wellness.jpg";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";

const TAGLINE =
  "Your personal guide to a healthier, more balanced, and more fulfilling life.";

/** Public marketing page shown to visitors who are not signed in. */
export function Landing() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col px-4 pb-4 pt-0 sm:pb-6">
      <section className="py-6 sm:hidden">
        <PageHeader
          as="p"
          title={TAGLINE}
          subtitle="One honest check-in. One clear action. Every day."
        />
        <div className="mx-auto flex max-w-xs flex-col gap-3">
          <Button asChild size="lg" className="h-12 w-full rounded-full text-[15px] font-extrabold">
            <Link to="/auth" search={{ mode: "signup" }}>
              <UserPlus className="h-4 w-4" />
              Create your account
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 w-full rounded-full border-2 border-primary text-[15px] font-extrabold text-primary">
            <Link to="/auth" search={{ mode: "signin" }}>
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-center text-[13px] text-muted-foreground">
          Your daily guidance for a healthier, more balanced life.
        </p>
      </section>

      <section className="relative left-1/2 mb-4 hidden w-screen -translate-x-1/2 overflow-hidden sm:mb-6 sm:block">
        <img
          src={heroImage}
          alt="A happy couple walking together along the beach at sunrise"
          width={1920}
          height={1088}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-transparent to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-12 lg:px-6 lg:py-20">
          <div className="max-w-xl lg:max-w-3xl">
            <h1 className="text-[34px] font-extrabold uppercase leading-[1.05] text-hero-foreground sm:text-[44px] lg:text-[60px]">
              {TAGLINE}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-hero-foreground/80 lg:mt-6 lg:text-lg">
              One honest check-in. One clear action. Every day.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3 lg:flex-nowrap">
              <Button asChild size="lg" className="h-12 rounded-full px-6 text-base font-bold lg:px-8">
                <Link to="/auth" search={{ mode: "signup" }}>
                  <UserPlus className="h-4 w-4" />
                  Create your account
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-2 border-primary bg-transparent px-6 text-base font-bold text-primary hover:bg-primary/10 hover:text-primary lg:px-8">
                <Link to="/auth" search={{ mode: "signin" }}>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-hero-foreground/60">
              Your daily guidance for a healthier, more balanced life.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
