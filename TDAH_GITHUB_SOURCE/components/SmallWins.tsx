"use client";

import { useRef, useState } from "react";
import type { TDAHState } from "@/lib/storage";
import { SMALL_WINS } from "@/lib/small-wins";
import { addSmallWin, completeSmallWin, removeSmallWin, restAfterSmallWins } from "@/lib/storage/actions";
import { XP_VALUES } from "@/lib/xp/config";

export function SmallWins({ wins, today, onChange }: {
  wins: TDAHState["smallWins"];
  today: string;
  onChange: () => void;
}) {
  const [customTitle, setCustomTitle] = useState("");
  const [message, setMessage] = useState("");
  const firstButton = useRef<HTMLButtonElement>(null);
  const completed = new Set(wins.completions[today] || []);
  const resting = wins.restDate === today;
  const items = [...SMALL_WINS, ...wins.custom.map((win) => ({ ...win, icon: "✨" }))];

  function nextMission() {
    restAfterSmallWins(false);
    onChange();
    const target = document.getElementById("mission-start");
    target?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    target?.focus({ preventScroll: true });
  }

  return (
    <section aria-labelledby="small-wins-heading" className="neon-card-strong rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="small-wins-heading" className="text-2xl font-bold">Small Wins</h2>
        <span className="text-sm font-semibold text-[var(--success)]">{completed.size} today</span>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">Start wherever you are. One small thing counts.</p>
      {resting ? (
        <div className="mt-4">
          <p role="status" className="font-semibold">Enough for now. Your wins are saved.</p>
          <button type="button" onClick={() => { restAfterSmallWins(false); setMessage(""); onChange(); }} className="mt-3 min-h-[48px] rounded-xl border border-[var(--border-accent)] px-4 font-semibold">Come back when you&apos;re ready</button>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {items.map((win, index) => {
              const done = completed.has(win.id);
              return (
                <button key={win.id} ref={index === 0 ? firstButton : undefined} type="button" disabled={done}
                  onClick={() => {
                    if (completeSmallWin(win.id)) {
                      setMessage(`That counts. +${XP_VALUES.routine_step} XP. What feels possible next?`);
                      onChange();
                    }
                  }}
                  className={`min-h-[88px] rounded-xl border-2 p-3 text-left transition active:scale-[0.98] ${done ? "border-[var(--success)] bg-[var(--success)]/10" : "border-[var(--border-accent)] bg-[var(--surface-elevated)]"}`}>
                  <span aria-hidden="true" className="text-2xl">{done ? "✓" : win.icon}</span>
                  <span className="mt-1 block break-words text-sm font-bold">{win.title}</span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">{done ? "Banked today" : `+${XP_VALUES.routine_step} XP`}</span>
                </button>
              );
            })}
          </div>
          <details className="mt-4">
            <summary className="min-h-[44px] cursor-pointer py-2 text-sm font-semibold">Make it yours</summary>
            <form className="mt-2 flex gap-2" onSubmit={(event) => {
              event.preventDefault();
              if (addSmallWin(customTitle)) { setCustomTitle(""); setMessage("Your small win is ready. Tap it when you’ve done it."); onChange(); }
              else setMessage("Give your win a name you haven’t already added.");
            }}>
              <label htmlFor="custom-small-win" className="sr-only">Your small win</label>
              <input id="custom-small-win" value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} maxLength={80} placeholder="e.g. Washed one plate" className="min-h-[48px] min-w-0 flex-1 rounded-xl border border-[var(--border-accent)] bg-[var(--surface)] px-3 text-sm" />
              <button type="submit" disabled={!customTitle.trim()} className="gradient-button min-h-[48px] rounded-xl px-4 font-bold text-white disabled:opacity-40">Add</button>
            </form>
            {wins.custom.map((win) => (
              <div key={win.id} className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="break-words">{win.title}</span>
                <button type="button" aria-label={`Remove ${win.title}`} onClick={() => { removeSmallWin(win.id); setMessage("Button removed. Earned XP stays yours."); onChange(); }} className="min-h-[44px] px-3 text-[var(--muted)]">Remove</button>
              </div>
            ))}
          </details>
          <p role="status" aria-live="polite" className="mt-3 min-h-[24px] text-sm font-semibold text-[var(--success)]">{message}</p>
          {completed.size > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              <button type="button" onClick={() => { setMessage("One thing at a time. Pick whatever feels possible."); firstButton.current?.focus(); }} className="min-h-[48px] rounded-xl border border-[var(--border-accent)] px-4 font-semibold">Another small win</button>
              <button type="button" onClick={nextMission} className="gradient-button min-h-[48px] rounded-xl px-4 font-bold text-white">Ready for my mission</button>
              <button type="button" onClick={() => { restAfterSmallWins(true); setMessage(""); onChange(); }} className="min-h-[48px] rounded-xl px-4 text-sm text-[var(--muted)]">Enough for now</button>
            </div>
          )}
        </>
      )}
      <button type="button" onClick={nextMission} className="mt-3 min-h-[44px] text-sm font-semibold underline underline-offset-4">{resting ? "Go to my mission" : "Go straight to my mission"}</button>
      <p className="mt-1 text-xs text-[var(--muted)]">No checklist to finish. No penalty for stopping.</p>
    </section>
  );
}
