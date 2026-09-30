import type { SupabaseClient } from "@supabase/supabase-js";
import { daysBetween } from "./date";

const GRACE_WINDOW_DAYS = 7;

export type ChainProgress = {
  current_chain_length: number;
  longest_chain_length: number;
  chain_last_qualifying_date: string | null;
  last_grace_used_date: string | null;
  comeback_count: number;
};

/** A grace day is available once per rolling 7-day window since it was last used. */
export function isGraceAvailable(lastGraceUsedDate: string | null, today: string): boolean {
  if (!lastGraceUsedDate) return true;
  return daysBetween(lastGraceUsedDate, today) >= GRACE_WINDOW_DAYS;
}

export type ChainUpdate = ChainProgress & { changed: boolean };

/**
 * Pure decision function: given the cached chain state and a newly
 * qualifying local date, what should the new cached state be?
 *
 * - Same day recorded twice in one day: no-op.
 * - Exactly one missed day, with a grace day available: chain continues.
 * - Any larger gap (or grace already used this week): chain resets to 1
 *   and a comeback is recorded — never a punitive "streak lost" state,
 *   just a fresh count starting today.
 */
export function computeChainUpdate(progress: ChainProgress, today: string): ChainUpdate {
  const last = progress.chain_last_qualifying_date;

  if (last === today) {
    return { ...progress, changed: false };
  }

  if (!last) {
    return {
      current_chain_length: 1,
      longest_chain_length: Math.max(1, progress.longest_chain_length),
      chain_last_qualifying_date: today,
      last_grace_used_date: progress.last_grace_used_date,
      comeback_count: progress.comeback_count,
      changed: true,
    };
  }

  const gap = daysBetween(last, today);

  if (gap === 1) {
    const current = progress.current_chain_length + 1;
    return {
      current_chain_length: current,
      longest_chain_length: Math.max(current, progress.longest_chain_length),
      chain_last_qualifying_date: today,
      last_grace_used_date: progress.last_grace_used_date,
      comeback_count: progress.comeback_count,
      changed: true,
    };
  }

  if (gap === 2 && isGraceAvailable(progress.last_grace_used_date, today)) {
    const current = progress.current_chain_length + 1;
    return {
      current_chain_length: current,
      longest_chain_length: Math.max(current, progress.longest_chain_length),
      chain_last_qualifying_date: today,
      last_grace_used_date: today,
      comeback_count: progress.comeback_count,
      changed: true,
    };
  }

  return {
    current_chain_length: 1,
    longest_chain_length: Math.max(1, progress.longest_chain_length),
    chain_last_qualifying_date: today,
    last_grace_used_date: progress.last_grace_used_date,
    comeback_count: progress.comeback_count + 1,
    changed: true,
  };
}

/**
 * Read-only display value: shows the cached chain as still alive through a
 * single missed day (or a grace-eligible gap), otherwise treats it as
 * lapsed (0) rather than showing a stale number that a fresh qualifying
 * day would not actually continue from.
 */
export function displayCurrentChain(progress: ChainProgress, today: string): number {
  const last = progress.chain_last_qualifying_date;
  if (!last) return 0;

  const gap = daysBetween(last, today);
  if (gap <= 1) return progress.current_chain_length;
  if (gap === 2 && isGraceAvailable(progress.last_grace_used_date, today)) {
    return progress.current_chain_length;
  }
  return 0;
}

const CHAIN_COLUMNS =
  "current_chain_length, longest_chain_length, chain_last_qualifying_date, last_grace_used_date, comeback_count";

/**
 * Records today as a qualifying day, if it isn't already. Safe to call more
 * than once for the same day (e.g. completing the Mission and saving
 * Landing on the same day) — the second call is a no-op. Call this only
 * after the corresponding awardXpOnce for the same action, so the
 * user_progress row already exists with correct XP fields intact.
 */
export async function recordQualifyingDay(
  supabase: SupabaseClient,
  userId: string,
  today: string
): Promise<void> {
  const { data: progress } = await supabase
    .from("user_progress")
    .select(CHAIN_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  const current: ChainProgress = {
    current_chain_length: progress?.current_chain_length ?? 0,
    longest_chain_length: progress?.longest_chain_length ?? 0,
    chain_last_qualifying_date: progress?.chain_last_qualifying_date ?? null,
    last_grace_used_date: progress?.last_grace_used_date ?? null,
    comeback_count: progress?.comeback_count ?? 0,
  };

  const update = computeChainUpdate(current, today);
  if (!update.changed) return;

  await supabase.from("user_progress").upsert({
    user_id: userId,
    current_chain_length: update.current_chain_length,
    longest_chain_length: update.longest_chain_length,
    chain_last_qualifying_date: update.chain_last_qualifying_date,
    last_grace_used_date: update.last_grace_used_date,
    comeback_count: update.comeback_count,
  });
}
