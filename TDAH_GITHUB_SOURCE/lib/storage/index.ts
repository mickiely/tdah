/**
 * TDAH Local-First Storage
 *
 * Central localStorage-based state management
 * No Supabase dependencies
 */

import { Capacity } from "@/lib/xp/config";
import { FocusDuration } from "@/lib/focus";
import type { Starter } from "@/lib/starter";

// Core state structure
export interface TDAHState {
  starters?: Record<string, Starter>;
  profile: {
    displayName: string;
    timezone: string;
    createdAt: string;
  };
  capacity: {
    [date: string]: Capacity;
  };
  smallWins: {
    custom: Array<{ id: string; title: string }>;
    labels?: Record<string, string>;
    completions: { [date: string]: string[] };
    restDate?: string;
  };
  missions: {
    [date: string]: {
      id: string;
      title: string;
      status: "in_progress" | "completed" | "replaced";
      xpValue: number;
      completedAt?: string;
    };
  };
  focusSessions: Array<{
    id: string;
    questId?: string;
    durationMinutes: FocusDuration;
    startedAt: string;
    pausedAt?: string;
    totalPausedSeconds: number;
    status: "in_progress" | "paused" | "completed" | "stopped";
    actualMinutes?: number;
    completedAt?: string;
    date: string;
  }>;
  soundtrack: {
    ignite: string;
    lockIn: string;
    grind: string;
    reset: string;
    victoryLap: string;
  };
  routines: {
    steps: Array<{
      id: string;
      title: string;
      orderIndex: number;
    }>;
    completions: {
      [date: string]: string[]; // step IDs completed on this date
    };
  };
  reviews: {
    [date: string]: {
      movedForward: "yes" | "a_little" | "not_really";
      note?: string;
    };
  };
  logbook: {
    [date: string]: {
      winText?: string;
      blockerText?: string;
      tomorrowFirstMove?: string;
      journalText?: string;
    };
  };
  progress: {
    totalXp: number;
    level: number;
    momentumState: "rebuilding" | "moving" | "strong" | "flowing";
    isComeback: boolean;
    lastActiveDate: string;
    currentChainLength: number;
    longestChainLength: number;
    chainLastQualifyingDate?: string;
    lastGraceUsedDate?: string;
    comebackCount: number;
  };
  xpEvents: Array<{
    id: string;
    eventType: "main_quest" | "side_quest" | "routine_step" | "focus_session" | "daily_review";
    xpAmount: number;
    sourceId: string;
    eventDate: string;
    createdAt: string;
  }>;
}

const STORAGE_KEY = "tdah_state";
const STORAGE_VERSION = 1;

// Default state
function getDefaultState(): TDAHState {
  const now = new Date().toISOString();
  return {
    profile: {
      displayName: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      createdAt: now,
    },
    capacity: {},
    smallWins: { custom: [], completions: {} },
    missions: {},
    focusSessions: [],
    soundtrack: {
      ignite: "",
      lockIn: "",
      grind: "",
      reset: "",
      victoryLap: "",
    },
    routines: {
      steps: [],
      completions: {},
    },
    reviews: {},
    logbook: {},
    progress: {
      totalXp: 0,
      level: 1,
      momentumState: "rebuilding",
      isComeback: false,
      lastActiveDate: "",
      currentChainLength: 0,
      longestChainLength: 0,
      comebackCount: 0,
    },
    xpEvents: [],
  };
}

// Load state from localStorage
export function loadState(): TDAHState {
  if (typeof window === "undefined") {
    return getDefaultState();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultState();
    }

    const parsed = JSON.parse(stored);

    // Version check and migration if needed
    if (parsed.version !== STORAGE_VERSION) {
      console.warn("Storage version mismatch, using defaults");
      return getDefaultState();
    }

    // Merge with defaults to handle missing fields
    return {
      ...getDefaultState(),
      ...parsed.data,
    };
  } catch (error) {
    console.error("Failed to load state:", error);
    return getDefaultState();
  }
}

// Save state to localStorage
export function saveState(state: TDAHState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload = {
      version: STORAGE_VERSION,
      data: state,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to save state:", error);
  }
}

// Get current state
let cachedState: TDAHState | null = null;

export function getState(): TDAHState {
  if (!cachedState) {
    cachedState = loadState();
  }
  return cachedState;
}

// Update state
export function updateState(updater: (state: TDAHState) => TDAHState): TDAHState {
  const currentState = getState();
  const newState = updater(currentState);
  cachedState = newState;
  saveState(newState);
  return newState;
}

// Reset state (for testing or fresh start)
export function resetState(): TDAHState {
  const newState = getDefaultState();
  cachedState = newState;
  saveState(newState);
  return newState;
}

// Export data for backup
export function exportData(): string {
  const state = getState();
  return JSON.stringify({
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    data: state,
  }, null, 2);
}

// Import data from backup
export function importData(jsonString: string): void {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.data) {
      const newState = {
        ...getDefaultState(),
        ...parsed.data,
      };
      cachedState = newState;
      saveState(newState);
    }
  } catch (error) {
    console.error("Failed to import data:", error);
    throw new Error("Invalid backup data");
  }
}
