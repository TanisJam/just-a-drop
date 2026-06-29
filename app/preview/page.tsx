"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUpload } from "@/hooks/use-upload";
import { AudioPreview } from "@/components/audio-preview";
import { UploadProgress } from "@/components/upload-progress";
import { getRecordingData, clearRecordingData } from "@/lib/recording-store";

export default function PreviewPage() {
  const router = useRouter();
  const recording = getRecordingData();

  const { status, progress, audioId, error, start } = useUpload({
    blob: recording?.blob ?? null,
    codec: recording?.codec ?? null,
    durationMs: recording?.durationMs ?? 0,
  });

  // Redirect if no recording data
  useEffect(() => {
    if (!recording) {
      router.replace("/");
    }
  }, [recording, router]);

  // Navigate to shared page when upload is done
  useEffect(() => {
    if (status === "done" && audioId) {
      clearRecordingData();
      router.push(`/shared?id=${audioId}`);
    }
  }, [status, audioId, router]);

  if (!recording) {
    return null;
  }

  const isUploading = status === "chunking" || status === "uploading";

  return (
    <main className="screen">
      <header className="header">
        <h1 className="header__logo">JustADrop</h1>
      </header>

      <div className="screen__content">
        <h2 className="screen__title">Escuchá antes de enviar</h2>
        <p className="screen__subtitle">Una vez creada la gota, no se puede modificar</p>

        <div className="card">
          <AudioPreview blob={recording.blob} />
        </div>

        {error && (
          <div className="error-message" role="alert">
            <p>Error al subir: {error}</p>
          </div>
        )}

        {isUploading ? (
          <UploadProgress progress={progress} />
        ) : (
          <div className="preview__actions">
            <button
              className="btn btn--secondary"
              onClick={() => {
                clearRecordingData();
                router.push("/");
              }}
              type="button"
              disabled={isUploading}
            >
              Regrabar
            </button>
            <button
              className="btn btn--primary"
              onClick={start}
              type="button"
              disabled={isUploading}
            >
              Crear gota
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
