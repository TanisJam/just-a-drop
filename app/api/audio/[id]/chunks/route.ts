import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { validateUploadToken } from '@/lib/session';
import { uploadChunk } from '@/lib/storage';
import { toErrorResponse } from '@/lib/errors';
import { MAX_CHUNK_SIZE_BYTES } from '@/lib/constants';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: audioId } = await params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return toErrorResponse('INVALID_PAYLOAD', 'Expected multipart/form-data', 400);
  }

  const uploadTokenRaw = formData.get('upload_token');
  const chunkIndexRaw = formData.get('chunk_index');
  const chunkDataRaw = formData.get('chunk_data');

  if (typeof uploadTokenRaw !== 'string' || !uploadTokenRaw) {
    return toErrorResponse('INVALID_UPLOAD_TOKEN', 'upload_token is required', 401);
  }

  // Validate upload token
  const tokenAudioId = await validateUploadToken(uploadTokenRaw);
  if (!tokenAudioId || tokenAudioId !== audioId) {
    return toErrorResponse('INVALID_UPLOAD_TOKEN', 'Invalid or expired upload token', 401);
  }

  // Fetch the audio record to get chunk_count and codec
  const audioRecord = await redis.hgetall<Record<string, string>>(`audio:${audioId}`);
  if (!audioRecord || !audioRecord.chunk_count) {
    return toErrorResponse('AUDIO_NOT_FOUND', 'Audio record not found', 404);
  }

  const chunkCount = parseInt(audioRecord.chunk_count, 10);

  // Validate chunk_index
  const chunkIndexStr = typeof chunkIndexRaw === 'string' ? chunkIndexRaw : String(chunkIndexRaw);
  const chunkIndex = parseInt(chunkIndexStr, 10);
  if (isNaN(chunkIndex) || chunkIndex < 0 || chunkIndex >= chunkCount) {
    return toErrorResponse('INVALID_CHUNK_INDEX', `chunk_index must be between 0 and ${chunkCount - 1}`, 400);
  }

  // Validate chunk_data
  if (!(chunkDataRaw instanceof Blob)) {
    return toErrorResponse('INVALID_PAYLOAD', 'chunk_data must be a binary blob', 400);
  }

  if (chunkDataRaw.size > MAX_CHUNK_SIZE_BYTES) {
    return toErrorResponse('CHUNK_TOO_LARGE', `chunk_data exceeds maximum size of ${MAX_CHUNK_SIZE_BYTES} bytes`, 413);
  }

  // Check for duplicate chunk
  const alreadyExists = await redis.hexists(`audio:${audioId}:chunks`, String(chunkIndex));
  if (alreadyExists) {
    return toErrorResponse('CHUNK_ALREADY_UPLOADED', 'Chunk at this index has already been uploaded', 409);
  }

  // Upload to R2
  const buffer = Buffer.from(await chunkDataRaw.arrayBuffer());
  const codec = audioRecord.codec ?? 'application/octet-stream';
  await uploadChunk(audioId, chunkIndex, buffer, codec);

  // Record in Redis and increment counter
  const chunkMeta = JSON.stringify({
    storage_key: `${audioId}/${chunkIndex}`,
    size_bytes: chunkDataRaw.size,
  });

  const pipeline = redis.pipeline();
  pipeline.hset(`audio:${audioId}:chunks`, { [String(chunkIndex)]: chunkMeta });
  pipeline.hincrby(`audio:${audioId}`, 'chunks_uploaded', 1);
  // Re-apply TTL to chunks hash to match parent record
  pipeline.expire(`audio:${audioId}:chunks`, 86400);
  await pipeline.exec();

  return NextResponse.json(
    { chunk_index: chunkIndex, stored: true },
    {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
