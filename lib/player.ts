import { api } from '@/lib/api';

export interface PlayerError {
  type: 'FETCH_FAILED' | 'DECODE_FAILED' | 'PLAYBACK_FAILED';
  message: string;
  chunkIndex?: number;
}

export interface PlayerConfig {
  audioId: string;
  sessionToken: string;
  chunkCount: number;
  totalDurationMs: number;
  onProgress: (elapsed: number, total: number) => void;
  onChunkStart: (index: number) => void;
  onComplete: () => void;
  onError: (error: PlayerError) => void;
}

export function createPlayer(config: PlayerConfig): {
  start: () => Promise<void>;
  destroy: () => void;
} {
  let audioContext: AudioContext | null = null;
  let rafHandle: number | null = null;
  let sourceNode: AudioBufferSourceNode | null = null;
  let destroyed = false;
  let playbackStartTime = 0;

  function cancelRaf() {
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle);
      rafHandle = null;
    }
  }

  async function start(): Promise<void> {
    if (destroyed) return;

    audioContext = new AudioContext();

    // Required for iOS Safari autoplay policy
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Phase 1: Fetch all chunks sequentially, preserving server-side order validation.
    // Chunks are byte-sliced from the original WebM blob — only the concatenated
    // result is a valid decodable container, individual slices are not.
    const buffers: ArrayBuffer[] = [];
    let totalBytes = 0;

    for (let i = 0; i < config.chunkCount; i++) {
      if (destroyed) return;
      config.onChunkStart(i);

      try {
        const arrayBuffer = await api.fetchChunk(
          config.audioId,
          i,
          config.sessionToken,
        );
        buffers.push(arrayBuffer);
        totalBytes += arrayBuffer.byteLength;
      } catch (err) {
        if (destroyed) return;
        config.onError({
          type: 'FETCH_FAILED',
          message: err instanceof Error ? err.message : 'Failed to fetch chunk',
          chunkIndex: i,
        });
        return;
      }
    }

    if (destroyed || !audioContext) return;

    // Phase 2: Concatenate all chunks to reconstruct the original audio blob
    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (const buf of buffers) {
      combined.set(new Uint8Array(buf), offset);
      offset += buf.byteLength;
    }

    // Phase 3: Decode the reconstructed audio
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioContext.decodeAudioData(combined.buffer);
    } catch (err) {
      if (destroyed) return;
      config.onError({
        type: 'DECODE_FAILED',
        message: err instanceof Error ? err.message : 'Failed to decode audio',
      });
      return;
    }

    if (destroyed || !audioContext) return;

    // Phase 4: Play the decoded audio
    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(audioContext.destination);

    playbackStartTime = audioContext.currentTime;
    sourceNode.start(playbackStartTime);

    sourceNode.onended = () => {
      if (!destroyed) {
        cancelRaf();
        config.onComplete();
      }
    };

    // Phase 5: Progress tracking via requestAnimationFrame
    const totalDuration = audioBuffer.duration * 1000; // actual decoded duration
    const loop = () => {
      if (destroyed || !audioContext) return;

      const now = audioContext.currentTime;
      const elapsed = Math.min(
        (now - playbackStartTime) * 1000,
        totalDuration,
      );
      config.onProgress(elapsed, config.totalDurationMs);

      rafHandle = requestAnimationFrame(loop);
    };
    rafHandle = requestAnimationFrame(loop);
  }

  function destroy(): void {
    destroyed = true;
    cancelRaf();

    if (sourceNode) {
      try { sourceNode.stop(); } catch { /* may already be stopped */ }
      sourceNode = null;
    }

    if (audioContext) {
      audioContext.close().catch(() => {});
      audioContext = null;
    }
  }

  return { start, destroy };
}
