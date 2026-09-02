"use client";

import { useI18n } from "@/lib/i18n/context";

interface PlayButtonProps {
  onPlay: () => void;
  disabled?: boolean;
}

export function PlayButton({ onPlay, disabled = false }: PlayButtonProps) {
  const { t } = useI18n();

  function suppressContextMenu(e: React.MouseEvent) {
    e.preventDefault();
  }

  return (
    <div className="play-button-wrapper" onContextMenu={suppressContextMenu}>
      <div className="warning-box">
        <p>⚠️ {t.play.warningPre}<strong>{t.play.warningStrong}</strong>{t.play.warningPost}</p>
      </div>
      <button
        className="play-button"
        onClick={onPlay}
        disabled={disabled}
        type="button"
        aria-label={t.play.ariaPlay}
        onContextMenu={suppressContextMenu}
      >
        {/* Play triangle */}
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
          <polygon points="10,6 38,22 10,38" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
