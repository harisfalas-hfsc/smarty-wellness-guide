import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search["mode"] === "signup" ? ("signup" as const) : ("signin" as const),
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Smarty Wellness" },
      {
        name: "description",
        content:
          "Create your Smarty Wellness account or sign in to continue your daily check-ins, missions and wellness journey.",
      },
      { property: "og:title", content: "Sign in to Smarty Wellness" },
      {
        property: "og:description",
        content: "One check-in a day. One clear action. Your personal wellness guidance system.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/" });
  }, [loading, session, navigate]);

  useEffect(() => {
    setMode(search.mode);
  }, [search.mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        void navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/" });
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <div className="text-center">
        <Link to="/" style={{ textDecoration: "none" }}>
          <span className="text-xl font-extrabold uppercase tracking-tight text-primary">Smarty</span>
          <span className="text-xl font-extrabold uppercase tracking-tight text-emerald-500">
            {" "}
            Wellness
          </span>
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
          {mode === "signin" ? "Sign in to continue" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your check-ins, missions and journey stay with you across every device.
        </p>
      </div>

      {sent ? (
        <div className="mt-8 rounded-3xl border-2 border-calm bg-card p-6 text-center shadow-soft">
          <Mail className="mx-auto h-8 w-8 text-calm-deep" />
          <h2 className="mt-3 text-lg font-bold">Confirm your email</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            We sent a confirmation link to <span className="font-semibold">{email}</span>. Open it to
            activate your Smarty Wellness account, then come back and sign in.
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => {
              setSent(false);
              setMode("signin");
            }}
          >
            Back to sign in
          </Button>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border-2 border-primary/60 bg-card p-6 shadow-soft sm:p-7">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={handleGoogle}
          >
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              or with email
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field
                label="Your name"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Alex"
                required={false}
              />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="At least 6 characters"
            />
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to Smarty Wellness?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="font-semibold text-primary"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      )}

      <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-calm-deep" />
        Smarty Wellness is guidance and motivation for everyday life. It is not medical or
        psychological diagnosis or treatment.
      </p>
    </main>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  required = true,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
      />
    </label>
  );
}
