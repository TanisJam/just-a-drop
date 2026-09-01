import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

export const R2_BUCKET = process.env.R2_BUCKET_NAME!;

// Endpoint resolution: default to Cloudflare R2, but allow overriding with any
// S3-compatible backend (e.g. self-hosted MinIO/Garage) via S3_ENDPOINT.
// Path-style addressing is required by most self-hosted backends behind a single
// hostname; virtual-hosted style (R2's default) is kept when S3_ENDPOINT is unset.
const endpoint =
  process.env.S3_ENDPOINT ||
  `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const s3 = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export { s3 };

export async function uploadChunk(
  audioId: string,
  chunkIndex: number,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: `${audioId}/${chunkIndex}`,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getChunk(
  audioId: string,
  chunkIndex: number,
): Promise<ReadableStream> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: `${audioId}/${chunkIndex}`,
    }),
  );

  if (!response.Body) {
    throw new Error(`Chunk ${audioId}/${chunkIndex} has no body`);
  }

  return response.Body.transformToWebStream();
}

export async function deleteChunk(
  audioId: string,
  chunkIndex: number,
): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: `${audioId}/${chunkIndex}`,
    }),
  );
}

export async function listChunks(audioId: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: `${audioId}/`,
        ContinuationToken: continuationToken,
      }),
    );

    for (const obj of response.Contents ?? []) {
      if (obj.Key) {
        keys.push(obj.Key);
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return keys;
}
