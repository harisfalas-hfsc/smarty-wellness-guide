import { Link } from "@tanstack/react-router";
import { LogIn, UserPlus } from "lucide-react";
import heroAsset from "@/assets/hero-family-sky.jpg.asset.json";
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
          src={heroAsset.url}
          alt="Happy parents carrying their two laughing children piggyback against a bright blue sky"
          width={1000}
          height={453}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-12 lg:px-6 lg:py-20">
          <div className="max-w-xl lg:max-w-3xl">
            <h1 className="text-[34px] font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-[44px] lg:text-[60px]">
              Your personal guide
              <br />
              to a healthier, more balanced,
              <br />
              <span className="whitespace-nowrap text-primary">and more fulfilling life.</span>
            </h1>

            <p className="mt-5 text-base leading-relaxed text-white/80 lg:mt-6 lg:text-lg">
              One honest check-in. One clear action. Every day.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3 lg:flex-nowrap">
              <Button asChild size="lg" className="h-12 rounded-full px-6 text-base font-bold lg:px-8">
                <Link to="/auth" search={{ mode: "signup" }}>
                  <UserPlus className="h-4 w-4 shrink-0" />
                  Create your account
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-2 border-primary bg-transparent px-6 text-base font-bold text-primary hover:bg-primary/10 hover:text-primary lg:px-8">
                <Link to="/auth" search={{ mode: "signin" }}>
                  <LogIn className="h-4 w-4 shrink-0" />
                  Sign in
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
