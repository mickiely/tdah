"use client";

import { type Capacity } from "@/lib/xp/config";
import { setCapacity as setCapacityAction } from "@/lib/storage/actions";

const OPTIONS: { value: Capacity; label: string; hint: string }[] = [
  { value: "flat", label: "Flat", hint: "Keep today light. One useful thing is enough." },
  { value: "steady", label: "Steady", hint: "You've got a solid day in you." },
  { value: "fired_up", label: "Fired Up", hint: "Use the energy. Don't scatter it." },
];

export function CapacityPicker() {
  const handleCapacitySelect = (capacity: Capacity) => {
    setCapacityAction(capacity);
    window.location.reload();
  };

  return (
    <section
      aria-labelledby="capacity-heading"
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
    >
      <h2 id="capacity-heading" className="text-lg font-semibold">
        How much capacity do you have today?
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        This helps us suggest what fits — there&apos;s no wrong answer.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleCapacitySelect(option.value)}
            className="min-h-[44px] w-full rounded-xl border border-[var(--border)] px-5 py-4 text-left hover:border-[var(--accent)] active:scale-[0.99]"
          >
            <span className="block text-base font-semibold">{option.label}</span>
            <span className="mt-0.5 block text-sm text-[var(--muted)]">
              {option.hint}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
