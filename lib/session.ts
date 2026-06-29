import redis from './redis';
import { generateToken } from './id';
import { UPLOAD_TOKEN_TTL_SECONDS } from './constants';

export async function createUploadToken(audioId: string): Promise<string> {
  const token = generateToken();
  await redis.set(`upload:${token}`, audioId, {
    ex: UPLOAD_TOKEN_TTL_SECONDS,
  });
  return token;
}

export async function validateUploadToken(
  token: string,
): Promise<string | null> {
  const audioId = await redis.get<string>(`upload:${token}`);
  return audioId ?? null;
}

export function calculateSessionTtl(
  chunkCount: number,
  chunkDurationMs: number,
): number {
  return Math.ceil((chunkCount * chunkDurationMs) / 1000) + 60;
}
