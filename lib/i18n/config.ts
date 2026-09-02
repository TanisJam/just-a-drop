export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_STORAGE_KEY = "justadrop-locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "es" || value === "en";
}

/** Best-effort locale from the browser. Defaults to Spanish. */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const lang = (navigator.language || "").toLowerCase();
  return lang.startsWith("en") ? "en" : "es";
}
