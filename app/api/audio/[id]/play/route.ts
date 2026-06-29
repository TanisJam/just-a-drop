import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { generateToken } from '@/lib/id';
import { calculateSessionTtl } from '@/lib/session';
import { toErrorResponse } from '@/lib/errors';
import { CONSUME_AUDIO_SCRIPT } from '@/lib/lua-scripts';
import { CHUNK_DURATION_MS } from '@/lib/constants';

interface ConsumeResult {
  ok?: boolean;
  error?: string;
  status?: string;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: audioId } = await params;

  // Fetch chunk_count and codec from Redis
  const audioRecord = await redis.hgetall<Record<string, string>>(`audio:${audioId}`);
  if (!audioRecord || !audioRecord.chunk_count) {
    return toErrorResponse('AUDIO_NOT_FOUND', 'Audio record not found or has expired', 404);
  }

  const chunkCount = parseInt(audioRecord.chunk_count, 10);
  const codec = audioRecord.codec ?? '';

  const sessionToken = generateToken();
  const sessionTtl = calculateSessionTtl(chunkCount, CHUNK_DURATION_MS);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sessionTtl * 1000);

  // Execute the atomic Lua script
  const rawResult = await redis.eval(
    CONSUME_AUDIO_SCRIPT,
    [`audio:${audioId}`],
    [sessionToken, String(sessionTtl), audioId, String(chunkCount), now.toISOString(), codec],
  );

  // Upstash REST SDK auto-deserializes cjson.encode() from Lua
  const result = (typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult) as ConsumeResult;

  if (result.error) {
    if (result.error === 'AUDIO_NOT_FOUND') {
      return toErrorResponse('AUDIO_NOT_FOUND', 'Audio record not found', 404);
    }
    if (result.error === 'ALREADY_CONSUMED') {
      const status = result.status;
      if (status === 'expired') {
        return toErrorResponse('EXPIRED', 'This audio has expired', 409);
      }
      return toErrorResponse('ALREADY_CONSUMED', 'This audio has already been consumed', 409);
    }
    return toErrorResponse('AUDIO_NOT_FOUND', 'Audio record not found', 404);
  }

  return NextResponse.json(
    {
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      chunk_count: chunkCount,
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
