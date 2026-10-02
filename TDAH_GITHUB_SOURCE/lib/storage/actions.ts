/**
 * TDAH Local-First Actions
 *
 * Client-side actions replacing Supabase server actions
 */

import { getState, updateState } from "./index";
import { XP_VALUES, type Capacity, levelForXp } from "@/lib/xp/config";
import type { FocusDuration } from "@/lib/focus";
import { actualMinutesFocused } from "@/lib/focus";
import { computeChainUpdate } from "@/lib/chain";
import { SMALL_WINS, smallWinItems } from "@/lib/small-wins";
import { starterRemaining, type Starter } from "@/lib/starter";

function updateStarter(id: string, change: (starter: Starter) => Starter): boolean {
  const state = getState();
  const mission = state.missions[getTodayDate()];
  const starter = state.starters?.[id];
  if (!starter || mission?.id !== id || mission.status !== "in_progress") return false;
  updateState((s) => ({ ...s, starters: { ...s.starters, [id]: change(starter) } }));
  return true;
}

export function saveStarterAction(id: string, action: string): boolean {
  const trimmed = action.trim().replace(/\s+/g, " ").slice(0, 160);
  const mission = getState().missions[getTodayDate()];
  if (!trimmed || mission?.id !== id || mission.status !== "in_progress") return false;
  updateState((s) => ({ ...s, starters: { ...s.starters, [id]: {
    ...s.starters?.[id], action: trimmed, savedAt: s.starters?.[id]?.savedAt || new Date().toISOString(),
  } } }));
  return true;
}

export function confirmStarterStarted(id: string): boolean {
  return updateStarter(id, (s) => ({ ...s, confirmedAt: s.confirmedAt || new Date().toISOString() }));
}

export function changeStarterTimer(id: string, command: "start" | "pause" | "resume" | "finish"): boolean {
  const now = Date.now();
  return updateStarter(id, (s) => {
    const remainingMs = starterRemaining(s, now);
    if (command === "start") {
      if (s.timer && s.timer.status !== "finished") return s;
      return { ...s, timer: { status: "running", remainingMs: 120000, runningSince: now } };
    }
    if (!s.timer || s.timer.status === "finished") return s;
    if (command === "resume" && s.timer.status === "paused" && remainingMs > 0)
      return { ...s, timer: { status: "running", remainingMs, runningSince: now } };
    if (command === "pause" && s.timer.status === "running")
      return { ...s, timer: { status: remainingMs > 0 ? "paused" : "finished", remainingMs } };
    if (command === "finish") return { ...s, timer: { status: "finished", remainingMs } };
    return s;
  });
}

export function saveStarterNote(id: string, note: string): boolean {
  return updateStarter(id, (s) => ({ ...s, nextNote: note.trim().slice(0, 240) }));
}

export function rateStarter(id: string, helpful: "yes" | "no"): boolean {
  return updateStarter(id, (s) => ({ ...s, helpful }));
}

export function resumePreviousMission(date: string): boolean {
  const today = getTodayDate();
  const state = getState();
  const previous = state.missions[date];
  const starter = previous && state.starters?.[previous.id];
  if (date >= today || state.missions[today] || previous?.status !== "in_progress" || !starter?.nextNote) return false;
  saveMainQuest(previous.title);
  const id = getState().missions[today].id;
  updateState((s) => ({ ...s, starters: { ...s.starters, [id]: {
    action: starter.nextNote!, nextNote: starter.nextNote, savedAt: new Date().toISOString(),
  } } }));
  return true;
}

// Small wins use the existing 10 XP routine reward, once per action per local day.
export function completeSmallWin(id: string): boolean {
  const today = getTodayDate();
  const wins = getState().smallWins;
  const exists = SMALL_WINS.some((win) => win.id === id) || wins.custom.some((win) => win.id === id);
  if (!exists || (wins.completions[today] || []).includes(id)) return false;
  updateState((state) => ({
    ...state,
    smallWins: {
      ...state.smallWins,
      restDate: undefined,
      completions: { ...state.smallWins.completions, [today]: [...(state.smallWins.completions[today] || []), id] },
    },
  }));
  awardXpOnce("routine_step", `small-win:${id}`, today);
  recordQualifyingDay(today);
  return true;
}

