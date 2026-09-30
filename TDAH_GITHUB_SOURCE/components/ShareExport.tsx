"use client";

import { useState } from "react";
import { summaryFileBaseName } from "@/lib/summary";

type NavigatorWithShare = Navigator & {
  share?: (data: { title?: string; text?: string }) => Promise<void>;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function downloadText(fileName: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ShareExport({
  isoDate,
  dateLabel,
  privateText,
  shareAWinText,
  dayOneText,
}: {
  isoDate: string;
  dateLabel: string;
  privateText: string;
  shareAWinText: string;
  dayOneText: string;
}) {
  const [status, setStatus] = useState<string | null>(null);

  async function handleCopySummary() {
    const ok = await copyText(privateText);
    setStatus(ok ? "Full summary copied." : "Couldn't copy — try again.");
  }

  function handleDownload() {
    downloadText(`${summaryFileBaseName(isoDate)}.md`, privateText);
    setStatus("Download started.");
  }

  async function handleShare() {
    const nav = navigator as NavigatorWithShare;
    if (nav.share) {
      try {
        await nav.share({ title: `TDAH — ${dateLabel}`, text: shareAWinText });
        setStatus("Shared.");
        return;
      } catch {
        // user cancelled the share sheet, or share failed — fall through to clipboard
      }
    }
    const ok = await copyText(shareAWinText);
    setStatus(ok ? "Share unavailable — copied instead." : "Couldn't share or copy.");
  }

  async function handleCopyDayOne() {
    const ok = await copyText(dayOneText);
    setStatus(ok ? "Copied for Day One." : "Couldn't copy — try again.");
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopySummary}
          className="min-h-11 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium transition active:scale-[0.98]"
        >
          Copy summary
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="min-h-11 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium transition active:scale-[0.98]"
        >
          Download
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="min-h-11 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-foreground)] transition active:scale-[0.98]"
        >
          Share a Win
        </button>
      </div>

      <button
        type="button"
        onClick={handleCopyDayOne}
        className="min-h-11 self-start text-xs font-medium text-[var(--muted)] underline decoration-dotted"
      >
        Copy for Day One
      </button>

      {status && (
        <p role="status" aria-live="polite" className="text-xs text-[var(--muted)]">
          {status}
        </p>
      )}
    </div>
  );
}
