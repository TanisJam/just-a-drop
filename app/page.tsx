"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRecorder } from "@/hooks/use-recorder";
import { RecordButton } from "@/components/record-button";
import { RecordingIndicator } from "@/components/recording-indicator";
import { setRecordingData } from "@/lib/recording-store";

export default function Home() {
  const router = useRouter();
  const { status, durationMs, blob, codec, start, stop, reset } = useRecorder();

  // When blob is ready, save to store and navigate to preview
  useEffect(() => {
    if (blob && codec && durationMs > 0) {
      setRecordingData({ blob, codec, durationMs });
      router.push("/preview");
    }
  }, [blob, codec, durationMs, router]);

  return (
    <main className="screen">
      <header className="header">
        <h1 className="header__logo">JustADrop</h1>
      </header>

      <div className="screen__content">
        <div className="screen__tagline">
          <h2 className="screen__title">Grabá una gota de voz</h2>
          <p className="screen__subtitle">Se escucha una sola vez</p>
        </div>

        {status === "denied" && (
          <div className="error-message" role="alert">
            <p>No se pudo acceder al micrófono. Verificá los permisos en tu navegador.</p>
            <button
              className="btn btn--ghost"
              onClick={reset}
              type="button"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {status === "unsupported" && (
          <div className="error-message" role="alert">
            <p>Tu navegador no soporta la grabación de audio. Probá con Chrome o Firefox.</p>
          </div>
        )}

        {(status === "idle" || status === "requesting" || status === "recording") && (
          <>
            <RecordButton
              status={status}
              onRecord={start}
              onStop={stop}
            />
            {status === "recording" && (
              <RecordingIndicator durationMs={durationMs} />
            )}
          </>
        )}
      </div>

      <footer className="footer">
        <nav className="footer__links" aria-label="Legal">
          <a href="/privacy" className="footer__link">Privacidad</a>
          <span className="footer__separator" aria-hidden="true">·</span>
          <a href="/terms" className="footer__link">Términos</a>
        </nav>
      </footer>
    </main>
  );
}
