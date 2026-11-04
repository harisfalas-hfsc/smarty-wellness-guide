import { describe, expect, it } from "vitest";
import { localDateKey } from "./dates";
import { parseLegacy } from "./legacy-migration";

describe("localDateKey", () => {
  it("uses the local calendar date in the given time zone, not UTC", () => {
    const lateEvening = new Date("2026-11-04T23:30:00Z");
    expect(localDateKey(lateEvening, "Asia/Nicosia")).toBe("2026-11-05");
    expect(localDateKey(lateEvening, "America/New_York")).toBe("2026-11-04");
  });
});

describe("parseLegacy", () => {
  it("returns null for corrupted data", () => {
    expect(parseLegacy("{not json")).toBeNull();
  });
  it("keeps one valid check-in per day and skips invalid ones", () => {
    const raw = JSON.stringify({
      checkIns: [
        { id: "a", date: "2026-11-01", mood: "good", energy: 3, stress: 2, motivation: 4, sleep: 3, need: "move" },
        { id: "b", date: "2026-11-01", mood: "good", energy: 3, stress: 2, motivation: 4, sleep: 3, needs: [] },
        { id: "c", date: "2026-11-02", mood: "good", energy: 9, stress: 2, motivation: 4, sleep: 3, needs: [] },
      ],
    });
    const out = parseLegacy(raw)!;
    expect(out.checkIns.map((c) => c.id)).toEqual(["a"]);
    expect(out.checkIns[0]!.needs).toEqual(["move"]);
    expect(out.skipped).toBe(2);
  });
});
