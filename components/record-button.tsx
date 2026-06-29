"use client";

import { RecorderStatus } from "@/hooks/use-recorder";

interface RecordButtonProps {
  status: RecorderStatus;
  onRecord: () => void;
  onStop: () => void;
}

export function RecordButton({ status, onRecord, onStop }: RecordButtonProps) {
  const isRecording = status === "recording";
  const isRequesting = status === "requesting";
  const isDisabled = isRequesting;

  function handleClick() {
    if (isRecording) {
      onStop();
    } else if (status === "idle") {
      onRecord();
    }
  }

  return (
    <button
      className={`record-button${isRecording ? " record-button--recording" : ""}`}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={isRecording ? "Detener grabación" : "Iniciar grabación"}
      type="button"
    >
      {isRecording ? (
        // Stop icon — square
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <rect x="8" y="8" width="20" height="20" rx="2" fill="currentColor" />
        </svg>
      ) : (
        // Mic icon
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <rect x="13" y="4" width="10" height="18" rx="5" fill="currentColor" />
          <path
            d="M7 18c0 6.075 4.925 11 11 11s11-4.925 11-11"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <line x1="18" y1="29" x2="18" y2="33" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="13" y1="33" x2="23" y2="33" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
