import { ACCEPTED_CODECS } from '@/lib/constants';

export interface RecorderError {
  type: 'PERMISSION_DENIED' | 'NOT_SUPPORTED' | 'NO_CODEC' | 'RECORDING_FAILED';
  message: string;
}

export interface RecorderConfig {
  maxDurationMs: number;
  onDurationUpdate: (ms: number) => void;
  onComplete: (blob: Blob, codec: string) => void;
  onError: (error: RecorderError) => void;
}

export function createRecorder(config: RecorderConfig): {
  start: () => Promise<void>;
  stop: () => void;
  destroy: () => void;
} {
  let mediaRecorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: BlobEvent['data'][] = [];
  let selectedCodec: string | null = null;
  let durationIntervalId: ReturnType<typeof setInterval> | null = null;
  let autoStopTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let elapsedMs = 0;

  function clearTimers() {
    if (durationIntervalId !== null) {
      clearInterval(durationIntervalId);
      durationIntervalId = null;
    }
    if (autoStopTimeoutId !== null) {
      clearTimeout(autoStopTimeoutId);
      autoStopTimeoutId = null;
    }
  }

  function stopTracks() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  }

  async function start(): Promise<void> {
    if (typeof MediaRecorder === 'undefined') {
      config.onError({ type: 'NOT_SUPPORTED', message: 'MediaRecorder is not supported in this browser.' });
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      config.onError({ type: 'NOT_SUPPORTED', message: 'getUserMedia is not supported in this browser.' });
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      config.onError({ type: 'PERMISSION_DENIED', message: 'Microphone permission was denied.' });
      return;
    }

    const codec = ACCEPTED_CODECS.find((c) => MediaRecorder.isTypeSupported(c));
    if (!codec) {
      stopTracks();
      config.onError({ type: 'NO_CODEC', message: 'No supported audio codec was found for recording.' });
      return;
    }
    selectedCodec = codec;
    chunks = [];
    elapsedMs = 0;

    mediaRecorder = new MediaRecorder(stream, { mimeType: selectedCodec });

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      clearTimers();
      stopTracks();
      if (chunks.length > 0 && selectedCodec) {
        const blob = new Blob(chunks, { type: selectedCodec });
        config.onComplete(blob, selectedCodec);
      }
      chunks = [];
    };

    mediaRecorder.onerror = () => {
      clearTimers();
      stopTracks();
      config.onError({ type: 'RECORDING_FAILED', message: 'An error occurred during recording.' });
    };

    mediaRecorder.start();

    durationIntervalId = setInterval(() => {
      elapsedMs += 1000;
      config.onDurationUpdate(elapsedMs);
    }, 1000);

    autoStopTimeoutId = setTimeout(() => {
      stop();
    }, config.maxDurationMs);
  }

  function stop(): void {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  function destroy(): void {
    clearTimers();
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    mediaRecorder = null;
    stopTracks();
    chunks = [];
    selectedCodec = null;
  }

  return { start, stop, destroy };
}
