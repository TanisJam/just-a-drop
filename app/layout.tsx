import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JustADrop",
  description: "Share audio, just for a moment.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
