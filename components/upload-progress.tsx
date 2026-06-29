"use client";

import { UploadProgress as UploadProgressData } from "@/hooks/use-upload";

interface UploadProgressProps {
  progress: UploadProgressData;
}

export function UploadProgress({ progress }: UploadProgressProps) {
  const { current, total } = progress;
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="upload-progress">
      <p className="upload-progress__label">
        {total > 0
          ? `Subiendo fragmento ${current} de ${total}…`
          : "Preparando…"}
      </p>
      <div className="progress-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
