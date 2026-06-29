import redis from './redis';
import { deleteChunk, listChunks } from './storage';

const RETRY_DELAY_MS = 500;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deleteChunkWithRetry(
  audioId: string,
  key: string,
): Promise<void> {
  // Key format: "${audioId}/${chunkIndex}"
  const chunkIndexStr = key.split('/')[1];
  const chunkIndex = parseInt(chunkIndexStr, 10);

  try {
    await deleteChunk(audioId, chunkIndex);
  } catch (err) {
    console.error(
      `[cleanup] Failed to delete chunk ${key}, retrying in ${RETRY_DELAY_MS}ms:`,
      err,
    );
    await sleep(RETRY_DELAY_MS);
    try {
      await deleteChunk(audioId, chunkIndex);
    } catch (retryErr) {
      console.error(
        `[cleanup] Retry failed for chunk ${key} (audioId=${audioId}):`,
        retryErr,
      );
    }
  }
}

export async function cleanupAudio(audioId: string): Promise<void> {
  try {
    // 1. List all R2 objects under this audioId prefix
    let keys: string[];
    try {
      keys = await listChunks(audioId);
    } catch (err) {
      console.error(`[cleanup] Failed to list chunks for audioId=${audioId}:`, err);
      keys = [];
    }

    // 2. Delete each R2 object with one retry on failure
    await Promise.all(
      keys.map((key) => deleteChunkWithRetry(audioId, key)),
    );

    // 3. Fetch session keys from the sessions set
    let sessionKeys: string[];
    try {
      sessionKeys = await redis.smembers<string[]>(
        `audio:${audioId}:sessions`,
      );
    } catch (err) {
      console.error(
        `[cleanup] Failed to fetch session keys for audioId=${audioId}:`,
        err,
      );
      sessionKeys = [];
    }

    // 4. Delete all Redis keys
    const keysToDelete: string[] = [
      `audio:${audioId}`,
      `audio:${audioId}:chunks`,
      `audio:${audioId}:sessions`,
      ...sessionKeys,
    ];

    try {
      if (keysToDelete.length > 0) {
        await redis.del(...keysToDelete);
      }
    } catch (err) {
      console.error(
        `[cleanup] Failed to delete Redis keys for audioId=${audioId}:`,
        err,
      );
    }

    // 5. Remove audioId from the prefix-index set
    try {
      await redis.srem('cleanup:prefix-index', audioId);
    } catch (err) {
      console.error(
        `[cleanup] Failed to remove audioId=${audioId} from prefix-index:`,
        err,
      );
    }
  } catch (err) {
    // Top-level catch: never surface errors to callers
    console.error(`[cleanup] Unexpected error for audioId=${audioId}:`, err);
  }
}
