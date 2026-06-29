interface RecordingData {
  blob: Blob;
  codec: string;
  durationMs: number;
}

let recordingData: RecordingData | null = null;

export function setRecordingData(data: RecordingData): void {
  recordingData = data;
}

export function getRecordingData(): RecordingData | null {
  return recordingData;
}

export function clearRecordingData(): void {
  recordingData = null;
}
