"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function dismissKey(level: number): string {
  return `tdah:levelup-dismissed:${level}`;
}

function isDismissed(level: number): boolean {
  try {
    return localStorage.getItem(dismissKey(level)) === "1";
  } catch {
    return false;
  }
}

export function LevelUpBanner({
  level,
  didLevelUpToday,
}: {
  level: number;
  didLevelUpToday: boolean;
}) {
  // Server/first-paint snapshot is always "dismissed" so SSR renders nothing;
  // useSyncExternalStore re-syncs to the real client value right after mount.
  const dismissed = useSyncExternalStore(
    subscribe,
    () => isDismissed(level),
    () => true
  );

  if (!didLevelUpToday || dismissed) return null;

  function dismiss() {
    try {
      localStorage.setItem(dismissKey(level), "1");
    } catch {
      // best-effort persistence only
    }
    notify();
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className="feedback-pop flex items-center justify-between gap-3 rounded-xl border border-[var(--accent)] bg-[var(--accent)]/[0.06] px-4 py-3 text-sm font-medium text-[var(--foreground)]"
    >
      <span>Level up. You kept moving.</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss level up message"
        className="min-h-11 min-w-11 shrink-0 rounded-lg text-lg font-semibold text-[var(--muted)]"
      >
        ×
      </button>
    </p>
  );
}
