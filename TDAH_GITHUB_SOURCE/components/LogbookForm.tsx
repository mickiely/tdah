"use client";

import { saveLogbookEntry } from "@/lib/storage/actions";
import { getState } from "@/lib/storage";

type LogbookEntry = {
  winText?: string;
  blockerText?: string;
  tomorrowFirstMove?: string;
  journalText?: string;
} | null;

export function LogbookForm({ entry }: { entry: LogbookEntry }) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    saveLogbookEntry(
      String(formData.get("winText") || ""),
      String(formData.get("blockerText") || ""),
      String(formData.get("tomorrowFirstMove") || ""),
      String(formData.get("journalText") || "")
    );
    window.location.reload();
  };

  return (
    <section
      aria-labelledby="logbook-heading"
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        Logbook
      </p>
      <h2 id="logbook-heading" className="mt-1 text-base font-semibold">
        Today&apos;s log
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Private by default. Everything here is optional.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Win of the day
          <textarea
            name="winText"
            rows={3}
            defaultValue={entry?.winText || ""}
            placeholder="What went well?"
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          What got in the way?
          <textarea
            name="blockerText"
            rows={2}
            defaultValue={entry?.blockerText || ""}
            placeholder="Blockers, challenges, or distractions"
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Tomorrow&apos;s first move
          <input
            type="text"
            name="tomorrowFirstMove"
            defaultValue={entry?.tomorrowFirstMove || ""}
            placeholder="What's the first thing you'll do?"
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Free journal note
          <textarea
            name="journalText"
            rows={3}
            defaultValue={entry?.journalText || ""}
            placeholder="Anything else on your mind..."
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>

        <button
          type="submit"
          className="min-h-[44px] rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold active:scale-[0.98]"
        >
          Save log
        </button>
      </form>
    </section>
  );
}
