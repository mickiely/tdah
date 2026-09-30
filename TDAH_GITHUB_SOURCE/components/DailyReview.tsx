"use client";

import { saveDailyReview } from "@/lib/storage/actions";
import { XP_VALUES } from "@/lib/xp/config";
import { CompletionBadge } from "./CompletionBadge";

type Review = { movedForward: string; note?: string } | null;

const OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "a_little", label: "A little" },
  { value: "not_really", label: "Not really" },
];

export function DailyReview({ review }: { review: Review }) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const movedForward = formData.get("movedForward") as "yes" | "a_little" | "not_really";
    const note = String(formData.get("note") || "");
    saveDailyReview(movedForward, note);
    window.location.reload();
  };

  return (
    <section
      aria-labelledby="daily-review-heading"
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        Landing
      </p>
      <h2 id="daily-review-heading" className="mt-1 text-base font-semibold">
        Did today move your life forward?
      </h2>

      {review && (
        <CompletionBadge
          message="Day logged. Tomorrow has a starting point."
          xpAmount={XP_VALUES.daily_review}
        />
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="min-h-11 cursor-pointer rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium transition has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)] has-[:checked]:text-[var(--accent-foreground)]"
            >
              <input
                type="radio"
                name="movedForward"
                value={opt.value}
                defaultChecked={review?.movedForward === opt.value}
                required
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-[var(--muted)]">
          What helped or got in the way? (optional)
          <textarea
            name="note"
            rows={2}
            defaultValue={review?.note ?? ""}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          />
        </label>

        <button
          type="submit"
          className="min-h-11 self-start rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-foreground)] active:scale-[0.98]"
        >
          {review ? "Update Landing" : "Save Landing"}
        </button>
      </form>
    </section>
  );
}
