"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPlayer, PlayerConfig } from "@/lib/player";

export type PlayerStatus = "idle" | "playing" | "finished" | "error";

export interface PlayerProgress {
  elapsed: number;
  total: number;
}

export interface UsePlayerResult {
  status: PlayerStatus;
  progress: PlayerProgress;
  startPlayback: (config: PlayerConfig) => void;
  destroy: () => void;
}

export function usePlayer(): UsePlayerResult {
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [progress, setProgress] = useState<PlayerProgress>({ elapsed: 0, total: 0 });

  // NEVER use useState for the session token — it must not be serializable/inspectable
  const playerRef = useRef<ReturnType<typeof createPlayer> | null>(null);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
    };
  }, []);

  const destroy = useCallback(() => {
    playerRef.current?.destroy();
    playerRef.current = null;
    setStatus("idle");
    setProgress({ elapsed: 0, total: 0 });
  }, []);

  const startPlayback = useCallback((config: PlayerConfig) => {
    playerRef.current?.destroy();

    const player = createPlayer({
      ...config,
      onProgress: (elapsed, total) => {
        setProgress({ elapsed, total });
      },
      onChunkStart: () => {
        // Could track chunk index if needed
      },
      onComplete: () => {
        setStatus("finished");
      },
      onError: () => {
        setStatus("error");
      },
    });

    playerRef.current = player;
    setStatus("playing");
    setProgress({ elapsed: 0, total: config.totalDurationMs });

    player.start().catch(() => {
      setStatus("error");
    });
  }, []);

  return { status, progress, startPlayback, destroy };
}
