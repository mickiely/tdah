import type { Capacity } from "./xp/config";

export type SoundtrackMode = "IGNITE" | "LOCK IN" | "GRIND" | "RESET" | "VICTORY LAP";

export type SoundtrackUrls = {
  ignite: string | null;
  lock_in: string | null;
  grind: string | null;
  reset: string | null;
  victory_lap: string | null;
};

// Map capacity to suggested soundtrack modes
export const CAPACITY_SOUNDTRACK_MAP: Record<Capacity, SoundtrackMode[]> = {
  flat: ["IGNITE", "RESET"],
  steady: ["LOCK IN"],
  fired_up: ["LOCK IN", "GRIND"],
};

// Get suggested soundtrack mode based on capacity
export function getSuggestedSoundtrack(capacity: Capacity): SoundtrackMode {
  const suggestions = CAPACITY_SOUNDTRACK_MAP[capacity];
  return suggestions[0]; // Return first suggestion
}

// Get soundtrack URL by mode
export function getSoundtrackUrl(
  soundtracks: SoundtrackUrls,
  mode: SoundtrackMode
): string | null {
  const modeMap: Record<SoundtrackMode, keyof SoundtrackUrls> = {
    IGNITE: "ignite",
    "LOCK IN": "lock_in",
    GRIND: "grind",
    RESET: "reset",
    "VICTORY LAP": "victory_lap",
  };
  return soundtracks[modeMap[mode]];
}

// Get suggestion copy for capacity
export function getSoundtrackSuggestion(capacity: Capacity): string {
  const suggestions = CAPACITY_SOUNDTRACK_MAP[capacity];
  if (suggestions.length === 1) {
    return `Try ${suggestions[0]} to get started.`;
  }
  return `Try ${suggestions.join(" or ")} to get started.`;
}
