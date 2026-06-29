import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { cleanupAudio } from '@/lib/cleanup';
import { toErrorResponse } from '@/lib/errors';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: audioId } = await params;

  const record = await redis.hgetall<Record<string, string>>(`audio:${audioId}`);

  if (!record || Object.keys(record).length === 0) {
    return toErrorResponse('AUDIO_NOT_FOUND', 'Audio record not found or has expired', 404);
  }

  return NextResponse.json(
    {
      audio_id: record.id,
      status: record.status,
      duration_ms: parseInt(record.duration_ms, 10),
      chunk_count: parseInt(record.chunk_count, 10),
      expires_at: record.expires_at,
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    },
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  const expectedSecret = process.env.INTERNAL_CLEANUP_SECRET;

  if (!authHeader || !expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return toErrorResponse('UNAUTHORIZED', 'Missing or invalid internal secret', 401);
  }

  const { id: audioId } = await params;

  await cleanupAudio(audioId);

  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
}
