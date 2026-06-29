export interface CreateAudioParams {
  chunk_count: number;
  duration_ms: number;
  codec: string;
}

export interface CreateAudioResponse {
  audio_id: string;
  upload_token: string;
  expires_at: string;
}

export interface AudioMeta {
  audio_id: string;
  status: 'pending' | 'consumed' | 'expired';
  duration_ms: number;
  chunk_count: number;
  expires_at: string;
}

export interface PlayResponse {
  session_token: string;
  expires_at: string;
  chunk_count: number;
}

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function parseErrorResponse(response: Response): Promise<ApiClientError> {
  let code = 'UNKNOWN_ERROR';
  let message = `HTTP ${response.status}`;
  try {
    const body = (await response.json()) as { error?: { code?: string; message?: string } };
    if (body.error?.code) code = body.error.code;
    if (body.error?.message) message = body.error.message;
  } catch {
    // Non-JSON error body — use defaults
  }
  return new ApiClientError(code, message, response.status);
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number,
  delayMs: number,
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok && response.status >= 500 && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs);
    }
    return response;
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs);
    }
    throw err;
  }
}

export const api = {
  async createAudio(params: CreateAudioParams): Promise<CreateAudioResponse> {
    const response = await fetch('/api/audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    return response.json() as Promise<CreateAudioResponse>;
  },

  async uploadChunk(
    audioId: string,
    index: number,
    blob: Blob,
    token: string,
  ): Promise<void> {
    const formData = new FormData();
    formData.append('chunk_index', String(index));
    formData.append('chunk_data', blob);
    formData.append('upload_token', token);

    const response = await fetchWithRetry(
      `/api/audio/${audioId}/chunks`,
      { method: 'POST', body: formData },
      1,
      1000,
    );

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }
  },

  async getAudioMeta(audioId: string): Promise<AudioMeta> {
    const response = await fetch(`/api/audio/${audioId}`, {
      headers: { 'Cache-Control': 'no-store' },
    });

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    return response.json() as Promise<AudioMeta>;
  },

  async play(audioId: string): Promise<PlayResponse> {
    const response = await fetch(`/api/audio/${audioId}/play`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    return response.json() as Promise<PlayResponse>;
  },

  async fetchChunk(
    audioId: string,
    index: number,
    sessionToken: string,
  ): Promise<ArrayBuffer> {
    const response = await fetchWithRetry(
      `/api/audio/${audioId}/chunk/${index}`,
      {
        headers: { Authorization: `Bearer ${sessionToken}` },
      },
      1,
      500,
    );

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    return response.arrayBuffer();
  },
};
