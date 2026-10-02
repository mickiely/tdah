"use client";

import { useEffect, useState } from "react";
import type { Starter } from "@/lib/starter";
import { starterRemaining } from "@/lib/starter";
import { formatMinutesSeconds } from "@/lib/focus";
import { changeStarterTimer, confirmStarterStarted, rateStarter, saveStarterAction, saveStarterNote } from "@/lib/storage/actions";

const button = "min-h-[48px] rounded-xl border border-[var(--border-accent)] px-4 py-2 text-sm font-semibold";
const input = "min-h-[48px] w-full rounded-xl border border-[var(--border-accent)] bg-[var(--surface)] px-3 py-2 text-sm";

export function StarterStep({ missionId, starter, onChange }: { missionId: string; starter?: Starter; onChange: () => void }) {
  const [action, setAction] = useState(starter?.action || "");
  const [note, setNote] = useState(starter?.nextNote || "");
  const [editing, setEditing] = useState(!starter);
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (starter?.timer?.status !== "running") return;
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 250);
    window.addEventListener("focus", tick);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", tick); };
  }, [starter?.timer?.status]);
  const remaining = starter ? starterRemaining(starter, now) : 120000;
  const timedOut = starter?.timer?.status === "running" && remaining <= 0;
  const running = starter?.timer?.status === "running" && !timedOut;
  const paused = starter?.timer?.status === "paused";

  function timer(command: "start" | "pause" | "resume" | "finish") {
    if (changeStarterTimer(missionId, command)) { setNow(Date.now()); onChange(); }
  }

  return (
    <section aria-labelledby="starter-heading" className="rounded-2xl border border-[var(--border-accent)] bg-[var(--surface-elevated)] p-5">
      <h3 id="starter-heading" className="text-xl font-bold">Make this smaller</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">You don&apos;t have to finish it all. Pick one action you could try in two minutes.</p>
      {editing ? (
        <form className="mt-4 flex flex-col gap-2" onSubmit={(e) => {
          e.preventDefault();
          if (saveStarterAction(missionId, action)) { setEditing(false); setMessage("First step saved. Start when you’re ready."); onChange(); }
        }}>
          <label htmlFor="starter-action" className="text-sm font-semibold">My first tiny action</label>
          <input autoFocus={Boolean(starter)} id="starter-action" value={action} onChange={(e) => setAction(e.target.value)} maxLength={160} placeholder="e.g. Open the application and write my name" className={input} />
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={!action.trim()} className={`${button} disabled:opacity-40`}>Save first step</button>
            {starter && <button type="button" onClick={() => { setAction(starter.action); setEditing(false); }} className={button}>Cancel</button>}
          </div>
          <p className="text-xs text-[var(--muted)]">Optional. You can go straight to your mission below.</p>
        </form>
      ) : starter && (
        <>
          <p className="mt-4 break-words font-semibold">{starter.action}</p>
          <button type="button" onClick={() => setEditing(true)} className="min-h-[44px] text-sm underline">Edit first step</button>
          {starter.nextNote && <p className="mt-2 break-words rounded-xl bg-[var(--surface)] p-3 text-sm"><strong>Start here next time:</strong> {starter.nextNote}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {!starter.confirmedAt ? <button type="button" className={button} onClick={() => { if (confirmStarterStarted(missionId)) { setMessage("You’ve started. That’s a useful step."); onChange(); } }}>I&apos;ve started</button> : <span className="py-3 text-sm text-[var(--success)]">✓ You marked this started</span>}
            {(!starter.timer || starter.timer.status === "finished") && <button type="button" className={button} onClick={() => timer("start")}>Try two minutes</button>}
          </div>
          {(running || paused || timedOut) && (
            <div className="mt-4 rounded-xl border border-[var(--border-accent)] p-4">
              <p className="text-3xl font-bold tabular-nums" role="timer" aria-label={`${formatMinutesSeconds(remaining / 1000)} remaining`}>{formatMinutesSeconds(remaining / 1000)}</p>
              <p role="status" className="mt-2 text-sm">{timedOut ? "Two minutes are up. Continue or finish here — your choice." : paused ? "Paused. Come back when you’re ready." : "Try your tiny action. You can stop whenever you need."}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {running && <button type="button" className={button} onClick={() => timer("pause")}>Pause</button>}
                {paused && <button type="button" className={button} onClick={() => timer("resume")}>Resume</button>}
                {timedOut && <button type="button" className={button} onClick={() => { timer("finish"); setMessage("Keep going at your pace. Focus options are below if you want them."); }}>Keep going</button>}
                <button type="button" className={button} onClick={() => { timer("finish"); setMessage("Enough for now. Your mission stays available."); }}>Finish here</button>
              </div>
            </div>
          )}
          <details className="mt-4">
            <summary className="min-h-[44px] cursor-pointer py-2 text-sm font-semibold">Leave a note for next time</summary>
            <form className="mt-2 flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); if (saveStarterNote(missionId, note)) { setMessage("Your next step is saved."); onChange(); } }}>
              <label htmlFor="starter-note" className="text-sm">Next time, start here…</label>
              <textarea id="starter-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={240} rows={2} placeholder="e.g. Finish the second paragraph" className={input} />
              <button type="submit" className={button}>Save note</button>
            </form>
          </details>
          {(starter.confirmedAt || starter.timer?.status === "finished" || timedOut) && <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span>Did this help you start?</span>
            {(["yes", "no"] as const).map((answer) => <button key={answer} type="button" aria-pressed={starter.helpful === answer} className={`${button} ${starter.helpful === answer ? "border-[var(--success)]" : ""}`} onClick={() => { rateStarter(missionId, answer); setMessage("Thanks. Your answer is saved on this device."); onChange(); }}>{answer === "yes" ? "Yes" : "Not this time"}</button>)}
          </div>}
        </>
      )}
      <p role="status" className="mt-2 text-sm text-[var(--success)]">{message}</p>
    </section>
  );
}
