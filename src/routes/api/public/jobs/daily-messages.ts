import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/jobs/daily-messages")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { runDailyMessages } = await import("@/lib/daily-messages.server");
        const result = await runDailyMessages(supabaseAdmin, "schedule");
        return Response.json({ success: true, ...result });
      },
    },
  },
});
