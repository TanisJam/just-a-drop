"use client";

import { useState, useCallback } from "react";
import { chunkAudioBlob } from "@/lib/chunker";
import { api } from "@/lib/api";

export type UploadStatus = "idle" | "chunking" | "uploading" | "done" | "error";

export interface UploadProgress {
  current: number;
  total: number;
}

export interface UseUploadInput {
  blob: Blob | null;
  codec: string | null;
  durationMs: number;
}

export interface UseUploadResult {
  status: UploadStatus;
  progress: UploadProgress;
  audioId: string | null;
  error: string | null;
  start: () => Promise<void>;
}

export function useUpload({ blob, codec, durationMs }: UseUploadInput): UseUploadResult {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState<UploadProgress>({ current: 0, total: 0 });
  const [audioId, setAudioId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    if (!blob || !codec || !durationMs) {
      setError("No recording data available");
      setStatus("error");
      return;
    }

    setStatus("chunking");
    setError(null);
    setProgress({ current: 0, total: 0 });
    setAudioId(null);

    try {
      // 1. Chunk the blob
      const { chunks, chunkCount } = chunkAudioBlob(blob, codec, durationMs);

      setProgress({ current: 0, total: chunkCount });
      setStatus("uploading");

      // 2. Create audio record
      const { audio_id, upload_token } = await api.createAudio({
        chunk_count: chunkCount,
        duration_ms: durationMs,
        codec,
      });

      // 3. Upload chunks sequentially
      for (let i = 0; i < chunks.length; i++) {
        await api.uploadChunk(audio_id, i, chunks[i], upload_token);
        setProgress({ current: i + 1, total: chunkCount });
      }

      setAudioId(audio_id);
      setStatus("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      setStatus("error");
    }
  }, [blob, codec, durationMs]);

  return { status, progress, audioId, error, start };
}
