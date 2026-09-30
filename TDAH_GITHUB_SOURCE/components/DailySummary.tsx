import {
  CAPACITY_LABELS,
  MOVED_FORWARD_LABELS,
  buildDayOneText,
  buildPrivateSummaryText,
  buildShareAWinText,
  type DailySummaryData,
} from "@/lib/summary";
import { ShareExport } from "./ShareExport";

function hasMeaningfulProgress(data: DailySummaryData): boolean {
  return Boolean(
    data.missionTitle ||
      data.launchSequenceCompleted > 0 ||
      data.focusMinutesToday ||
      data.xpEarnedToday > 0 ||
      data.landing.movedForward ||
      data.logbook.winText ||
      data.logbook.blockerText ||
      data.logbook.tomorrowFirstMove ||
      data.logbook.journalText
  );
}

export function DailySummary({ data }: { data: DailySummaryData }) {
  const privateText = buildPrivateSummaryText(data);
  const shareAWinText = buildShareAWinText(data);
  const dayOneText = buildDayOneText(data);

  if (!hasMeaningfulProgress(data)) {
    return (
      <section
        aria-labelledby="daily-summary-heading"
        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Daily summary
        </p>
        <h2 id="daily-summary-heading" className="mt-1 text-base font-semibold">
          {data.dateLabel}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Nothing logged yet today. That&apos;s okay — even one small thing counts.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="daily-summary-heading"
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        Daily summary
      </p>
      <h2 id="daily-summary-heading" className="mt-1 text-base font-semibold">
        {data.dateLabel}
      </h2>

      <dl className="mt-3 flex flex-col gap-1.5 text-sm">
        {data.capacity && (
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--muted)]">Capacity</dt>
            <dd>{CAPACITY_LABELS[data.capacity]}</dd>
          </div>
        )}
        {data.missionTitle && (
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--muted)]">Mission</dt>
            <dd className="text-right">
              {data.missionTitle} — {data.missionComplete ? "complete" : "in progress"}
            </dd>
          </div>
        )}
        {data.launchSequenceTotal > 0 && (
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--muted)]">Launch Sequence</dt>
            <dd>
              {data.launchSequenceCompleted} of {data.launchSequenceTotal}
            </dd>
          </div>
        )}
        {data.focusMinutesToday !== null && (
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--muted)]">Focus minutes</dt>
            <dd>{data.focusMinutesToday}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--muted)]">XP earned</dt>
          <dd className="font-semibold">{data.xpEarnedToday}</dd>
        </div>
        {data.landing.movedForward && (
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--muted)]">Moved life forward</dt>
            <dd>{MOVED_FORWARD_LABELS[data.landing.movedForward]}</dd>
          </div>
        )}
      </dl>

      {data.logbook.winText && (
        <div className="mt-3 text-sm">
          <p className="font-semibold text-[var(--muted)]">Win</p>
          <p className="whitespace-pre-wrap">{data.logbook.winText}</p>
        </div>
      )}
      {data.logbook.blockerText && (
        <div className="mt-3 text-sm">
          <p className="font-semibold text-[var(--muted)]">What got in the way</p>
          <p className="whitespace-pre-wrap">{data.logbook.blockerText}</p>
        </div>
      )}
      {data.logbook.tomorrowFirstMove && (
        <div className="mt-3 text-sm">
          <p className="font-semibold text-[var(--muted)]">Tomorrow&apos;s first move</p>
          <p className="whitespace-pre-wrap">{data.logbook.tomorrowFirstMove}</p>
        </div>
      )}

      <ShareExport
        isoDate={data.isoDate}
        dateLabel={data.dateLabel}
        privateText={privateText}
        shareAWinText={shareAWinText}
        dayOneText={dayOneText}
      />
    </section>
  );
}
