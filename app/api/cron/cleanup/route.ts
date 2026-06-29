import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { cleanupAudio } from '@/lib/cleanup';
import { deleteChunk, listChunks } from '@/lib/storage';
import { toErrorResponse } from '@/lib/errors';

const RETRY_DELAY_MS = 500;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deleteWithRetry(audioId: string, key: string): Promise<void> {
  const chunkIndexStr = key.split('/')[1];
  const chunkIndex = parseInt(chunkIndexStr, 10);
  try {
    await deleteChunk(audioId, chunkIndex);
  } catch {
    await sleep(RETRY_DELAY_MS);
    await deleteChunk(audioId, chunkIndex);
  }
}

export async function POST(request: Request): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!authHeader || !cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return toErrorResponse('UNAUTHORIZED', 'Missing or invalid CRON_SECRET', 401);
  }

  // Get all tracked audio IDs
  let audioIds: string[];
  try {
    audioIds = await redis.smembers<string[]>('cleanup:prefix-index');
  } catch (err) {
    console.error('[cron/cleanup] Failed to read cleanup:prefix-index:', err);
    return NextResponse.json({ cleaned: 0, failed: 0, skipped: 0 }, { status: 200 });
  }

  let cleaned = 0;
  let failed = 0;
  let skipped = 0;

  for (const audioId of audioIds) {
    try {
      const record = await redis.hgetall<Record<string, string>>(`audio:${audioId}`);

      if (!record || Object.keys(record).length === 0) {
        // Redis key is gone (TTL expired) — orphaned R2 objects may remain
        const keys = await listChunks(audioId);
        if (keys.length > 0) {
          await Promise.all(keys.map((key) => deleteWithRetry(audioId, key)));
        }
        await redis.srem('cleanup:prefix-index', audioId);
        cleaned++;
        continue;
      }

      const status = record.status;
      const chunksUploaded = parseInt(record.chunks_uploaded ?? '0', 10);
      const chunkCount = parseInt(record.chunk_count ?? '0', 10);

      if (status === 'consumed' && chunksUploaded >= chunkCount) {
        // Missed cleanup (waitUntil may have timed out) — clean up now
        await cleanupAudio(audioId);
        cleaned++;
        continue;
      }

      // Still pending or in progress — skip
      skipped++;
    } catch (err) {
      console.error(`[cron/cleanup] Error processing audioId=${audioId}:`, err);
      failed++;
      // Still attempt to remove from index to avoid repeated failures
      try {
        await redis.srem('cleanup:prefix-index', audioId);
      } catch {
        // Ignore secondary error
      }
    }
  }

  return NextResponse.json(
    { cleaned, failed, skipped },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
