export const AUDIO_TTL_SECONDS = 86_400;
export const UPLOAD_TOKEN_TTL_SECONDS = 600;
export const MAX_DURATION_MS = 300_000;
export const MAX_CHUNK_COUNT = 720;
export const MAX_CHUNK_SIZE_BYTES = 1_048_576;
export const ID_LENGTH = 21;
export const TOKEN_LENGTH = 32;
export const CHUNK_DURATION_MS = parseInt(
  process.env.NEXT_PUBLIC_CHUNK_DURATION_MS || '2500',
  10,
);

export const ACCEPTED_CODECS = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
] as const;

export type AcceptedCodec = (typeof ACCEPTED_CODECS)[number];
