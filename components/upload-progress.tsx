"use client";

import { UploadProgress as UploadProgressData } from "@/hooks/use-upload";
import { useI18n } from "@/lib/i18n/context";

interface UploadProgressProps {
  progress: UploadProgressData;
}

export function UploadProgress({ progress }: UploadProgressProps) {
  const { t } = useI18n();
  const { current, total } = progress;
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="upload-progress">
      <p className="upload-progress__label">
        {total > 0 ? t.upload.uploading(current, total) : t.upload.preparing}
      </p>
      <div className="progress-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
