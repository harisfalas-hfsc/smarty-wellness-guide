import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWellness } from "@/lib/wellness-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings & Account — Smarty Wellness" },
      {
        name: "description",
        content: "Manage your Smarty Wellness account, your data and how Smarty supports you.",
      },
      { property: "og:title", content: "Settings & Account — Smarty Wellness" },
      { property: "og:description", content: "Your account, your data, your choices." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, updateProfile, reset } = useWellness();

  return (
    <PageShell width="3xl">
      <PageHeader
        eyebrow="Account"
        icon={SettingsIcon}
        title="Settings"
        subtitle="Your Smarty Wellness account and data."
      />

      <div className="space-y-4">
        <section className="rounded-3xl border-2 border-primary/50 bg-card p-6 shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Your details
          </p>
          <div className="mt-4">
            <Label htmlFor="set-name">Display name</Label>
            <Input
              id="set-name"
              className="mt-1.5"
              value={state.profile.personal.name}
              onChange={(e) => updateProfile("personal", { name: e.target.value })}
              placeholder="Alex"
            />
          </div>
          <Link to="/profile" style={{ textDecoration: "none" }}>
            <Button variant="outline" className="mt-4">
              Edit wellness profile
            </Button>
          </Link>
        </section>

        <section className="rounded-3xl border-2 border-sun/70 bg-card p-6 shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Your data
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your profile, check-ins, missions and goals are stored on this device. You have{" "}
            {state.checkIns.length} check-in{state.checkIns.length === 1 ? "" : "s"} saved.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              reset();
              toast.success("All Smarty Wellness data cleared on this device.");
            }}
          >
            Clear my data
          </Button>
        </section>

        <section className="rounded-3xl border-2 border-primary bg-card p-6 shadow-soft">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-bold">Safety and scope</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Smarty Wellness provides wellness and lifestyle guidance. It does not diagnose or
                treat depression, anxiety, psychological disorders or any medical condition, and it
                is not a substitute for professional care. If you are struggling, or if something
                feels beyond everyday stress, please speak with a qualified professional or your
                local emergency service.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
