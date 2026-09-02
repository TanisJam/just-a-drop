"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRecorder } from "@/hooks/use-recorder";
import { RecordButton } from "@/components/record-button";
import { RecordingIndicator } from "@/components/recording-indicator";
import { Fringe } from "@/components/fringe";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/lib/i18n/context";
import { setRecordingData } from "@/lib/recording-store";

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();
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
        {status === "denied" && (
          <div className="error-message" role="alert">
            <p>{t.home.micDenied}</p>
            <button
              className="btn btn--ghost"
              onClick={reset}
              type="button"
            >
              {t.home.tryAgain}
            </button>
          </div>
        )}

        {status === "unsupported" && (
          <div className="error-message" role="alert">
            <p>{t.home.unsupported}</p>
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

        <div className="screen__tagline">
          <h2 className="screen__title">{t.home.title}</h2>
          <p className="screen__subtitle">{t.home.subtitle}</p>
        </div>

        <Fringe />
      </div>

      <footer className="footer">
        <nav className="footer__links" aria-label="Legal">
          <a href="/privacy" className="footer__link">{t.common.privacy}</a>
          <span className="footer__separator" aria-hidden="true">·</span>
          <a href="/terms" className="footer__link">{t.common.terms}</a>
        </nav>
        <div className="footer__lang">
          <LanguageToggle />
        </div>
      </footer>
    </main>
  );
}
