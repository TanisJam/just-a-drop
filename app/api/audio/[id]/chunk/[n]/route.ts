import { waitUntil } from '@vercel/functions';
import { getChunk } from '@/lib/storage';
import { cleanupAudio } from '@/lib/cleanup';
import { toErrorResponse } from '@/lib/errors';
import { VALIDATE_CHUNK_SESSION_SCRIPT } from '@/lib/lua-scripts';
import redis from '@/lib/redis';

interface ValidateChunkResult {
  ok?: boolean;
  is_last?: boolean;
  codec?: string;
  error?: string;
  expected?: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; n: string }> },
): Promise<Response> {
  const { id: audioId, n: nStr } = await params;

  // Extract session_token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return toErrorResponse('INVALID_SESSION', 'Missing or invalid Authorization header', 401);
  }
  const sessionToken = authHeader.slice(7); // Remove "Bearer "
  if (!sessionToken) {
    return toErrorResponse('INVALID_SESSION', 'Missing session token', 401);
  }

  // Parse and validate chunk index
  const n = parseInt(nStr, 10);
  if (isNaN(n) || n < 0) {
    return toErrorResponse('INVALID_CHUNK_INDEX', 'n must be a non-negative integer', 400);
  }

  // Execute atomic Lua validation script
  const rawResult = await redis.eval(
    VALIDATE_CHUNK_SESSION_SCRIPT,
    [`session:${sessionToken}`],
    [audioId, String(n)],
  );

  // Upstash REST SDK auto-deserializes cjson.encode() from Lua
  const result = (typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult) as ValidateChunkResult;

  if (result.error) {
    switch (result.error) {
      case 'INVALID_SESSION':
        return toErrorResponse('INVALID_SESSION', 'Session not found or has expired', 401);
      case 'SESSION_AUDIO_MISMATCH':
        return toErrorResponse('SESSION_AUDIO_MISMATCH', 'Session is not bound to this audio ID', 401);
      case 'OUT_OF_SEQUENCE':
        return toErrorResponse('OUT_OF_SEQUENCE', `Expected chunk ${result.expected}, got ${n}`, 400);
      case 'INVALID_CHUNK_INDEX':
        return toErrorResponse('INVALID_CHUNK_INDEX', 'Chunk index is out of range', 400);
      default:
        return toErrorResponse('INVALID_SESSION', 'Session validation failed', 401);
    }
  }

  // Fetch the chunk from R2
  let chunkStream: ReadableStream;
  try {
    chunkStream = await getChunk(audioId, n);
  } catch {
    return toErrorResponse('CHUNK_NOT_FOUND', 'Chunk not found in storage', 404);
  }

  const codec = result.codec ?? 'application/octet-stream';
  const isLast = result.is_last === true;

  // Trigger async cleanup if this is the last chunk
  if (isLast) {
    waitUntil(cleanupAudio(audioId));
  }

  return new Response(chunkStream, {
    status: 200,
    headers: {
      'Content-Type': codec,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Chunk-Index': String(n),
      'Content-Disposition': 'inline',
    },
  });
}
