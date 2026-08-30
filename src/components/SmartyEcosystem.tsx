import { Dumbbell, Salad, Footprints, ArrowUpRight } from "lucide-react";
import { SMARTY_APPS } from "@/lib/recommendation";

const APPS = [
  { key: "workout", Icon: Dumbbell, ...SMARTY_APPS.workout },
  { key: "diet", Icon: Salad, ...SMARTY_APPS.diet },
  { key: "move", Icon: Footprints, ...SMARTY_APPS.move },
] as const;

/**
 * Ecosystem connection points. These are pathways, not adverts — surfaced when
 * Smarty Wellness determines another Smarty product is the right next step.
 */
export function SmartyEcosystem() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {APPS.map(({ key, Icon, name, claim, url }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 no-underline transition hover:border-primary"
          style={{ textDecoration: "none" }}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl brand-gradient-soft text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-bold uppercase tracking-wider text-foreground">
              {name}
            </span>
            <span className="block text-xs text-muted-foreground">{claim}</span>
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
        </a>
      ))}
    </div>
  );
}
