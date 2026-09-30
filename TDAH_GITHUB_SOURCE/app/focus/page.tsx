"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getState } from "@/lib/storage";
import { getTodayDate } from "@/lib/storage/actions";
import { FocusTimer } from "@/components/FocusTimer";

export default function FocusPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const state = getState();
  const today = getTodayDate();

  // Find active or paused session
  let session = state.focusSessions.find(
    (s) => s.status === "in_progress" || s.status === "paused"
  );

  // If no active session, check for recently completed session from today
  if (!session) {
    const completedToday = state.focusSessions
      .filter((s) => s.status === "completed" && s.date === today)
      .sort((a, b) => {
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return bTime - aTime;
      })[0];

    if (completedToday) {
      session = completedToday;
    }
  }

  if (!session) {
    router.push("/");
    return null;
  }

  // Get mission title if there's a quest ID
  let missionTitle: string | null = null;
  if (session.questId) {
    const mission = state.missions[today];
    missionTitle = mission?.title || null;
  }

  // Map camelCase to snake_case for FocusTimer
  return (
    <FocusTimer
      session={{
        id: session.id,
        duration_minutes: session.durationMinutes,
        started_at: session.startedAt,
        paused_at: session.pausedAt || null,
        total_paused_seconds: session.totalPausedSeconds,
        status: session.status,
        actual_minutes: session.actualMinutes || null,
      }}
      missionTitle={missionTitle}
    />
  );
}
