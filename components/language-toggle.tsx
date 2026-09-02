"use client";

import { LOCALES } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="lang-toggle" role="group" aria-label={t.common.langLabel}>
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          className={`lang-toggle__btn${
            code === locale ? " lang-toggle__btn--active" : ""
          }`}
          aria-pressed={code === locale}
          onClick={() => setLocale(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
