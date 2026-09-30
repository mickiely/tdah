export type FocusStatus = "in_progress" | "paused" | "completed" | "stopped";
export type FocusDuration = 10 | 25 | 45;

export type FocusTiming = {
  started_at: string;
  paused_at: string | null;
  total_paused_seconds: number;
  status: FocusStatus;
};

/**
 * Active (non-paused) seconds elapsed since the session started, as of `now`.
 * While paused, time is frozen at the moment the pause began — this is the
 * single source of truth for remaining time, recomputed fresh on every
 * render/refresh rather than trusting a client-side running counter.
 */
export function elapsedActiveSeconds(session: FocusTiming, now: Date): number {
  const startedAt = new Date(session.started_at).getTime();
  const reference =
    session.status === "paused" && session.paused_at
      ? new Date(session.paused_at).getTime()
      : now.getTime();

  const rawSeconds = (reference - startedAt) / 1000;
  return Math.max(0, rawSeconds - session.total_paused_seconds);
}

export function remainingSeconds(
  durationMinutes: number,
  session: FocusTiming,
  now: Date
): number {
  return Math.max(0, durationMinutes * 60 - elapsedActiveSeconds(session, now));
}

export function formatMinutesSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function actualMinutesFocused(session: FocusTiming, now: Date): number {
  return Math.max(0, Math.round(elapsedActiveSeconds(session, now) / 60));
}
