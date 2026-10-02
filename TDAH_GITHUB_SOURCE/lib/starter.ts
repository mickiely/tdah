export type Starter = {
  action: string;
  savedAt: string;
  confirmedAt?: string;
  nextNote?: string;
  helpful?: "yes" | "no";
  timer?: { status: "running" | "paused" | "finished"; remainingMs: number; runningSince?: number };
};

export function starterRemaining(starter: Starter, now: number): number {
  const timer = starter.timer;
  if (!timer) return 120000;
  const elapsed = timer.status === "running" ? Math.max(0, now - (timer.runningSince ?? now)) : 0;
  return Math.max(0, timer.remainingMs - elapsed);
}
