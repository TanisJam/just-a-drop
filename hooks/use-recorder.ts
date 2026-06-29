"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createRecorder } from "@/lib/recorder";
import { MAX_DURATION_MS } from "@/lib/constants";

export type RecorderStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "denied"
  | "unsupported";

export interface UseRecorderResult {
  status: RecorderStatus;
  durationMs: number;
  blob: Blob | null;
  codec: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useRecorder(): UseRecorderResult {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [durationMs, setDurationMs] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [codec, setCodec] = useState<string | null>(null);

  const recorderRef = useRef<ReturnType<typeof createRecorder> | null>(null);

  useEffect(() => {
    return () => {
      recorderRef.current?.destroy();
    };
  }, []);

  const start = useCallback(() => {
    setStatus("requesting");
    setDurationMs(0);
    setBlob(null);
    setCodec(null);

    recorderRef.current?.destroy();

    const recorder = createRecorder({
      maxDurationMs: MAX_DURATION_MS,
      onDurationUpdate: (ms) => setDurationMs(ms),
      onComplete: (completedBlob, completedCodec) => {
        setBlob(completedBlob);
        setCodec(completedCodec);
        setStatus("idle");
      },
      onError: (error) => {
        if (
          error.type === "PERMISSION_DENIED"
        ) {
          setStatus("denied");
        } else if (
          error.type === "NOT_SUPPORTED" ||
          error.type === "NO_CODEC"
        ) {
          setStatus("unsupported");
        } else {
          setStatus("idle");
        }
      },
    });

    recorderRef.current = recorder;

    // start() is async: permission → stream → recorder.start()
    // onError fires before the promise resolves on failure, so we check
    // current status to avoid overwriting denied/unsupported with recording
    recorder.start().then(() => {
      setStatus((prev) =>
        prev === "requesting" ? "recording" : prev
      );
    });
  }, []);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    recorderRef.current?.destroy();
    recorderRef.current = null;
    setBlob(null);
    setCodec(null);
    setDurationMs(0);
    setStatus("idle");
  }, []);

  return { status, durationMs, blob, codec, start, stop, reset };
}
