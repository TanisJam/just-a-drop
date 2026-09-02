"use client";

import { useI18n } from "@/lib/i18n/context";

interface RecordingIndicatorProps {
  durationMs: number;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function RecordingIndicator({ durationMs }: RecordingIndicatorProps) {
  const { t } = useI18n();
  return (
    <div className="recording-indicator" aria-live="off" aria-label={t.record.duration(formatDuration(durationMs))}>
      <span className="recording-indicator__dot" aria-hidden="true" />
      <span className="recording-indicator__time">{formatDuration(durationMs)}</span>
    </div>
  );
}
