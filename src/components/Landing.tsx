import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-wellness.jpg";

/** Public marketing page shown to visitors who are not signed in. */
export function Landing() {
  return (
    <main className="relative min-h-[calc(100dvh-3.5rem)] overflow-hidden">
      <img
        src={heroImage}
        alt="A happy couple walking together along the beach at sunrise"
        width={1920}
        height={1088}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-[42%_center] sm:object-center"
      />

      <section className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-6xl items-end px-5 py-8 sm:items-center sm:justify-end sm:px-8 sm:py-12 lg:px-6">
        <div className="w-full text-center sm:max-w-[48%] sm:text-left lg:max-w-xl">
          <h1 className="text-4xl font-extrabold uppercase leading-[1.05] text-foreground drop-shadow-[0_1px_2px_var(--color-card)] sm:text-5xl lg:text-6xl">
            Your path to
            <br />
            <span className="text-calm-deep">feeling better</span>
          </h1>
          <p className="mt-4 text-base font-bold leading-7 text-foreground drop-shadow-[0_1px_2px_var(--color-card)] sm:text-lg">
            One honest check-in. One clear action. A healthier, happier you.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:justify-start">
            <Link to="/auth" style={{ textDecoration: "none" }}>
              <Button size="lg" className="w-full sm:w-auto">
                Create free account
              </Button>
            </Link>
            <Link to="/auth" style={{ textDecoration: "none" }}>
              <Button size="lg" variant="outline" className="w-full bg-card/90 sm:w-auto">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
