import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { LEGACY_KEY, legacyAlreadyImported, parseLegacy, runLegacyImport, type LegacyData } from "@/lib/legacy-migration";

const DISMISS_KEY = "smarty-wellness:legacy-dismissed";

/** Offers — never forces — moving old device-only data into the account. */
export function LegacyImportBanner() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [pending, setPending] = useState<{ raw: string; data: LegacyData } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPending(null);
    if (!user) return;
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw || window.localStorage.getItem(`${DISMISS_KEY}:${user.id}`)) return;
    const data = parseLegacy(raw);
    if (!data) return;
    let live = true;
    void legacyAlreadyImported(user.id, raw).then((done) => { if (live && !done) setPending({ raw, data }); });
    return () => { live = false; };
  }, [user]);

  if (!user || !pending) return null;

  return (
    <div className="mx-4 mt-4 rounded-3xl border-2 border-sun/70 bg-card p-4 shadow-soft md:mx-6">
      <p className="text-sm font-bold">We found Smarty Wellness data saved on this device.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {pending.data.checkIns.length} check-ins and {pending.data.bucketList.length} goals. Add them to this account ({user.email})?
        Days you've already checked in on stay as they are.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const c = await runLegacyImport(user.id, pending.raw, pending.data);
              toast.success(`Imported ${c.checkIns} check-ins and ${c.goals} goals.`);
              setPending(null);
              await qc.invalidateQueries({ queryKey: ["wellness"] });
            } catch {
              toast.error("The import didn't finish. Nothing on this device was removed — you can try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Importing…" : "Yes, add to my account"}
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => {
            window.localStorage.setItem(`${DISMISS_KEY}:${user.id}`, "1");
            setPending(null);
          }}
        >
          Not now
        </Button>
      </div>
    </div>
  );
}
