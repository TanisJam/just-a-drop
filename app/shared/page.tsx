"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DropAnimation } from "@/components/drop-animation";
import { CopyLink } from "@/components/copy-link";
import { ShareButton } from "@/components/share-button";
import { useI18n } from "@/lib/i18n/context";

function SharedPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const audioId = searchParams.get("id");

  const [shareableUrl, setShareableUrl] = useState<string>("");

  useEffect(() => {
    if (!audioId) {
      router.replace("/");
      return;
    }
    setShareableUrl(`${window.location.origin}/a/${audioId}`);
  }, [audioId, router]);

  if (!audioId || !shareableUrl) {
    return null;
  }

  return (
    <>
      <div className="screen__content">
        <DropAnimation />

        <h2 className="screen__title">{t.shared.ready}</h2>
        <p className="screen__subtitle">{t.shared.expiresNote}</p>

        <div className="card">
          <CopyLink url={shareableUrl} />
          <ShareButton url={shareableUrl} />
        </div>
      </div>

      <footer className="footer">
        <Link href="/" className="footer__link">
          {t.shared.recordAnother}
        </Link>
      </footer>
    </>
  );
}

export default function SharedPage() {
  return (
    <main className="screen">
      <header className="header">
        <h1 className="header__logo">JustADrop</h1>
      </header>

      <Suspense>
        <SharedPageContent />
      </Suspense>
    </main>
  );
}
