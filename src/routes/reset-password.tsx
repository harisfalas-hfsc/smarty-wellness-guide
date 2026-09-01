import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Smarty Wellness" },
      { name: "description", content: "Choose a new password for your Smarty Wellness account." },
      { property: "og:title", content: "Reset password — Smarty Wellness" },
      { property: "og:description", content: "Securely choose a new Smarty Wellness password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isRecoveryLink = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    void supabase.auth.getSession().then(({ data }) => setReady(isRecoveryLink || Boolean(data.session)));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    void navigate({ to: "/" });
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <div className="text-center">
        <Link to="/" className="text-xl font-extrabold uppercase text-primary">Smarty Wellness</Link>
        <h1 className="mt-4 text-2xl font-extrabold">Choose a new password</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Use at least six characters.</p>
      </div>

      <div className="mt-8 rounded-3xl border-2 border-primary/60 bg-card p-6 shadow-soft sm:p-7">
        {ready ? (
          <form onSubmit={submit} className="space-y-4">
            <PasswordField label="New password" value={password} onChange={setPassword} visible={visible} onToggle={() => setVisible((value) => !value)} />
            <PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} visible={visible} onToggle={() => setVisible((value) => !value)} />
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              Update password
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-calm-deep" />
            <p className="mt-3 text-sm leading-6 text-muted-foreground">This reset link is invalid or has expired. Request a new link from the sign-in page.</p>
            <Link to="/auth" search={{ mode: "forgot" }} className="mt-5 inline-block text-sm font-semibold text-primary">Request another link</Link>
          </div>
        )}
      </div>
    </main>
  );
}

function PasswordField({ label, value, onChange, visible, onToggle }: { label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
      <span className="relative mt-1.5 block">
        <input type={visible ? "text" : "password"} value={value} required minLength={6} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border-2 border-primary/40 bg-background px-4 py-3 pr-12 text-sm outline-none transition focus:border-primary" />
        <Button type="button" variant="ghost" size="icon" aria-label={visible ? "Hide password" : "Show password"} title={visible ? "Hide password" : "Show password"} className="absolute right-1.5 top-1/2 -translate-y-1/2" onClick={onToggle}>
          {visible ? <EyeOff /> : <Eye />}
        </Button>
      </span>
    </label>
  );
}