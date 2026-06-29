import { z } from 'zod';
import {
  ACCEPTED_CODECS,
  MAX_CHUNK_COUNT,
  MAX_DURATION_MS,
} from './constants';

export const CreateAudioSchema = z
  .object({
    chunk_count: z
      .number()
      .int()
      .min(1)
      .max(MAX_CHUNK_COUNT),
    duration_ms: z
      .number()
      .int()
      .min(1)
      .max(MAX_DURATION_MS),
    codec: z.enum(ACCEPTED_CODECS),
  })
  .strict();

export const UploadChunkSchema = z
  .object({
    chunk_index: z.number().int().min(0),
    upload_token: z.string().min(1),
  })
  .strict();

export const AudioIdParamSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

export const ChunkIndexParamSchema = z
  .object({
    n: z
      .string()
      .min(1)
      .refine((val) => {
        const parsed = parseInt(val, 10);
        return !isNaN(parsed) && parsed >= 0;
      }, 'Must be a non-negative integer string'),
  })
  .strict();
