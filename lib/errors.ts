import { NextResponse } from 'next/server';

export type ErrorCode =
  | 'INVALID_PAYLOAD'
  | 'DURATION_EXCEEDED'
  | 'CHUNK_COUNT_EXCEEDED'
  | 'INVALID_CHUNK_INDEX'
  | 'INVALID_UPLOAD_TOKEN'
  | 'AUDIO_NOT_FOUND'
  | 'CHUNK_ALREADY_UPLOADED'
  | 'CHUNK_TOO_LARGE'
  | 'ALREADY_CONSUMED'
  | 'EXPIRED'
  | 'INVALID_SESSION'
  | 'SESSION_AUDIO_MISMATCH'
  | 'OUT_OF_SEQUENCE'
  | 'CHUNK_NOT_FOUND'
  | 'UNAUTHORIZED';

export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function toErrorResponse(
  code: ErrorCode,
  message: string,
  status: number,
): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
