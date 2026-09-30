type SoundtrackMode = "IGNITE" | "LOCK IN" | "GRIND" | "RESET" | "VICTORY LAP";

const MODE_CONFIG: Record<SoundtrackMode, { emoji: string; label: string }> = {
  IGNITE: { emoji: "⚡", label: "IGNITE" },
  "LOCK IN": { emoji: "🎧", label: "LOCK IN" },
  GRIND: { emoji: "💪", label: "GRIND" },
  RESET: { emoji: "🔄", label: "RESET" },
  "VICTORY LAP": { emoji: "🔥", label: "VICTORY LAP" },
};

export function SoundtrackLauncher({
  mode,
  url,
  disabled = false,
}: {
  mode: SoundtrackMode;
  url: string | null;
  disabled?: boolean;
}) {
  if (!url) return null;

  const config = MODE_CONFIG[mode];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.emoji}</span>
          <span className="text-sm font-semibold text-[var(--muted)]">{config.label}</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition ${
            disabled
              ? "cursor-not-allowed opacity-50"
              : "hover:border-[var(--accent)] active:scale-[0.98]"
          }`}
          onClick={(e) => {
            if (disabled) e.preventDefault();
          }}
        >
          Open Spotify
        </a>
      </div>
    </div>
  );
}
