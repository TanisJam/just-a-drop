"use client";

import { useState, useCallback } from "react";

interface CopyLinkProps {
  url: string;
}

export function CopyLink({ url }: CopyLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text in the field
    }
  }, [url]);

  return (
    <div className="copy-link">
      <div className="copy-link-field" aria-label="URL para compartir">
        <span className="copy-link-field__url">{url}</span>
      </div>
      <button
        className={`btn btn--secondary copy-link__btn${copied ? " copy-link__btn--copied" : ""}`}
        onClick={handleCopy}
        type="button"
        aria-label={copied ? "¡Copiado!" : "Copiar enlace"}
      >
        {copied ? (
          <>
            {/* Check icon */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <polyline points="2,8 6,12 14,4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            ¡Copiado!
          </>
        ) : (
          <>
            {/* Copy icon */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 11V3a1 1 0 0 1 1-1h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Copiar enlace
          </>
        )}
      </button>
    </div>
  );
}
