export function LevelProgressBar({
  level,
  xpIntoLevel,
  xpForNextLevel,
  momentum,
}: {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  momentum?: string;
}) {
  const percent =
    xpForNextLevel === null ? 100 : Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100));

  const momentumCopy: Record<string, string> = {
    rebuilding: "Building momentum",
    moving: "You're moving",
    strong: "Momentum is strong",
    flowing: "You're in flow",
  };

  return (
    <div className="dark-panel-elevated rounded-2xl border border-[var(--border-accent)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-mid-2)] text-xl font-black text-white shadow-lg">
            ★
          </div>
          <div>
            <p className="text-lg font-bold">Level {level}</p>
            {momentum && (
              <p className="text-xs text-[var(--muted)]">{momentumCopy[momentum] || momentum}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[var(--accent-light)]">
            {xpForNextLevel === null ? "Max level" : `${xpIntoLevel} / ${xpForNextLevel}`}
          </p>
          <p className="text-xs text-[var(--muted)]">XP</p>
        </div>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Level ${level} progress`}
        className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[var(--surface)]"
      >
        <div
          className="level-bar-fill h-full rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
