import { createFileRoute } from "@tanstack/react-router";
import { RitualPage } from "@/components/RitualPage";

export const Route = createFileRoute("/evening")({
  head: () => ({
    meta: [
      { title: "Evening Unwind — Smarty Wellness" },
      { name: "description", content: "Close your day: check in, reflect, breathe, stretch and prepare for good sleep." },
      { property: "og:title", content: "Evening Unwind — Smarty Wellness" },
      { property: "og:description", content: "Close your day: check in, reflect, breathe, stretch and prepare for good sleep." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RitualPage period="evening" />,
});
