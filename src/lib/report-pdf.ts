/**
 * Personal Development Report PDF, generated in the browser from the signed-in
 * user's own data (never sent to a server).
 */
import type { DevReview } from "@/lib/intelligence/development";

const BLUE: [number, number, number] = [14, 165, 233];
const GREEN: [number, number, number] = [16, 185, 129];
const INK: [number, number, number] = [30, 41, 59];
const MUTED: [number, number, number] = [100, 116, 139];

export interface ReportGoal { title: string; status: string; pct: number; method: string; milestones: string }
export interface ReportExperiment { title: string; result: string }

export async function exportDevelopmentPdf(opts: { name: string; review: DevReview; goals: ReportGoal[]; experiments: ReportExperiment[]; reflection: string }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight();
  const M = 48; let y = 0;
  const r = opts.review; const s = r.stats;
  const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

  const ensure = (h: number) => { if (y + h > H - 56) { footer(); doc.addPage(); y = M; } };
  const footer = () => {
    doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text("Smarty Wellness · Personal Development Report · Lifestyle guidance, not medical advice.", M, H - 28);
    doc.text(String(doc.getNumberOfPages()), W - M, H - 28, { align: "right" });
  };
  const heading = (t: string, color = BLUE) => {
    ensure(40); y += 12;
    doc.setDrawColor(...color); doc.setLineWidth(2); doc.line(M, y, M + 28, y); y += 16;
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...INK); doc.text(t.toUpperCase(), M, y); y += 14;
  };
  const para = (t: string, size = 10, color = INK) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(size); doc.setTextColor(...color);
    for (const line of doc.splitTextToSize(t, W - 2 * M) as string[]) { ensure(14); doc.text(line, M, y); y += size + 4; }
  };
  const bullets = (items: string[], empty: string) => {
    if (!items.length) { para(empty, 10, MUTED); return; }
    for (const it of items) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...INK);
      const lines = doc.splitTextToSize(it, W - 2 * M - 14) as string[];
      ensure(lines.length * 14);
      doc.setFillColor(...GREEN); doc.circle(M + 3, y - 3, 2, "F");
      lines.forEach((l, i) => doc.text(l, M + 14, y + i * 14));
      y += lines.length * 14 + 2;
    }
  };

  // Header band
  doc.setFillColor(...BLUE); doc.rect(0, 0, W, 96, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(255, 255, 255);
  doc.text("SMARTY", M, 50); doc.setTextColor(209, 250, 229); doc.text("WELLNESS", M + doc.getTextWidth("SMARTY "), 50);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
  doc.text(`Personal Development Report${opts.name ? ` — ${opts.name}` : ""}`, M, 72);
  doc.text(`${fmt(r.start)} – ${fmt(r.end)}`, W - M, 72, { align: "right" });
  y = 124;
  if (!r.enoughData) para("Note: few records exist for this period, so this report can only say a limited amount.", 10, MUTED);

  heading("At a glance");
  const rows: [string, string][] = [
    ["Days with any record", `${s.activeDays} of ${s.days}`], ["Check-ins", String(s.checkInDays)],
    ["Mood / Energy (avg, 1–5)", `${s.mood ?? "—"} / ${s.energy ?? "—"}`], ["Stress / Sleep quality (avg, 1–5)", `${s.stress ?? "—"} / ${s.sleep ?? "—"}`],
    ["Morning / Midday / Evening rituals", `${s.rituals.morning} / ${s.rituals.midday} / ${s.rituals.evening}`],
    ["Water logged / Protein logged", `${s.hydrationDays} / ${s.proteinDays} days`], ["Breathing sessions", String(s.breathingSessions)],
    ["Personal time", `${s.personalMinutes} min`], ["Mission completions", String(s.missionCompletions)],
    ["Milestones / Goals completed", `${s.milestonesDone} / ${s.goalsCompleted}`], ["Experiments active / finished", `${s.experimentsActive} / ${s.experimentsCompleted}`],
  ];
  doc.setFontSize(10);
  for (const [k, v] of rows) { ensure(16); doc.setTextColor(...MUTED); doc.text(k, M, y); doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.text(v, W - M, y, { align: "right" }); doc.setFont("helvetica", "normal"); y += 16; }

  heading("Personal goals");
  if (!opts.goals.length) para("No goals recorded.", 10, MUTED);
  for (const g of opts.goals) {
    ensure(40);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...INK); doc.text(`${g.title} — ${g.status}`, M, y);
    doc.text(`${g.pct}%`, W - M, y, { align: "right" }); y += 8;
    doc.setFillColor(226, 232, 240); doc.roundedRect(M, y, W - 2 * M, 6, 3, 3, "F");
    doc.setFillColor(...GREEN); if (g.pct > 0) doc.roundedRect(M, y, ((W - 2 * M) * g.pct) / 100, 6, 3, 3, "F"); y += 18;
    para(`${g.method}${g.milestones ? ` Milestones: ${g.milestones}` : ""}`, 9, MUTED);
  }

  heading("Achievements", GREEN); bullets(r.achievements, "No completed goals, milestones or challenges recorded in this period.");
  heading("Habits becoming more consistent", GREEN); bullets(r.consistency, "No clear increase in consistency compared with the previous period.");
  heading("Improvements", GREEN); bullets(r.improvements, "No measurable improvement in check-in averages, or not enough check-ins to compare.");
  heading("Areas needing attention"); bullets(r.challenges, "Nothing stood out as a struggle in your records.");
  heading("Unfinished goals"); bullets(r.unfinished, "No open goals.");
  heading("Experiment results");
  bullets(opts.experiments.map((e) => `${e.title}: ${e.result}`), "No experiments finished in this period.");
  heading("Lessons learned"); bullets(r.lessons, "No lessons recorded yet.");
  heading("Your reflection"); para(opts.reflection || "No reflection added.", 10, opts.reflection ? INK : MUTED);
  heading("Recommended priorities", GREEN); bullets(r.priorities, "Keep your current rhythm.");
  y += 8;
  para("Patterns in this report are associations from your own records, not proof of cause. This report is lifestyle guidance and not a medical document.", 8, MUTED);
  footer();
  doc.save(`smarty-wellness-report-${r.start}-to-${r.end}.pdf`);
}
