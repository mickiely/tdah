import type { Capacity } from "@/lib/xp/config";

export type MovedForward = "yes" | "a_little" | "not_really";

export type DailySummaryData = {
  dateLabel: string;
  isoDate: string;
  capacity: Capacity | null;
  missionTitle: string | null;
  missionComplete: boolean;
  launchSequenceCompleted: number;
  launchSequenceTotal: number;
  focusMinutesToday: number | null;
  xpEarnedToday: number;
  landing: { movedForward: MovedForward | null; note: string | null };
  logbook: {
    winText: string | null;
    blockerText: string | null;
    tomorrowFirstMove: string | null;
    journalText: string | null;
  };
};

export const CAPACITY_LABELS: Record<Capacity, string> = {
  flat: "Flat",
  steady: "Steady",
  fired_up: "Fired up",
};

export const MOVED_FORWARD_LABELS: Record<MovedForward, string> = {
  yes: "Yes",
  a_little: "A little",
  not_really: "Not really",
};

function missionLine(data: DailySummaryData): string | null {
  if (!data.missionTitle) return null;
  return `Mission: ${data.missionTitle} — ${data.missionComplete ? "complete" : "in progress"}`;
}

/**
 * Private export: every field, including journal text. Never included in
 * "Share a Win" — the caller must opt into this explicitly.
 */
export function buildPrivateSummaryText(data: DailySummaryData): string {
  const lines: string[] = [data.dateLabel, ""];

  if (data.capacity) lines.push(`Capacity: ${CAPACITY_LABELS[data.capacity]}`);
  const mission = missionLine(data);
  if (mission) lines.push(mission);
  if (data.launchSequenceTotal > 0) {
    lines.push(
      `Launch Sequence: ${data.launchSequenceCompleted} of ${data.launchSequenceTotal}`
    );
  }
  if (data.focusMinutesToday) lines.push(`Focus minutes: ${data.focusMinutesToday}`);
  lines.push(`XP earned: ${data.xpEarnedToday}`);

  if (data.landing.movedForward) {
    lines.push("", `Moved life forward today: ${MOVED_FORWARD_LABELS[data.landing.movedForward]}`);
    if (data.landing.note) lines.push(data.landing.note);
  }

  if (data.logbook.winText) lines.push("", "Win:", data.logbook.winText);
  if (data.logbook.blockerText) lines.push("", "What got in the way:", data.logbook.blockerText);
  if (data.logbook.tomorrowFirstMove) {
    lines.push("", "Tomorrow's first move:", data.logbook.tomorrowFirstMove);
  }
  if (data.logbook.journalText) lines.push("", "Journal:", data.logbook.journalText);

  return lines.join("\n").trim();
}

/**
 * Share a Win: deliberately narrow — no journal/landing notes, no blockers.
 * Only what the user would want visible outside TDAH.
 */
export function buildShareAWinText(data: DailySummaryData): string {
  const lines: string[] = [];

  const mission = missionLine(data);
  if (mission) lines.push(mission);
  if (data.focusMinutesToday) lines.push(`Focus: ${data.focusMinutesToday} min`);
  lines.push(`XP earned: ${data.xpEarnedToday}`);

  if (data.logbook.winText) lines.push("", "Win:", data.logbook.winText);

  lines.push("", "— tracked with TDAH");

  return lines.join("\n").trim();
}

/**
 * Day One readiness: no API integration — just a clean, self-contained
 * entry the user can paste into Day One by hand.
 */
export function buildDayOneText(data: DailySummaryData): string {
  const title = `${data.dateLabel} — TDAH Daily Log`;
  const tags = ["tdah", "daily-log"];

  const header = [`Title: ${title}`, `Date: ${data.isoDate}`, `Tags: ${tags.join(", ")}`, ""];

  return [...header, buildPrivateSummaryText(data)].join("\n").trim();
}

export function summaryFileBaseName(isoDate: string): string {
  return `tdah-daily-summary-${isoDate}`;
}
