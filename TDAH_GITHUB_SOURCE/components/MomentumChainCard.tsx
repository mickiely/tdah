export function MomentumChainCard({
  currentChain,
  longestChain,
  comebackCount,
}: {
  currentChain: number;
  longestChain: number;
  comebackCount: number;
}) {
  return (
    <section
      aria-labelledby="momentum-chain-heading"
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        Momentum Chain
      </p>

      {currentChain > 0 ? (
        <h2 id="momentum-chain-heading" className="mt-1 text-xl font-bold">
          {currentChain}-day Momentum Chain
        </h2>
      ) : (
        <div className="mt-1">
          <h2 id="momentum-chain-heading" className="text-base font-semibold text-[var(--muted)]">
            No active chain
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Complete your Mission, Landing, or full Launch Sequence to start one.
          </p>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
        <span>
          Best: {longestChain} day{longestChain === 1 ? "" : "s"}
        </span>
        <span>Comebacks: {comebackCount}</span>
      </div>

      <details className="mt-3">
        <summary className="inline-block min-h-11 cursor-pointer py-1 text-xs font-medium text-[var(--muted)] underline decoration-dotted">
          About Grace Days
        </summary>
        <p className="mt-2 text-xs text-[var(--muted)]">
          One missed day per week won&apos;t break your chain. Miss more than that, or come back
          after a longer break, and a fresh chain starts — that&apos;s still progress, not a loss.
        </p>
      </details>
    </section>
  );
}
