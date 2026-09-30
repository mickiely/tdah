"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { awardXpOnce } from "@/lib/xp/award";
import { getUserLocalToday } from "@/lib/date";
import { XP_VALUES, type Capacity } from "@/lib/xp/config";
import { actualMinutesFocused, type FocusDuration } from "@/lib/focus";
import { recordQualifyingDay } from "@/lib/chain";

const FOCUS_DURATIONS: FocusDuration[] = [10, 25, 45];

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export async function syncTimezone(timezone: string) {
  if (!timezone) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ timezone }).eq("id", user.id);
  revalidatePath("/");
}

export async function setCapacity(formData: FormData) {
  const capacity = String(formData.get("capacity")) as Capacity;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const today = await getUserLocalToday(supabase, user.id);

  await supabase.from("daily_checkins").upsert(
    { user_id: user.id, checkin_date: today, capacity },
    { onConflict: "user_id,checkin_date" }
  );

  revalidatePath("/");
}

export async function saveMainQuest(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const today = await getUserLocalToday(supabase, user.id);

  const { data: existing } = await supabase
    .from("quests")
    .select("id")
    .eq("user_id", user.id)
    .eq("quest_date", today)
    .eq("quest_type", "main")
    .neq("status", "replaced")
    .maybeSingle();

  if (existing) {
    await supabase.from("quests").update({ title }).eq("id", existing.id);
  } else {
    await supabase.from("quests").insert({
      user_id: user.id,
      quest_date: today,
      quest_type: "main",
      title,
      xp_value: XP_VALUES.main_quest,
    });
  }

  revalidatePath("/");
}

export async function completeMainQuest(formData: FormData) {
  const questId = String(formData.get("questId") ?? "");
  if (!questId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: quest } = await supabase
    .from("quests")
    .select("id, status, quest_date")
    .eq("id", questId)
    .eq("user_id", user.id)
    .single();

  if (!quest || quest.status === "completed") return;

  await supabase
    .from("quests")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", questId);

  await awardXpOnce(supabase, user.id, "main_quest", questId, quest.quest_date);
  await recordQualifyingDay(supabase, user.id, quest.quest_date);

  revalidatePath("/");
}

