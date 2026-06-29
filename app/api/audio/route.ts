import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import redis from '@/lib/redis';
import { generateAudioId } from '@/lib/id';
import { createUploadToken } from '@/lib/session';
import { toErrorResponse } from '@/lib/errors';
import { CreateAudioSchema } from '@/lib/validators';
import { AUDIO_TTL_SECONDS } from '@/lib/constants';

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return toErrorResponse('INVALID_PAYLOAD', 'Invalid JSON body', 400);
  }

  let parsed: { chunk_count: number; duration_ms: number; codec: string };
  try {
    parsed = CreateAudioSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const issue = err.issues[0];
      // Distinguish duration vs chunk_count vs other payload errors
      if (issue?.path[0] === 'duration_ms') {
        return toErrorResponse('DURATION_EXCEEDED', 'duration_ms exceeds maximum allowed value', 422);
      }
      if (issue?.path[0] === 'chunk_count') {
        // chunk_count: 0 is INVALID_PAYLOAD; chunk_count > 720 is CHUNK_COUNT_EXCEEDED
        const val = typeof body === 'object' && body !== null && 'chunk_count' in body
          ? (body as Record<string, unknown>).chunk_count
          : undefined;
        if (typeof val === 'number' && val > 720) {
          return toErrorResponse('CHUNK_COUNT_EXCEEDED', 'chunk_count exceeds maximum allowed value', 422);
        }
        return toErrorResponse('INVALID_PAYLOAD', issue.message, 400);
      }
      return toErrorResponse('INVALID_PAYLOAD', issue?.message ?? 'Invalid payload', 400);
    }
    return toErrorResponse('INVALID_PAYLOAD', 'Invalid payload', 400);
  }

  const { chunk_count, duration_ms, codec } = parsed;

  const audioId = generateAudioId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + AUDIO_TTL_SECONDS * 1000);

  const uploadToken = await createUploadToken(audioId);

  const pipeline = redis.pipeline();
  pipeline.hset(`audio:${audioId}`, {
    id: audioId,
    status: 'pending',
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    chunk_count: String(chunk_count),
    chunks_uploaded: '0',
    duration_ms: String(duration_ms),
    codec,
  });
  pipeline.expire(`audio:${audioId}`, AUDIO_TTL_SECONDS);
  pipeline.sadd('cleanup:prefix-index', audioId);
  pipeline.expire('cleanup:prefix-index', AUDIO_TTL_SECONDS);
  await pipeline.exec();

  return NextResponse.json(
    {
      audio_id: audioId,
      upload_token: uploadToken,
      expires_at: expiresAt.toISOString(),
    },
    {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
