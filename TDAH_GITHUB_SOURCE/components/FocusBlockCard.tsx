"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startFocusSession } from "@/lib/storage/actions";
import { CAPACITY_LIMITS, type Capacity } from "@/lib/xp/config";
import type { FocusDuration } from "@/lib/focus";
import { getSuggestedSoundtrack, getSoundtrackUrl, type SoundtrackUrls } from "@/lib/soundtrack";
import { SoundtrackLauncher } from "./SoundtrackLauncher";

const DURATIONS: FocusDuration[] = [10, 25, 45];

export function FocusBlockCard({
  capacity,
  hasActiveSession,
  soundtracks,
}: {
  capacity: Capacity;
  hasActiveSession: boolean;
  soundtracks: SoundtrackUrls;
}) {
  const router = useRouter();

  if (hasActiveSession) {
    return (
      <section
        aria-labelledby="focus-block-heading"
        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        <h2 id="focus-block-heading" className="text-sm font-semibold text-[var(--muted)]">
          Focus Block
        </h2>
        <Link
          href="/focus"
          className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-foreground)] active:scale-[0.98]"
        >
          Resume Focus Block
        </Link>
      </section>
    );
  }

  const suggested = CAPACITY_LIMITS[capacity].focusMinutes as FocusDuration;
  const suggestedMode = getSuggestedSoundtrack(capacity);
  const suggestedUrl = getSoundtrackUrl(soundtracks, suggestedMode);

  const handleStart = (duration: FocusDuration) => {
    startFocusSession(duration);
    router.push("/focus");
  };

  return (
    <section
      aria-labelledby="focus-block-heading"
      className="rounded-2xl border border-dashed border-[var(--border)] p-4"
    >
      <h2 id="focus-block-heading" className="text-sm font-semibold text-[var(--muted)]">
        Focus Block
      </h2>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Uninterrupted time to move Today&apos;s Mission forward.
      </p>

      {suggestedUrl && (
        <div className="mt-3">
          <SoundtrackLauncher mode={suggestedMode} url={suggestedUrl} />
        </div>
      )}

      <div className="mt-3 flex flex-col gap-3">
        <div className="flex gap-2">
          {DURATIONS.map((minutes) => (
            <button
              key={minutes}
              onClick={() => handleStart(minutes)}
              className={`min-h-11 flex-1 rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition ${
                minutes === suggested
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "border-[var(--border)]"
              }`}
            >
              {minutes} min
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
