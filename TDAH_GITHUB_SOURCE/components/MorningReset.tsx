"use client";

import { toggleRoutineStep } from "@/lib/storage/actions";
import { XP_VALUES } from "@/lib/xp/config";
import { CompletionBadge } from "./CompletionBadge";

type Step = { id: string; title: string };

// Display-only relabeling of the default step titles — the underlying
// routine_steps.title values are unchanged so custom/renamed steps still work.
const STEP_LABEL_OVERRIDES: Record<string, string> = {
  "Drink water": "Water",
  "Take medication or supplements": "Medication or supplements",
};

function displayLabel(title: string): string {
  return STEP_LABEL_OVERRIDES[title] ?? title;
}

export function MorningReset({
  steps,
  completedStepIds,
}: {
  steps: Step[];
  completedStepIds: Set<string>;
}) {
  const completedCount = steps.filter((s) => completedStepIds.has(s.id)).length;
  const allComplete = steps.length > 0 && completedCount === steps.length;

  return (
    <section
      aria-labelledby="launch-sequence-heading"
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="launch-sequence-heading" className="text-base font-semibold">
          Launch Sequence
        </h2>
        <span role="status" aria-live="polite" className="text-sm text-[var(--muted)]">
          {completedCount} of {steps.length} complete
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {steps.map((step) => {
          const done = completedStepIds.has(step.id);
          return (
            <li key={step.id}>
              <button
                onClick={() => {
                  toggleRoutineStep(step.id);
                  window.location.reload();
                }}
                aria-pressed={done}
                className={`flex w-full min-h-[44px] items-center gap-3 rounded-xl border px-4 py-3 text-left active:scale-[0.99] ${
                  done ? "border-[var(--success)] bg-[var(--success)]/5" : "border-[var(--border)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    done
                      ? "border-[var(--success)] bg-[var(--success)] text-white"
                      : "border-[var(--border)]"
                  }`}
                >
                  {done ? "✓" : ""}
                </span>
                <span className={`flex-1 text-sm ${done ? "text-[var(--muted)] line-through" : ""}`}>
                  {displayLabel(step.title)}
                </span>
                {done && (
                  <span className="feedback-pop text-xs font-semibold text-[var(--success)]">
                    +{XP_VALUES.routine_step} XP · That counts
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {allComplete && (
        <CompletionBadge variant="banner" message="Launch Sequence complete. You’re moving." />
      )}
    </section>
  );
}
