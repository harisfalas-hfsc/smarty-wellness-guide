import { createFileRoute } from "@tanstack/react-router";
import { RitualPage } from "@/components/RitualPage";

export const Route = createFileRoute("/midday")({
  head: () => ({
    meta: [
      { title: "Midday Reset — Smarty Wellness" },
      { name: "description", content: "A five-minute reset: check in, breathe, move, drink water and refocus for the afternoon." },
      { property: "og:title", content: "Midday Reset — Smarty Wellness" },
      { property: "og:description", content: "A five-minute reset: check in, breathe, move, drink water and refocus for the afternoon." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RitualPage period="midday" />,
});
