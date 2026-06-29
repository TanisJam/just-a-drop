import { CHUNK_DURATION_MS } from '@/lib/constants';

export interface ChunkResult {
  chunks: Blob[];
  chunkCount: number;
  codec: string;
  totalDurationMs: number;
}

export function chunkAudioBlob(
  blob: Blob,
  codec: string,
  durationMs: number,
  chunkDurationMs?: number,
): ChunkResult {
  const effectiveChunkDurationMs = chunkDurationMs ?? CHUNK_DURATION_MS;

  if (blob.size === 0) {
    return { chunks: [], chunkCount: 0, codec, totalDurationMs: 0 };
  }

  const bytesPerMs = blob.size / durationMs;
  let bytesPerChunk = Math.floor(bytesPerMs * effectiveChunkDurationMs);

  if (bytesPerChunk <= 0) {
    bytesPerChunk = blob.size;
  }

  const chunks: Blob[] = [];
  let offset = 0;

  while (offset < blob.size) {
    const end = Math.min(offset + bytesPerChunk, blob.size);
    chunks.push(blob.slice(offset, end, codec));
    offset = end;
  }

  return {
    chunks,
    chunkCount: chunks.length,
    codec,
    totalDurationMs: durationMs,
  };
}
