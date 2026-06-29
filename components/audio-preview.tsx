"use client";

import { useEffect, useRef } from "react";

interface AudioPreviewProps {
  blob: Blob;
}

export function AudioPreview({ blob }: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    urlRef.current = url;

    if (audioRef.current) {
      audioRef.current.src = url;
    }

    return () => {
      URL.revokeObjectURL(url);
      urlRef.current = null;
    };
  }, [blob]);

  return (
    <div className="audio-preview">
      <audio ref={audioRef} controls className="audio-preview__player" />
    </div>
  );
}
