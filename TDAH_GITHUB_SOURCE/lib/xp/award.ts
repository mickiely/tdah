import type { SupabaseClient } from "@supabase/supabase-js";
import { XP_VALUES, type XpEventType, levelForXp } from "./config";
import { daysBetween } from "@/lib/date";

type Momentum = "rebuilding" | "moving" | "strong" | "flowing";

/**
 * Awards XP for (userId, eventType, sourceId, eventDate) exactly once.
 * Relies on the xp_events_unique_source DB constraint so idempotency
 * holds even under concurrent/duplicate submissions, not just this check.
 * Returns true if XP was newly awarded, false if it had already been awarded.
 */
export async function awardXpOnce(
  supabase: SupabaseClient,
  userId: string,
  eventType: XpEventType,
  sourceId: string,
  eventDate: string
): Promise<boolean> {
  const xpAmount = XP_VALUES[eventType];

  const { data: inserted } = await supabase
    .from("xp_events")
    .upsert(
      {
        user_id: userId,
        event_type: eventType,
        xp_amount: xpAmount,
        source_id: sourceId,
        event_date: eventDate,
      },
      { onConflict: "user_id,event_type,source_id,event_date", ignoreDuplicates: true }
    )
    .select("id");

  const wasAwarded = (inserted?.length ?? 0) > 0;
  if (!wasAwarded) return false;

  const { data: progress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const totalXp = (progress?.total_xp ?? 0) + xpAmount;
  const isComeback = Boolean(
    progress?.last_active_date && daysBetween(progress.last_active_date, eventDate) > 1
  );

  await supabase.from("user_progress").upsert({
    user_id: userId,
    total_xp: totalXp,
    level: levelForXp(totalXp),
    last_active_date: eventDate,
    is_comeback: isComeback,
    momentum_state: await computeMomentum(supabase, userId, eventDate),
  });

  return true;
}

async function computeMomentum(
  supabase: SupabaseClient,
  userId: string,
  asOfDate: string
): Promise<Momentum> {
  const since = new Date(asOfDate);
  since.setDate(since.getDate() - 7);

  const { count } = await supabase
    .from("xp_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("event_date", since.toISOString().slice(0, 10));

  const activity = count ?? 0;

  if (activity >= 14) return "flowing";
  if (activity >= 8) return "strong";
  if (activity >= 3) return "moving";
  return "rebuilding";
}
