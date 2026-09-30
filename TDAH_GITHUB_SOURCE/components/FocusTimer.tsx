"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  completeFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  stopFocusSession,
} from "@/lib/storage/actions";
import { XP_VALUES } from "@/lib/xp/config";
import {
  elapsedActiveSeconds,
  formatMinutesSeconds,
  remainingSeconds,
  type FocusStatus,
} from "@/lib/focus";

type Session = {
  id: string;
  duration_minutes: number;
  started_at: string;
  paused_at: string | null;
  total_paused_seconds: number;
  status: FocusStatus;
  actual_minutes: number | null;
};

export function FocusTimer({
  session,
  missionTitle,
}: {
  session: Session;
  missionTitle: string | null;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());
  const [, startTransition] = useTransition();
  const [announcement, setAnnouncement] = useState(
    session.status === "in_progress"
      ? `Focus Block started, ${session.duration_minutes} minutes.`
      : ""
  );
  const [actionPending, setActionPending] = useState(false);
  const completingRef = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (session.status !== "in_progress") return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [session.status]);

  useEffect(() => {
    if (session.status !== "in_progress") return;
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // unsupported, denied, or not allowed in this context — silent fallback
      }
    }
    requestWakeLock();

    return () => {
      wakeLock?.release().catch(() => {});
    };
  }, [session.status]);

  const remaining = remainingSeconds(session.duration_minutes, session, now);
  const elapsed = elapsedActiveSeconds(session, now);
  const percent = Math.min(100, Math.round((elapsed / (session.duration_minutes * 60)) * 100));

  useEffect(() => {
    if (session.status !== "in_progress" || remaining > 0 || completingRef.current) return;
    completingRef.current = true;
    setActionPending(true);
    completeFocusSession(session.id);
    setAnnouncement("Focus Block complete.");
    window.location.reload();
  }, [remaining, session.status, session.id]);

  function handlePause() {
    setActionPending(true);
    pauseFocusSession(session.id);
    setAnnouncement("Paused. Your place is saved.");
    window.location.reload();
  }

  function handleResume() {
    setActionPending(true);
    resumeFocusSession(session.id);
    setAnnouncement("Resumed.");
    window.location.reload();
  }

  function openExitDialog() {
    dialogRef.current?.showModal();
  }

  function keepGoing() {
    dialogRef.current?.close();
  }

  function handleEndSession() {
    dialogRef.current?.close();
    setActionPending(true);
    stopFocusSession(session.id);
    router.push("/");
  }

  if (session.status === "completed") {
    // Redirect to home immediately - the completion state will be shown there
    router.push("/");
    return null;
  }

  const isActive = session.status === "in_progress";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-1 flex-col items-center justify-center gap-16 px-5 py-10">
      {/* Mission Title */}
      {missionTitle && (
        <div className="neon-card rounded-2xl px-6 py-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-light)]">
            🎯 Mission
          </p>
          <p className="mt-2 text-lg font-bold">{missionTitle}</p>
        </div>
      )}

      {/* Timer - Dominant Visual Element */}
      <div className="flex flex-col items-center gap-8">
        <p aria-hidden="true" className="text-9xl font-black tabular-nums bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-mid-2)] bg-clip-text text-transparent">
          {formatMinutesSeconds(remaining)}
        </p>

        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Focus Block ${isActive ? "in progress" : "paused"}, ${formatMinutesSeconds(remaining)} remaining`}
          className="h-4 w-full max-w-xs overflow-hidden rounded-full bg-[var(--surface)]"
        >
          <div
            className="focus-bar-fill h-full rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>

        {!isActive && (
          <p className="feedback-pop text-lg font-bold text-[var(--accent)]">
            ⏸ Paused
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex w-full flex-col gap-4">
        {isActive ? (
          <button
            type="button"
            onClick={handlePause}
            disabled={actionPending}
            className="dark-panel-elevated min-h-[56px] w-full rounded-xl border-2 border-[var(--border-accent)] px-6 py-3 text-lg font-bold active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            ⏸ Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={handleResume}
            disabled={actionPending}
            className="gradient-button min-h-[56px] w-full rounded-xl px-6 py-3 text-lg font-bold text-white active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            ▶ Resume
          </button>
        )}

        <button
          type="button"
          onClick={openExitDialog}
          className="min-h-[44px] text-sm font-semibold text-[var(--muted)]"
        >
          Exit
        </button>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <dialog
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          keepGoing();
        }}
        className="dark-panel-elevated w-[calc(100%-2.5rem)] max-w-sm rounded-2xl border-2 border-[var(--border-accent)] p-6 text-[var(--foreground)] backdrop:bg-black/60"
      >
        <p className="text-lg font-bold">End this Focus Block?</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={keepGoing}
            className="gradient-button min-h-[52px] rounded-xl px-4 py-3 text-base font-bold text-white active:scale-[0.98]"
          >
            Keep going
          </button>
          <button
            type="button"
            onClick={handleEndSession}
            className="dark-panel min-h-[48px] rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold active:scale-[0.98]"
          >
            End session
          </button>
        </div>
      </dialog>
    </main>
  );
}
