"use client";

interface PlayButtonProps {
  onPlay: () => void;
  disabled?: boolean;
}

export function PlayButton({ onPlay, disabled = false }: PlayButtonProps) {
  function suppressContextMenu(e: React.MouseEvent) {
    e.preventDefault();
  }

  return (
    <div className="play-button-wrapper" onContextMenu={suppressContextMenu}>
      <div className="warning-box">
        <p>⚠️ Este audio se escucha <strong>una sola vez</strong>. Una vez que presiones play, no podrás volver a escucharlo.</p>
      </div>
      <button
        className="play-button"
        onClick={onPlay}
        disabled={disabled}
        type="button"
        aria-label="Reproducir audio"
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
