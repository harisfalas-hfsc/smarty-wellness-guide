import { createFileRoute } from "@tanstack/react-router";
import { RitualPage } from "@/components/RitualPage";

export const Route = createFileRoute("/morning")({
  head: () => ({
    meta: [
      { title: "Morning Activation — Smarty Wellness" },
      { name: "description", content: "Start your day with a quick check-in, breathing, water, light movement and one clear intention." },
      { property: "og:title", content: "Morning Activation — Smarty Wellness" },
      { property: "og:description", content: "Start your day with a quick check-in, breathing, water, light movement and one clear intention." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RitualPage period="morning" />,
});
