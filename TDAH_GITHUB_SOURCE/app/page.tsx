"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { xpIntoCurrentLevel, levelForXp, type Capacity } from "@/lib/xp/config";
import { getState } from "@/lib/storage";
import { getTodayDate, startFocusSession, saveMainQuest } from "@/lib/storage/actions";
import { CapacityPicker } from "@/components/CapacityPicker";
import { MainQuestCard } from "@/components/MainQuestCard";
import { MorningReset } from "@/components/MorningReset";
import { DailyReview } from "@/components/DailyReview";
import { LevelProgressBar } from "@/components/LevelProgressBar";
import { LevelUpBanner } from "@/components/LevelUpBanner";
import { LogbookForm } from "@/components/LogbookForm";
import { DailySummary } from "@/components/DailySummary";
import { MomentumChainCard } from "@/components/MomentumChainCard";
import { SoundtrackLauncher } from "@/components/SoundtrackLauncher";
import { SmallWins } from "@/components/SmallWins";
import type { DailySummaryData, MovedForward } from "@/lib/summary";
import { displayCurrentChain } from "@/lib/chain";
import {
  getSuggestedSoundtrack,
  getSoundtrackUrl,
  type SoundtrackUrls,
} from "@/lib/soundtrack";
import type { FocusDuration } from "@/lib/focus";

