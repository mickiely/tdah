"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getState } from "@/lib/storage";
import { saveSoundtrackSettings } from "@/lib/storage/actions";

const SOUNDTRACK_MODES = [
  {
    name: "soundtrackIgnite",
    label: "IGNITE",
    emoji: "⚡",
    description: "Get moving when energy or initiation is low.",
  },
  {
    name: "soundtrackLockIn",
    label: "LOCK IN",
    emoji: "🎧",
    description: "Focused execution without distraction.",
  },
  {
    name: "soundtrackGrind",
    label: "GRIND",
    emoji: "💪",
    description: "Sustained longer work session.",
  },
  {
    name: "soundtrackReset",
    label: "RESET",
    emoji: "🔄",
    description: "Recover when distracted, stalled or overwhelmed.",
  },
  {
    name: "soundtrackVictoryLap",
    label: "VICTORY LAP",
    emoji: "🔥",
    description: "Reward completion of a meaningful output.",
  },
];

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const state = getState();
  const soundtrack = state.soundtrack;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    saveSoundtrackSettings({
      ignite: String(formData.get("soundtrackIgnite") || ""),
      lockIn: String(formData.get("soundtrackLockIn") || ""),
      grind: String(formData.get("soundtrackGrind") || ""),
      reset: String(formData.get("soundtrackReset") || ""),
      victoryLap: String(formData.get("soundtrackVictoryLap") || ""),
    });
    window.location.reload();
  };

  // Map form field names to soundtrack state keys
  const fieldToKey = {
    soundtrackIgnite: "ignite",
    soundtrackLockIn: "lockIn",
    soundtrackGrind: "grind",
    soundtrackReset: "reset",
    soundtrackVictoryLap: "victoryLap",
  } as const;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:gap-6 sm:pt-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Soundtrack Settings</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Music as state management for execution.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:border-[var(--accent)] active:scale-[0.98]"
        >
          Back
        </Link>
      </header>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm text-[var(--muted)]">
          Paste Spotify URLs (playlist, album, or track) for each mode. Leave blank to skip.
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Example: https://open.spotify.com/playlist/37i9dQZF1DX...
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {SOUNDTRACK_MODES.map((mode) => {
          const key = fieldToKey[mode.name as keyof typeof fieldToKey];
          const currentValue = soundtrack[key] || "";
          return (
            <div
              key={mode.name}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{mode.emoji}</span>
                <div>
                  <p className="text-sm font-semibold">{mode.label}</p>
                  <p className="text-xs text-[var(--muted)]">{mode.description}</p>
                </div>
              </div>
              <input
                type="url"
                name={mode.name}
                defaultValue={currentValue}
                placeholder="Spotify URL (optional)"
                className="mt-3 min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>
          );
        })}

        <button
          type="submit"
          className="min-h-[44px] rounded-lg bg-[var(--accent)] px-5 py-3 text-base font-semibold text-[var(--accent-foreground)] active:scale-[0.98]"
        >
          Save Soundtrack Settings
        </button>
      </form>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-xs font-semibold text-[var(--muted)]">HOW IT WORKS</p>
        <ul className="mt-2 space-y-1.5 text-sm text-[var(--muted)]">
          <li>• TDAH suggests soundtracks based on your daily capacity</li>
          <li>• Click &quot;Open Spotify&quot; to launch your chosen music</li>
          <li>• Music helps initiate work, maintain focus, and celebrate completion</li>
          <li>• No playback in-app — just quick links to get you moving</li>
        </ul>
      </div>
    </main>
  );
}
