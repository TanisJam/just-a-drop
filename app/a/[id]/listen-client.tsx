"use client";

import { useEffect, useRef, useState } from "react";
import { api, AudioMeta } from "@/lib/api";
import { ApiClientError } from "@/lib/api";
import { usePlayer } from "@/hooks/use-player";
import { PlayButton } from "@/components/play-button";
import { PlaybackProgress } from "@/components/playback-progress";
import { StatusScreen } from "@/components/status-screen";
import { Fringe } from "@/components/fringe";
import { useI18n } from "@/lib/i18n/context";

interface ListenClientProps {
  audioId: string;
}

type ScreenState =
  | { type: "loading" }
  | { type: "ready"; meta: AudioMeta }
  | { type: "consumed" }
  | { type: "expired" }
  | { type: "error"; message: string }
  | { type: "playing" }
  | { type: "finished" };

export function ListenClient({ audioId }: ListenClientProps) {
  const [screen, setScreen] = useState<ScreenState>({ type: "loading" });
  // Session token MUST live in a ref — NEVER in state (not serializable, not inspectable)
  const sessionTokenRef = useRef<string | null>(null);
  const chunkCountRef = useRef<number>(0);
  const durationMsRef = useRef<number>(0);

  const { status: playerStatus, progress, startPlayback } = usePlayer();
  const { t } = useI18n();

  // Fetch metadata on mount
  useEffect(() => {
    api
      .getAudioMeta(audioId)
      .then((meta) => {
        if (meta.status === "consumed") {
          setScreen({ type: "consumed" });
        } else if (meta.status === "expired") {
          setScreen({ type: "expired" });
        } else {
          durationMsRef.current = meta.duration_ms;
          chunkCountRef.current = meta.chunk_count;
          setScreen({ type: "ready", meta });
        }
      })
      .catch((err) => {
        if (err instanceof ApiClientError && err.status === 404) {
          setScreen({ type: "expired" });
        } else {
          setScreen({
            type: "error",
            message: err instanceof Error ? err.message : t.listen.unknownError,
          });
        }
      });
  }, [audioId]);

  // Sync player status to screen state
  useEffect(() => {
    if (playerStatus === "finished") {
      setScreen({ type: "finished" });
    } else if (playerStatus === "error") {
      setScreen({ type: "error", message: t.listen.playbackError });
    }
  }, [playerStatus]);

  async function handlePlay() {
    try {
      const playResponse = await api.play(audioId);
      // Store session token in ref — NEVER in state
      sessionTokenRef.current = playResponse.session_token;
      chunkCountRef.current = playResponse.chunk_count;

      setScreen({ type: "playing" });

      startPlayback({
        audioId,
        sessionToken: playResponse.session_token,
        chunkCount: playResponse.chunk_count,
        totalDurationMs: durationMsRef.current,
        onProgress: () => {},
        onChunkStart: () => {},
        onComplete: () => {},
        onError: () => {},
      });
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        setScreen({ type: "consumed" });
      } else {
        setScreen({
          type: "error",
          message: err instanceof Error ? err.message : t.listen.startError,
        });
      }
    }
  }

  function suppressContextMenu(e: React.MouseEvent) {
    e.preventDefault();
  }

  if (screen.type === "loading") {
    return (
      <main className="screen">
        <div className="skeleton" aria-label={t.listen.loading}>
          <div className="skeleton__block skeleton__block--title" />
          <div className="skeleton__block skeleton__block--button" />
        </div>
      </main>
    );
  }

  if (screen.type === "consumed") {
    return (
      <main className="screen">
        <StatusScreen variant="consumed" />
      </main>
    );
  }

  if (screen.type === "expired") {
    return (
      <main className="screen">
        <StatusScreen variant="expired" />
      </main>
    );
  }

  if (screen.type === "error") {
    return (
      <main className="screen">
        <div className="status-screen">
          <div className="status-screen__icon status-screen__icon--alert" aria-hidden="true">
            <svg viewBox="0 0 44 44" fill="none">
              <path d="M22 6 40 38 H4 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
              <line x1="22" y1="18" x2="22" y2="27" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="22" cy="32.5" r="1.6" fill="currentColor" />
            </svg>
          </div>
          <h1 className="status-screen__title">{t.listen.errorTitle}</h1>
          <p className="status-screen__description">{screen.message}</p>
        </div>
      </main>
    );
  }

  if (screen.type === "finished") {
    return (
      <main className="screen">
        <div className="status-screen">
          <div className="status-screen__icon" aria-hidden="true">
            <svg viewBox="0 0 44 44" fill="none">
              <path d="M22 4C22 4 9 18 9 27a13 13 0 0 0 26 0c0-9-13-23-13-23Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M16 27.5l4 4 8-8.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="status-screen__title">{t.listen.finishedTitle}</h1>
          <p className="status-screen__description">{t.listen.finishedDesc}</p>
        </div>
      </main>
    );
  }

  if (screen.type === "playing") {
    return (
      <main className="screen" onContextMenu={suppressContextMenu}>
        <header className="header">
          <h1 className="header__logo">JustADrop</h1>
        </header>
        <div className="screen__content">
          <h2 className="screen__title">{t.listen.listening}</h2>
          <PlaybackProgress progress={progress} />
        </div>
      </main>
    );
  }

  // screen.type === "ready"
  return (
    <main className="screen">
      <header className="header">
        <h1 className="header__logo">JustADrop</h1>
      </header>
      <div className="screen__content">
        <PlayButton onPlay={handlePlay} />
        <h2 className="screen__title">{t.listen.fromSomeone}</h2>
        <Fringe />
      </div>
    </main>
  );
}
