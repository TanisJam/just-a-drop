"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

interface ShareButtonProps {
  url: string;
}

export function ShareButton({ url }: ShareButtonProps) {
  const { t } = useI18n();
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

  if (!canShare) return null;

  async function handleShare() {
    try {
      await navigator.share({
        title: t.common.appName,
        text: t.share.text,
        url,
      });
    } catch {
      // User cancelled share or API not available
    }
  }

  return (
    <button
      className="btn btn--share"
      onClick={handleShare}
      type="button"
      aria-label={t.share.aria}
    >
      {/* Share icon */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="14" cy="3" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="14" cy="15" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="4" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
        <line x1="6" y1="8" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6" y1="10" x2="12" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {t.share.share}
    </button>
  );
}