export async function toggleRoutineStep(formData: FormData) {
  const stepId = String(formData.get("stepId") ?? "");
  if (!stepId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const today = await getUserLocalToday(supabase, user.id);

  const { data: existingCompletion } = await supabase
    .from("routine_completions")
    .select("id")
    .eq("user_id", user.id)
    .eq("routine_step_id", stepId)
    .eq("completion_date", today)
    .maybeSingle();

  if (existingCompletion) {
    // Undo: safe to remove — XP already awarded for today is not clawed back.
    await supabase.from("routine_completions").delete().eq("id", existingCompletion.id);
  } else {
    await supabase.from("routine_completions").insert({
      user_id: user.id,
      routine_step_id: stepId,
      completion_date: today,
    });

    await awardXpOnce(supabase, user.id, "routine_step", stepId, today);

    const { data: step } = await supabase
      .from("routine_steps")
      .select("routine_id")
      .eq("id", stepId)
      .maybeSingle();

    if (step?.routine_id) {
      const { data: allSteps } = await supabase
        .from("routine_steps")
        .select("id")
        .eq("routine_id", step.routine_id);

      const stepIds = (allSteps ?? []).map((s) => s.id);

      if (stepIds.length > 0) {
        const { data: completions } = await supabase
          .from("routine_completions")
          .select("routine_step_id")
          .eq("user_id", user.id)
          .eq("completion_date", today)
          .in("routine_step_id", stepIds);

        const completedIds = new Set((completions ?? []).map((c) => c.routine_step_id));
        const allStepsDone = stepIds.every((id) => completedIds.has(id));

        if (allStepsDone) {
          await recordQualifyingDay(supabase, user.id, today);
        }
      }
    }
  }

  revalidatePath("/");
}

export async function saveLogbookEntry(formData: FormData) {
  const winText = String(formData.get("winText") ?? "").trim();
  const blockerText = String(formData.get("blockerText") ?? "").trim();
  const tomorrowFirstMove = String(formData.get("tomorrowFirstMove") ?? "").trim();
  const journalText = String(formData.get("journalText") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const today = await getUserLocalToday(supabase, user.id);

  await supabase.from("daily_logbook").upsert(
    {
      user_id: user.id,
      local_date: today,
      win_text: winText || null,
      blocker_text: blockerText || null,
      tomorrow_first_move: tomorrowFirstMove || null,
      journal_text: journalText || null,
    },
    { onConflict: "user_id,local_date" }
  );

  revalidatePath("/");
}

export async function saveDailyReview(formData: FormData) {
  const movedForward = String(formData.get("movedForward") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!["yes", "a_little", "not_really"].includes(movedForward)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const today = await getUserLocalToday(supabase, user.id);

  const { data: review } = await supabase
    .from("daily_reviews")
    .upsert(
      {
        user_id: user.id,
        review_date: today,
        moved_forward: movedForward,
        note: note || null,
      },
      { onConflict: "user_id,review_date" }
    )
    .select("id")
    .single();

  if (review) {
    await awardXpOnce(supabase, user.id, "daily_review", review.id, today);
    await recordQualifyingDay(supabase, user.id, today);
  }

  revalidatePath("/");
}

export async function startFocusSession(formData: FormData) {
  const duration = Number(formData.get("duration"));
  if (!FOCUS_DURATIONS.includes(duration as FocusDuration)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: activeSession } = await supabase
    .from("focus_sessions")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["in_progress", "paused"])
    .maybeSingle();

  if (activeSession) {
    redirect("/focus");
  }

  const today = await getUserLocalToday(supabase, user.id);
  const { data: mainQuest } = await supabase
    .from("quests")
    .select("id")
    .eq("user_id", user.id)
    .eq("quest_date", today)
    .eq("quest_type", "main")
    .neq("status", "replaced")
    .maybeSingle();

  await supabase.from("focus_sessions").insert({
    user_id: user.id,
    quest_id: mainQuest?.id ?? null,
    duration_minutes: duration,
    status: "in_progress",
  });

  redirect("/focus");
}

export async function pauseFocusSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("focus_sessions")
    .update({ status: "paused", paused_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .eq("status", "in_progress");

  revalidatePath("/focus");
}

export async function resumeFocusSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: session } = await supabase
    .from("focus_sessions")
    .select("paused_at, total_paused_seconds")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .eq("status", "paused")
    .maybeSingle();

  if (!session?.paused_at) return;

  const pausedSeconds = (Date.now() - new Date(session.paused_at).getTime()) / 1000;

  await supabase
    .from("focus_sessions")
    .update({
      status: "in_progress",
      paused_at: null,
      total_paused_seconds: session.total_paused_seconds + Math.max(0, pausedSeconds),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  revalidatePath("/focus");
}

export async function completeFocusSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: session } = await supabase
    .from("focus_sessions")
    .select("started_at, paused_at, total_paused_seconds, status")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (!session) return;

  const now = new Date();
  const actualMinutes = actualMinutesFocused(session, now);

  await supabase
    .from("focus_sessions")
    .update({ status: "completed", completed_at: now.toISOString(), actual_minutes: actualMinutes })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  const today = await getUserLocalToday(supabase, user.id);
  await awardXpOnce(supabase, user.id, "focus_session", sessionId, today);
  await recordQualifyingDay(supabase, user.id, today);

  revalidatePath("/focus");
  revalidatePath("/");
}

export async function stopFocusSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: session } = await supabase
    .from("focus_sessions")
    .select("started_at, paused_at, total_paused_seconds, status")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .in("status", ["in_progress", "paused"])
    .maybeSingle();

  if (session) {
    const now = new Date();
    const actualMinutes = actualMinutesFocused(session, now);

    await supabase
      .from("focus_sessions")
      .update({ status: "stopped", completed_at: now.toISOString(), actual_minutes: actualMinutes })
      .eq("id", sessionId)
      .eq("user_id", user.id);
  }

  revalidatePath("/");
  redirect("/");
}

export async function saveSoundtrackSettings(formData: FormData) {
  const soundtrackIgnite = String(formData.get("soundtrackIgnite") ?? "").trim();
  const soundtrackLockIn = String(formData.get("soundtrackLockIn") ?? "").trim();
  const soundtrackGrind = String(formData.get("soundtrackGrind") ?? "").trim();
  const soundtrackReset = String(formData.get("soundtrackReset") ?? "").trim();
  const soundtrackVictoryLap = String(formData.get("soundtrackVictoryLap") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({
      soundtrack_ignite: soundtrackIgnite || null,
      soundtrack_lock_in: soundtrackLockIn || null,
      soundtrack_grind: soundtrackGrind || null,
      soundtrack_reset: soundtrackReset || null,
      soundtrack_victory_lap: soundtrackVictoryLap || null,
    })
    .eq("id", user.id);

  revalidatePath("/");
  redirect("/settings");
}
