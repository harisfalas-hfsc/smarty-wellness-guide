/**
 * Smarty Coach — server-side only. Loads the signed-in user's records through
 * their own (RLS-scoped) client, builds the SAME intelligence the app shows,
 * and asks the Lovable AI Gateway for a reply. Provider credentials never
 * leave the server.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL = "openai/gpt-6-astra" as const;

const INSTRUCTIONS = `You are Smarty Coach inside Smarty Wellness, a lifestyle and wellbeing app (not a medical service).

How you talk:
- Human, warm, direct and practical. Short replies: usually 2–5 sentences or a few bullets. No motivational quotes, no lectures.
- Always tie advice to the user's actual records below when relevant ("Your last three check-ins show…"). Never invent data.
- Keep three things clearly apart: what the user told us, what their records show, and what you suggest.
- Missing records mean "we don't know yet", never "you aren't doing it". Say what information is missing when it matters.
- Patterns are associations ("seems to coincide with"), never causes.
- End with ONE realistic next action they can do today, and explain why if useful. If it matches an existing mission, challenge, breathing session, ritual or habit in the app, name it.
- Respect stated physical limitations; never suggest activities that conflict with them.
- Don't ask questions the profile already answers. Ask at most one short question if truly needed.

Safety:
- Never diagnose conditions, prescribe treatment or medication, or claim certainty.
- Never set protein, calorie or medical targets yourself.
- If the user mentions concerning symptoms (chest pain, fainting, persistent low mood, self-harm, disordered eating, severe or lasting pain or exhaustion), kindly recommend speaking to a doctor or qualified professional; for immediate danger, urge contacting local emergency services.

Formatting: plain markdown, no headings.`;

type Input = { message: string; today: string; retry?: boolean };

export const askCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Input): Input => {
    if (!input || typeof input !== "object") throw new Error("Invalid request");
    const message = String(input.message ?? "").trim();
    if (!input.retry && (message.length < 1 || message.length > 2000)) throw new Error("Message must be 1–2000 characters.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(input.today))) throw new Error("Invalid date");
    return { message, today: input.today, retry: Boolean(input.retry) };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { loadWellnessState } = await import("@/lib/data/wellness-repo");
    const { loadDaily } = await import("@/lib/data/daily-repo");
    const { analyse, contextForCoach } = await import("@/lib/intelligence/engine");
    const { addDays } = await import("@/lib/daily-metrics");
    const { generateResponse, GatewayError, PaymentRequiredError, RateLimitError } = await import("@lovable.dev/ai-gateway");

    // Conversation (one ongoing conversation per user).
    let { data: conv } = await supabase.from("coach_conversations").select("id")
      .eq("user_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (!conv) {
      const created = await supabase.from("coach_conversations").insert({ user_id: userId, title: "Smarty Coach" }).select("id").single();
      if (created.error) throw new Error("Couldn't start a conversation.");
      conv = created.data;
    }
    const conversationId = conv.id;

    if (!data.retry) {
      const ins = await supabase.from("coach_messages").insert({ user_id: userId, conversation_id: conversationId, role: "user", text: data.message });
      if (ins.error) throw new Error("Couldn't save your message.");
    }

    const [state, daily, outcomes, history] = await Promise.all([
      loadWellnessState(userId, supabase),
      loadDaily(userId, addDays(data.today, -35), supabase),
      supabase.from("recommendations").select("rec_key, status, local_date, postponed_until")
        .eq("user_id", userId).gte("local_date", addDays(data.today, -30)),
      supabase.from("coach_messages").select("role, text").eq("conversation_id", conversationId)
        .order("created_at", { ascending: false }).limit(30),
    ]);
    const intel = analyse(state, daily, data.today, outcomes.data ?? []);
    const msgs = (history.data ?? []).reverse().filter((m) => m.role === "user" || m.role === "coach");
    if (!msgs.length || msgs[msgs.length - 1]!.role !== "user") throw new Error("Nothing to answer yet.");

    try {
      const res = await generateResponse({
        model: MODEL,
        instructions: `${INSTRUCTIONS}\n\n# The user's wellness context\n${contextForCoach(intel, state)}`,
        input: msgs.map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        })),
        max_output_tokens: 900,
      });
      const text = extractText(res).trim();
      if (!text) throw new Error("Smarty Coach didn't produce a reply. Please try again.");
      const saved = await supabase.from("coach_messages")
        .insert({ user_id: userId, conversation_id: conversationId, role: "coach", text })
        .select("id, created_at").single();
      if (saved.error) throw new Error("Reply generated but couldn't be saved.");
      await supabase.from("coach_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
      return { id: saved.data.id, text, at: saved.data.created_at };
    } catch (err) {
      if (err instanceof PaymentRequiredError) throw new Error("Smarty Coach is temporarily unavailable (AI credits exhausted). Please try again later.");
      if (err instanceof RateLimitError) throw new Error("Smarty Coach is busy right now. Please wait a moment and tap Retry.");
      if (err instanceof GatewayError) {
        console.error("coach gateway error", err.code, err.ids);
        throw new Error("Smarty Coach couldn't answer just now. Your message is saved — tap Retry.");
      }
      throw err;
    }
  });

export const clearCoachHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("coach_conversations").delete().eq("user_id", context.userId);
    if (error) throw new Error("Couldn't clear the conversation.");
    return { ok: true };
  });

function extractText(res: unknown): string {
  const r = res as { output_text?: string; output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> };
  if (typeof r.output_text === "string" && r.output_text) return r.output_text;
  return (r.output ?? [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("");
}
