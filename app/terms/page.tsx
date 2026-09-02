import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms · JustADrop",
  description: "The rules for using JustADrop: simple, ephemeral, and on you.",
};

export default function TermsPage() {
  return <LegalPage kind="terms" />;
}
