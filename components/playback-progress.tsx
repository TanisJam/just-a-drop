"use client";

import { PlayerProgress } from "@/hooks/use-player";
import { useI18n } from "@/lib/i18n/context";

interface PlaybackProgressProps {
  progress: PlayerProgress;
}

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function PlaybackProgress({ progress }: PlaybackProgressProps) {
  const { t } = useI18n();
  const { elapsed, total } = progress;
  const percent = total > 0 ? Math.min(100, Math.round((elapsed / total) * 100)) : 0;

  function suppressContextMenu(e: React.MouseEvent) {
    e.preventDefault();
  }

  return (
    <div className="playback-progress" onContextMenu={suppressContextMenu}>
      <div
        className="progress-bar progress-bar--playback"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t.listen.progress}
      >
        <div className="progress-bar__fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="playback-progress__times">
        <span>{formatMs(elapsed)}</span>
        <span>{formatMs(total)}</span>
      </div>
    </div>
  );
}
