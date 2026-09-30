export const XP_VALUES = {
  main_quest: 100,
  side_quest: 30,
  routine_step: 10,
  focus_session: 40,
  daily_review: 20,
} as const;

export type XpEventType = keyof typeof XP_VALUES;

// Total XP required to REACH each level. Level 1 starts at 0.
export const LEVEL_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250,
];

export function levelForXp(totalXp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    }
  }
  return level;
}

export function xpIntoCurrentLevel(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
} {
  const level = levelForXp(totalXp);
  const floor = LEVEL_THRESHOLDS[level - 1];
  const ceiling = LEVEL_THRESHOLDS[level] ?? null;

  return {
    level,
    xpIntoLevel: totalXp - floor,
    xpForNextLevel: ceiling === null ? null : ceiling - floor,
  };
}

export const CAPACITY_LIMITS = {
  flat: { maxSideQuests: 1, focusMinutes: 10 },
  steady: { maxSideQuests: 3, focusMinutes: 25 },
  fired_up: { maxSideQuests: 5, focusMinutes: 45 },
} as const;

export type Capacity = keyof typeof CAPACITY_LIMITS;
