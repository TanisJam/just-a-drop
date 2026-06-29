"use client";

import Link from "next/link";

type StatusVariant = "consumed" | "expired";

interface StatusScreenProps {
  variant: StatusVariant;
}

const MESSAGES = {
  consumed: {
    icon: "🎧",
    title: "Ya fue escuchada",
    description: "Esta gota de voz ya fue escuchada. Los audios de JustADrop solo se pueden escuchar una vez.",
  },
  expired: {
    icon: "⏳",
    title: "Expiró",
    description: "Esta gota de voz expiró. Los audios de JustADrop se eliminan a las 24h si nadie los escucha.",
  },
} as const;

export function StatusScreen({ variant }: StatusScreenProps) {
  const { icon, title, description } = MESSAGES[variant];

  return (
    <div className="status-screen">
      <div className="status-screen__icon" aria-hidden="true">{icon}</div>
      <h1 className="status-screen__title">{title}</h1>
      <p className="status-screen__description">{description}</p>
      <Link href="/" className="btn btn--primary status-screen__link">
        Grabar una nueva gota
      </Link>
    </div>
  );
}