export function addSmallWin(title: string): boolean {
  const trimmed = title.trim().replace(/\s+/g, " ").slice(0, 80);
  if (!trimmed) return false;
  const wins = getState().smallWins;
  const all = smallWinItems(wins);
  if (all.some((win) => win.title.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) return false;
  const id = `custom:${trimmed.toLocaleLowerCase()}`;
  if (wins.custom.some((win) => win.id === id)) return false;
  updateState((state) => ({ ...state, smallWins: { ...state.smallWins, custom: [...state.smallWins.custom, { id, title: trimmed }] } }));
  return true;
}

export function removeSmallWin(id: string): void {
  updateState((state) => {
    const labels = { ...state.smallWins.labels };
    delete labels[id];
    return { ...state, smallWins: { ...state.smallWins, labels, custom: state.smallWins.custom.filter((win) => win.id !== id) } };
  });
}

// Rename the label only: its identity, completion history and XP stay unchanged.
export function editSmallWin(id: string, title: string): boolean {
  const trimmed = title.trim().replace(/\s+/g, " ").slice(0, 80);
  const items = smallWinItems(getState().smallWins);
  if (!trimmed || !items.some((win) => win.id === id) || items.some((win) => win.id !== id && win.title.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) return false;
  updateState((state) => ({ ...state, smallWins: { ...state.smallWins, labels: { ...state.smallWins.labels, [id]: trimmed } } }));
  return true;
}

export function restoreSmallWin(id: string): void {
  if (!SMALL_WINS.some((win) => win.id === id)) return;
  updateState((state) => {
    const labels = { ...state.smallWins.labels };
    delete labels[id];
    return { ...state, smallWins: { ...state.smallWins, labels } };
  });
}

export function restAfterSmallWins(rest: boolean): void {
  const today = getTodayDate();
  updateState((state) => ({ ...state, smallWins: { ...state.smallWins, restDate: rest ? today : undefined } }));
}

// Get today's date in user's timezone
export function getTodayDate(): string {
  const state = getState();
  const timezone = state.profile.timezone || "UTC";
  return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
}

// Profile actions
export function updateProfile(displayName: string, timezone: string): void {
  updateState((state) => ({
    ...state,
    profile: {
      ...state.profile,
      displayName,
      timezone,
    },
  }));
}

// Capacity actions
export function setCapacity(capacity: Capacity): void {
  const today = getTodayDate();
  updateState((state) => ({
    ...state,
    capacity: {
      ...state.capacity,
      [today]: capacity,
    },
  }));
}

export function getCapacity(date?: string): Capacity | null {
  const state = getState();
  const targetDate = date || getTodayDate();
  return state.capacity[targetDate] || null;
}

// Mission actions
export function saveMainQuest(title: string): void {
  const today = getTodayDate();
  const state = getState();
  const existingMission = state.missions[today];

  updateState((s) => ({
    ...s,
    missions: {
      ...s.missions,
      [today]: existingMission
        ? { ...existingMission, title }
        : {
            id: crypto.randomUUID(),
            title,
            status: "in_progress",
            xpValue: XP_VALUES.main_quest,
          },
    },
  }));
}

export function completeMainQuest(): void {
  const today = getTodayDate();
  const state = getState();
  const mission = state.missions[today];

  if (!mission || mission.status === "completed") {
    return;
  }

  // Mark as complete
  updateState((s) => ({
    ...s,
    missions: {
      ...s.missions,
      [today]: {
        ...mission,
        status: "completed",
        completedAt: new Date().toISOString(),
      },
    },
  }));

  // Award XP
  awardXpOnce("main_quest", mission.id, today);

  // Record qualifying day
  recordQualifyingDay(today);
}

export function getMainQuest(date?: string): typeof state.missions[string] | null {
  const state = getState();
  const targetDate = date || getTodayDate();
  return state.missions[targetDate] || null;
}

// Routine actions
export function toggleRoutineStep(stepId: string): void {
  const today = getTodayDate();
  const state = getState();
  const completedSteps = state.routines.completions[today] || [];
  const isCompleted = completedSteps.includes(stepId);

  if (isCompleted) {
    // Remove completion
    updateState((s) => ({
      ...s,
      routines: {
        ...s.routines,
        completions: {
          ...s.routines.completions,
          [today]: completedSteps.filter((id) => id !== stepId),
        },
      },
    }));
  } else {
    // Add completion
    updateState((s) => ({
      ...s,
      routines: {
        ...s.routines,
        completions: {
          ...s.routines.completions,
          [today]: [...completedSteps, stepId],
        },
      },
    }));

    // Award XP
    awardXpOnce("routine_step", stepId, today);

    // Check if all steps complete
    const allSteps = state.routines.steps;
    const newCompletedSteps = [...completedSteps, stepId];
    const allComplete = allSteps.every((step) => newCompletedSteps.includes(step.id));

    if (allComplete && allSteps.length > 0) {
      recordQualifyingDay(today);
    }
  }
}

// Focus session actions
export function startFocusSession(durationMinutes: FocusDuration): string {
  const today = getTodayDate();
  const state = getState();
  const mission = state.missions[today];

  const sessionId = crypto.randomUUID();
  const session = {
    id: sessionId,
    questId: mission?.id,
    durationMinutes,
    startedAt: new Date().toISOString(),
    totalPausedSeconds: 0,
    status: "in_progress" as const,
    date: today,
  };

  updateState((s) => ({
    ...s,
    focusSessions: [...s.focusSessions, session],
  }));

  return sessionId;
}

export function pauseFocusSession(sessionId: string): void {
  updateState((state) => ({
    ...state,
    focusSessions: state.focusSessions.map((session) =>
      session.id === sessionId && session.status === "in_progress"
        ? {
            ...session,
            status: "paused" as const,
            pausedAt: new Date().toISOString(),
          }
        : session
    ),
  }));
}

export function resumeFocusSession(sessionId: string): void {
  const state = getState();
  const session = state.focusSessions.find((s) => s.id === sessionId);

  if (!session || !session.pausedAt) {
    return;
  }

  const pausedSeconds = (Date.now() - new Date(session.pausedAt).getTime()) / 1000;

  updateState((s) => ({
    ...s,
    focusSessions: s.focusSessions.map((sess) =>
      sess.id === sessionId
        ? {
            ...sess,
            status: "in_progress" as const,
            pausedAt: undefined,
            totalPausedSeconds: sess.totalPausedSeconds + Math.max(0, pausedSeconds),
          }
        : sess
    ),
  }));
}

export function completeFocusSession(sessionId: string): void {
  const state = getState();
  const session = state.focusSessions.find((s) => s.id === sessionId);

  if (!session || session.status !== "in_progress") {
    return;
  }

  const now = new Date();
  const actualMinutes = actualMinutesFocused(
    {
      started_at: session.startedAt,
      paused_at: session.pausedAt ?? null,
      total_paused_seconds: session.totalPausedSeconds,
      status: session.status,
    },
    now
  );

  updateState((s) => ({
    ...s,
    focusSessions: s.focusSessions.map((sess) =>
      sess.id === sessionId
        ? {
            ...sess,
            status: "completed" as const,
            completedAt: now.toISOString(),
            actualMinutes,
          }
        : sess
    ),
  }));

  const today = getTodayDate();
  awardXpOnce("focus_session", sessionId, today);
  recordQualifyingDay(today);
}

export function stopFocusSession(sessionId: string): void {
  const state = getState();
  const session = state.focusSessions.find((s) => s.id === sessionId);

  if (!session) {
    return;
  }

  const now = new Date();
  const actualMinutes = actualMinutesFocused(
    {
      started_at: session.startedAt,
      paused_at: session.pausedAt ?? null,
      total_paused_seconds: session.totalPausedSeconds,
      status: session.status,
    },
    now
  );

  updateState((s) => ({
    ...s,
    focusSessions: s.focusSessions.map((sess) =>
      sess.id === sessionId
        ? {
            ...sess,
            status: "stopped" as const,
            completedAt: now.toISOString(),
            actualMinutes,
          }
        : sess
    ),
  }));
}

export function getActiveFocusSession(): typeof state.focusSessions[0] | null {
  const state = getState();
  return (
    state.focusSessions.find((s) => s.status === "in_progress" || s.status === "paused") || null
  );
}

// Logbook actions
export function saveLogbookEntry(
  winText: string,
  blockerText: string,
  tomorrowFirstMove: string,
  journalText: string
): void {
  const today = getTodayDate();

  updateState((state) => ({
    ...state,
    logbook: {
      ...state.logbook,
      [today]: {
        winText: winText || undefined,
        blockerText: blockerText || undefined,
        tomorrowFirstMove: tomorrowFirstMove || undefined,
        journalText: journalText || undefined,
      },
    },
  }));
}

// Daily review actions
export function saveDailyReview(
  movedForward: "yes" | "a_little" | "not_really",
  note: string
): void {
  const today = getTodayDate();

  updateState((state) => ({
    ...state,
    reviews: {
      ...state.reviews,
      [today]: {
        movedForward,
        note: note || undefined,
      },
    },
  }));

  awardXpOnce("daily_review", today, today);
  recordQualifyingDay(today);
}

// Soundtrack actions
export function saveSoundtrackSettings(soundtrack: {
  ignite: string;
  lockIn: string;
  grind: string;
  reset: string;
  victoryLap: string;
}): void {
  updateState((state) => ({
    ...state,
    soundtrack,
  }));
}

// XP and Progress
function awardXpOnce(
  eventType: "main_quest" | "side_quest" | "routine_step" | "focus_session" | "daily_review",
  sourceId: string,
  eventDate: string
): void {
  const state = getState();

  // Check if already awarded
  const alreadyAwarded = state.xpEvents.some(
    (event) =>
      event.eventType === eventType &&
      event.sourceId === sourceId &&
      event.eventDate === eventDate
  );

  if (alreadyAwarded) {
    return;
  }

  const xpAmount = XP_VALUES[eventType];

  // Add XP event
  const newEvent = {
    id: crypto.randomUUID(),
    eventType,
    xpAmount,
    sourceId,
    eventDate,
    createdAt: new Date().toISOString(),
  };

  // Calculate momentum
  const recentEvents = [...state.xpEvents, newEvent].filter((event) => {
    const eventTime = new Date(event.createdAt).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return eventTime >= sevenDaysAgo;
  });

  let momentumState: "rebuilding" | "moving" | "strong" | "flowing";
  if (recentEvents.length >= 14) {
    momentumState = "flowing";
  } else if (recentEvents.length >= 8) {
    momentumState = "strong";
  } else if (recentEvents.length >= 3) {
    momentumState = "moving";
  } else {
    momentumState = "rebuilding";
  }

  const newTotalXp = state.progress.totalXp + xpAmount;
  const newLevel = levelForXp(newTotalXp);

  updateState((s) => ({
    ...s,
    xpEvents: [...s.xpEvents, newEvent],
    progress: {
      ...s.progress,
      totalXp: newTotalXp,
      level: newLevel,
      momentumState,
      lastActiveDate: eventDate,
    },
  }));
}

function recordQualifyingDay(date: string): void {
  const state = getState();

  const chainUpdate = computeChainUpdate(
    {
      current_chain_length: state.progress.currentChainLength,
      longest_chain_length: state.progress.longestChainLength,
      chain_last_qualifying_date: state.progress.chainLastQualifyingDate || null,
      last_grace_used_date: state.progress.lastGraceUsedDate || null,
      comeback_count: state.progress.comebackCount,
    },
    date
  );

  updateState((s) => ({
    ...s,
    progress: {
      ...s.progress,
      currentChainLength: chainUpdate.current_chain_length,
      longestChainLength: chainUpdate.longest_chain_length,
      chainLastQualifyingDate: chainUpdate.chain_last_qualifying_date || undefined,
      lastGraceUsedDate: chainUpdate.last_grace_used_date || undefined,
      comebackCount: chainUpdate.comeback_count,
      isComeback: (chainUpdate as any).isComeback || false,
    },
  }));
}
