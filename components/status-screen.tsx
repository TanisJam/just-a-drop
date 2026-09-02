"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

type StatusVariant = "consumed" | "expired";

interface StatusScreenProps {
  variant: StatusVariant;
}

const ICONS: Record<StatusVariant, React.ReactNode> = {
  // Checkmark inside a drop — "already listened"
  consumed: (
    <svg viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path
        d="M22 4C22 4 9 18 9 27a13 13 0 0 0 26 0c0-9-13-23-13-23Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 27.5l4 4 8-8.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  // Clock — "expired"
  expired: (
    <svg viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="22" cy="24" r="15" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M22 16v8l5 4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 6h14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export function StatusScreen({ variant }: StatusScreenProps) {
  const { t } = useI18n();
  const title = variant === "consumed" ? t.status.consumedTitle : t.status.expiredTitle;
  const description =
    variant === "consumed" ? t.status.consumedDesc : t.status.expiredDesc;

  return (
    <div className="status-screen">
      <div className="status-screen__icon" aria-hidden="true">{ICONS[variant]}</div>
      <h1 className="status-screen__title">{title}</h1>
      <p className="status-screen__description">{description}</p>
      <Link href="/" className="btn btn--primary status-screen__link">
        {t.status.newDrop}
      </Link>
    </div>
  );
}
