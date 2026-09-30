"use client";

import { useState } from "react";
import { saveMainQuest, completeMainQuest } from "@/lib/storage/actions";
import { XP_VALUES } from "@/lib/xp/config";
import type { SoundtrackUrls } from "@/lib/soundtrack";
import { CompletionBadge } from "./CompletionBadge";
import { SoundtrackLauncher } from "./SoundtrackLauncher";

type Quest = {
  id: string;
  title: string;
  status: string;
};

export function MainQuestCard({
  quest,
  soundtracks,
}: {
  quest: Quest | null;
  soundtracks: SoundtrackUrls;
}) {
  const [title, setTitle] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      saveMainQuest(title.trim());
      setTitle("");
      window.location.reload();
    }
  };

  const handleComplete = () => {
    completeMainQuest();
    window.location.reload();
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newTitle = String(formData.get("title") || "").trim();
    if (newTitle) {
      saveMainQuest(newTitle);
      window.location.reload();
    }
  };

  if (!quest) {
    return (
      <section
        aria-labelledby="mission-heading"
        className="rounded-2xl border-2 border-[var(--accent)] bg-[var(--accent)]/[0.04] p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="mission-heading" className="text-lg font-semibold">
            What&apos;s today&apos;s Mission?
          </h2>
          <span className="shrink-0 rounded-full bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
            +{XP_VALUES.main_quest} XP
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          The one thing that would make today count.
        </p>

        <form onSubmit={handleSave} className="mt-4 flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Send three job applications"
            className="min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
          />
          <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
            Why does this matter? (optional, just for you)
            <textarea
              rows={2}
              placeholder="Not saved — just a moment to think it through."
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            />
          </label>
          <button
            type="submit"
            className="min-h-[44px] rounded-lg bg-[var(--accent)] px-4 py-3 text-base font-semibold text-[var(--accent-foreground)] active:scale-[0.98]"
          >
            Set Today&apos;s Mission
          </button>
        </form>
      </section>
    );
  }

  const isComplete = quest.status === "completed";

  return (
    <section
      aria-labelledby="mission-heading"
      className={`rounded-2xl border-2 p-6 ${
        isComplete
          ? "border-[var(--success)] bg-[var(--success)]/[0.04]"
          : "border-[var(--accent)] bg-[var(--accent)]/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Today&apos;s Mission
          </p>
          <h2
            id="mission-heading"
            className={`mt-1 text-xl font-bold ${isComplete ? "line-through opacity-70" : ""}`}
          >
            {quest.title}
          </h2>
        </div>
        {!isComplete && (
          <span className="shrink-0 rounded-full bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
            +{XP_VALUES.main_quest} XP
          </span>
        )}
      </div>

      {!isComplete && (
        <details className="mt-2">
          <summary className="inline-block cursor-pointer py-1 text-xs font-medium text-[var(--muted)] underline decoration-dotted">
            Edit mission
          </summary>
          <form onSubmit={handleEdit} className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              name="title"
              required
              defaultValue={quest.title}
              className="min-h-[44px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="min-h-[44px] rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold active:scale-[0.98]"
            >
              Save
            </button>
          </form>
        </details>
      )}

      {isComplete ? (
        <>
          <p className="mt-4 inline-block rounded-full bg-[var(--success)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--success)]">
            Mission Complete
          </p>
          <CompletionBadge
            message="Done. That moved today forward."
            xpAmount={XP_VALUES.main_quest}
          />
          {soundtracks.victory_lap && (
            <div className="mt-4">
              <SoundtrackLauncher mode="VICTORY LAP" url={soundtracks.victory_lap} />
            </div>
          )}
        </>
      ) : (
        <div className="mt-4">
          <button
            onClick={handleComplete}
            className="min-h-[44px] w-full rounded-lg bg-[var(--accent)] px-5 py-3 text-base font-semibold text-[var(--accent-foreground)] active:scale-[0.98] sm:w-auto"
          >
            Complete Mission (+{XP_VALUES.main_quest} XP)
          </button>
        </div>
      )}
    </section>
  );
}