export default function TodayPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [, refreshProgress] = useState(0);
  const [missionInput, setMissionInput] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<FocusDuration | null>(25);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const state = getState();
  const today = getTodayDate();
  const timezone = state.profile.timezone;

  const capacity = state.capacity[today] || null;
  const mainQuest = state.missions[today] || null;
  const progress = state.progress;
  const momentum = progress.momentumState;
  const xpToday = state.xpEvents.filter((e) => e.eventDate === today);
  const routine = state.routines;
  const review = state.reviews[today] || null;
  const logbookEntry = state.logbook[today] || null;
  const activeFocusSession = state.focusSessions.find(
    (s) => s.status === "in_progress" || s.status === "paused"
  );

  const completedStepIds = new Set(state.routines.completions[today] || []);

  const totalXp = progress.totalXp;
  const { level, xpIntoLevel, xpForNextLevel } = xpIntoCurrentLevel(totalXp);
  const xpEarnedToday = xpToday.reduce((sum, e) => sum + e.xpAmount, 0);
  const missionComplete = mainQuest?.status === "completed";
  const levelBeforeToday = levelForXp(Math.max(0, totalXp - xpEarnedToday));
  const didLevelUpToday = levelBeforeToday < level;
  const currentChain = displayCurrentChain(
    {
      current_chain_length: progress.currentChainLength,
      longest_chain_length: progress.longestChainLength,
      chain_last_qualifying_date: progress.chainLastQualifyingDate || null,
      last_grace_used_date: progress.lastGraceUsedDate || null,
      comeback_count: progress.comebackCount,
    },
    today
  );

  const soundtracks: SoundtrackUrls = {
    ignite: state.soundtrack.ignite || null,
    lock_in: state.soundtrack.lockIn || null,
    grind: state.soundtrack.grind || null,
    reset: state.soundtrack.reset || null,
    victory_lap: state.soundtrack.victoryLap || null,
  };

  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const localHour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", hourCycle: "h23" }).format(now)
  );

  const focusMinutesToday = (() => {
    const sessions = state.focusSessions.filter((s) => {
      if (!s.completedAt) return false;
      const sessionDate = new Date(s.completedAt).toLocaleDateString("en-CA", { timeZone: timezone });
      return sessionDate === today;
    });
    if (sessions.length === 0) return null;
    return sessions.reduce((sum, s) => sum + (s.actualMinutes ?? s.durationMinutes), 0);
  })();

  const summaryData: DailySummaryData = {
    dateLabel,
    isoDate: today,
    capacity,
    missionTitle: mainQuest?.title ?? null,
    missionComplete,
    launchSequenceCompleted: completedStepIds.size,
    launchSequenceTotal: routine.steps.length,
    focusMinutesToday,
    xpEarnedToday,
    landing: {
      movedForward: (review?.movedForward as MovedForward | undefined) ?? null,
      note: review?.note ?? null,
    },
    logbook: {
      winText: logbookEntry?.winText ?? null,
      blockerText: logbookEntry?.blockerText ?? null,
      tomorrowFirstMove: logbookEntry?.tomorrowFirstMove ?? null,
      journalText: logbookEntry?.journalText ?? null,
    },
  };

  // Determine next action state
  const suggestedMode = capacity ? getSuggestedSoundtrack(capacity) : "LOCK IN";
  const suggestedUrl = getSoundtrackUrl(soundtracks, suggestedMode);
  const lockInUrl = soundtracks.lock_in;
  const victoryLapUrl = soundtracks.victory_lap;

  const handleMissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (missionInput.trim()) {
      saveMainQuest(missionInput.trim());
      setMissionInput("");
      window.location.reload();
    }
  };

  const handleStartFocus = (duration: FocusDuration) => {
    startFocusSession(duration);
    router.push("/focus");
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 pt-6 pb-[max(5rem,env(safe-area-inset-bottom))] md:gap-8 md:px-8">
      {/* Header */}
      <header className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-[var(--gradient-start)] via-[var(--gradient-mid-2)] to-[var(--gradient-end)] bg-clip-text text-transparent md:text-6xl">
            TDAH
          </h1>
          <p className="mt-2 text-sm font-medium text-[var(--muted)]">Momentum beats motivation.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[var(--surface-elevated)] border border-[var(--border-accent)] px-4 py-2 shadow-lg">
          <span className="text-lg">✨</span>
          <span className="text-sm font-bold">{totalXp} XP</span>
        </div>
      </header>

      <LevelProgressBar level={level} xpIntoLevel={xpIntoLevel} xpForNextLevel={xpForNextLevel} momentum={momentum} />
      <LevelUpBanner level={level} didLevelUpToday={didLevelUpToday} />

      <SmallWins wins={state.smallWins} today={today} onChange={() => refreshProgress((value) => value + 1)} />

      {/* PRIMARY NEXT ACTION */}
      <div id="mission-start" tabIndex={-1} className="scroll-mt-6 rounded-2xl focus-visible:outline-2 focus-visible:outline-[var(--success)]">
      {!capacity ? (
        /* STATE: No capacity selected */
        <section className="flex flex-col gap-5">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Check In</h2>
            <p className="mt-3 text-base text-[var(--muted)]">How much have you got today?</p>
          </div>
          <CapacityPicker />
        </section>
      ) : missionComplete ? (
        /* STATE: Mission complete */
        <section className="flex flex-col gap-5">
          <div className="dark-panel-elevated rounded-2xl border-2 border-[var(--success)] p-8 text-center" style={{boxShadow: '0 0 40px var(--success-glow)'}}>
            <div className="text-5xl">🎉</div>
            <h2 className="mt-4 text-3xl font-black">Mission Complete</h2>
            <p className="mt-3 text-2xl font-bold text-[var(--success)]">+100 XP</p>
            <p className="mt-3 text-base text-[var(--muted)]">{mainQuest?.title}</p>
          </div>

          {victoryLapUrl && (
            <div className="flex flex-col gap-3">
              <p className="text-center text-sm font-medium">Victory Lap?</p>
              <SoundtrackLauncher mode="VICTORY LAP" url={victoryLapUrl} />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="gradient-button min-h-[56px] rounded-xl px-6 py-3 text-lg font-bold text-white active:scale-[0.98]"
            >
              I&apos;m Done For Today
            </button>
            <Link
              href="/"
              className="dark-panel-elevated min-h-[48px] flex items-center justify-center rounded-xl border-2 border-[var(--border-accent)] px-6 py-2.5 text-sm font-semibold active:scale-[0.98]"
            >
              Keep Going
            </Link>
          </div>
        </section>
      ) : activeFocusSession ? (
        /* STATE: Active focus session */
        <section className="flex flex-col gap-4">
          <div className="neon-card-strong rounded-2xl p-6 text-center">
            <h2 className="text-xl font-bold">Focus Block In Progress</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{mainQuest?.title}</p>
          </div>
          <Link
            href="/focus"
            className="gradient-button min-h-[56px] flex items-center justify-center rounded-xl px-6 py-3 text-lg font-bold text-white active:scale-[0.98]"
          >
            Return to Focus
          </Link>
        </section>
      ) : !mainQuest ? (
        /* STATE: Capacity selected, no mission */
        <section className="flex flex-col gap-5">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Choose Your One Thing</h2>
            <p className="mt-3 text-base text-[var(--muted)]">What would make today count?</p>
          </div>

          <form onSubmit={handleMissionSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              value={missionInput}
              onChange={(e) => setMissionInput(e.target.value)}
              placeholder="e.g. Send three job applications"
              required
              autoFocus
              className="min-h-[60px] rounded-xl border-2 border-[var(--accent)] bg-[var(--surface)] px-6 py-4 text-lg outline-none focus:border-[var(--accent-light)] focus:shadow-[0_0_20px_var(--glow-purple)] md:text-xl"
            />
            <button
              type="submit"
              className="gradient-button min-h-[60px] rounded-xl px-6 py-4 text-xl font-bold text-white active:scale-[0.98] md:min-h-[64px]"
            >
              Set Today&apos;s Mission
            </button>
          </form>
        </section>
      ) : (
        /* STATE: Mission exists, ready to activate */
        <section className="flex flex-col gap-6 md:gap-8">
          {/* HERO MISSION CARD */}
          <div className="neon-card-strong rounded-3xl p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-light)]">
                  🎯 Today&apos;s Mission
                </p>
                <h2 className="mt-3 text-2xl font-bold leading-tight md:text-3xl">{mainQuest.title}</h2>
                <p className="mt-3 text-sm font-medium text-[var(--accent-light)]">
                  ★ One Mission. Make it count.
                </p>
              </div>
              <details>
                <summary className="cursor-pointer rounded-lg border border-[var(--border-accent)] px-3 py-1.5 text-xs font-semibold active:scale-[0.98]">
                  Edit
                </summary>
                <div className="mt-3">
                  <MainQuestCard quest={mainQuest} soundtracks={soundtracks} />
                </div>
              </details>
            </div>
          </div>

          {/* ACTIVATION CARD */}
          <div className="dark-panel-elevated rounded-3xl border border-[var(--border-accent)] p-6 md:p-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold md:text-4xl">Ready to Move?</h3>
              <p className="mt-2 text-sm font-medium text-[var(--accent-light)]">⚡ Lock in. Get it done.</p>
            </div>

            {/* Music selection */}
            <div className="mt-6">
              {lockInUrl ? (
                <div className="dark-panel rounded-xl border border-[var(--border-accent)] p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--gradient-mid-1)] to-[var(--gradient-mid-2)]">
                      <span className="text-2xl">🎧</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Lock In Track</p>
                      <p className="mt-1 text-sm font-semibold">Ready to play</p>
                    </div>
                    <SoundtrackLauncher mode="LOCK IN" url={lockInUrl} />
                  </div>
                </div>
              ) : (
                <Link
                  href="/settings"
                  className="dark-panel flex items-center gap-4 rounded-xl border border-[var(--border-accent)] p-4 active:scale-[0.98]"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--surface)]">
                    <span className="text-2xl">🎧</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Lock In Track</p>
                    <p className="mt-1 text-sm font-semibold">Add your Lock In track</p>
                  </div>
                  <span className="text-[var(--muted)]">→</span>
                </Link>
              )}
            </div>

            {/* Duration selection */}
            <div className="mt-6 flex flex-col gap-4">
              <p className="text-center text-sm font-semibold text-[var(--muted)]">Focus Duration</p>
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {([10, 25, 45] as FocusDuration[]).map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setSelectedDuration(duration)}
                    className={`min-h-[64px] flex flex-col items-center justify-center gap-1 rounded-xl border-2 px-4 py-3 text-base font-bold transition md:min-h-[72px] ${
                      selectedDuration === duration
                        ? "gradient-button border-transparent text-white shadow-lg"
                        : "dark-panel-elevated border-[var(--border-accent)]"
                    }`}
                  >
                    <span className="text-2xl md:text-3xl">{duration}</span>
                    <span className="text-xs font-semibold">min</span>
                  </button>
                ))}
              </div>
            </div>

            {/* START FOCUS */}
            <button
              onClick={() => selectedDuration && handleStartFocus(selectedDuration)}
              disabled={!selectedDuration}
              className="gradient-button mt-6 min-h-[68px] w-full rounded-xl px-6 py-4 text-2xl font-black text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale md:min-h-[76px]"
            >
              <span>▶ START FOCUS</span>
              <span className="mt-1 block text-sm font-semibold">Let&apos;s go.</span>
            </button>
          </div>
        </section>
      )}

      </div>
      {/* SECONDARY FEATURES - 2x2 Grid on Desktop */}
      {capacity && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5">
          <details className="dark-panel-elevated rounded-2xl border border-[var(--border-accent)] overflow-hidden">
            <summary className="cursor-pointer px-5 py-4 text-base font-bold active:scale-[0.98]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💭</span>
                <div>
                  <p className="font-bold">Reflect</p>
                  <p className="text-xs text-[var(--muted)]">Did today move you forward?</p>
                </div>
              </div>
            </summary>
            <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
              <DailyReview review={review ?? null} />
            </div>
          </details>

          <details className="dark-panel-elevated rounded-2xl border border-[var(--border-accent)] overflow-hidden">
            <summary className="cursor-pointer px-5 py-4 text-base font-bold active:scale-[0.98]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📓</span>
                <div>
                  <p className="font-bold">Logbook</p>
                  <p className="text-xs text-[var(--muted)]">Log wins, blockers, tomorrow</p>
                </div>
              </div>
            </summary>
            <div className="border-t border-[var(--border)] px-5 pb-5 pt-4 flex flex-col gap-4">
              <LogbookForm entry={logbookEntry ?? null} />
              <DailySummary data={summaryData} />
            </div>
          </details>

          <details className="dark-panel-elevated rounded-2xl border border-[var(--border-accent)] overflow-hidden">
            <summary className="cursor-pointer px-5 py-4 text-base font-bold active:scale-[0.98]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📈</span>
                <div>
                  <p className="font-bold">Momentum</p>
                  <p className="text-xs text-[var(--muted)]">Track your chain & comeback</p>
                </div>
              </div>
            </summary>
            <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
              <MomentumChainCard
                currentChain={currentChain}
                longestChain={progress.longestChainLength}
                comebackCount={progress.comebackCount}
              />
            </div>
          </details>

          {routine.steps.length > 0 ? (
            <details className="dark-panel-elevated rounded-2xl border border-[var(--border-accent)] overflow-hidden">
              <summary className="cursor-pointer px-5 py-4 text-base font-bold active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="font-bold">Launch Sequence</p>
                    <p className="text-xs text-[var(--muted)]">{completedStepIds.size}/{routine.steps.length} complete</p>
                  </div>
                </div>
              </summary>
              <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
                <MorningReset steps={routine.steps} completedStepIds={completedStepIds} />
              </div>
            </details>
          ) : (
            <Link
              href="/settings"
              className="dark-panel-elevated rounded-2xl border border-[var(--border-accent)] px-5 py-4 active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎧</span>
                <div>
                  <p className="font-bold">Soundtrack</p>
                  <p className="text-xs text-[var(--muted)]">Configure your music</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-[var(--border-accent)] bg-[var(--surface-elevated)]/95 backdrop-blur-lg md:hidden">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          <Link href="/" className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 active:scale-[0.95]">
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-semibold">Today</span>
          </Link>
          <Link href="/focus" className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 active:scale-[0.95]">
            <span className="text-xl">⏱</span>
            <span className="text-[10px] font-semibold">Focus</span>
          </Link>
          <button className="flex flex-col items-center gap-1 rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-mid-2)] px-3 py-2 active:scale-[0.95]">
            <span className="text-xl">⚡</span>
          </button>
          <Link href="/" className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 active:scale-[0.95]">
            <span className="text-xl">✨</span>
            <span className="text-[10px] font-semibold">XP</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 active:scale-[0.95]">
            <span className="text-xl">⚙️</span>
            <span className="text-[10px] font-semibold">Settings</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
