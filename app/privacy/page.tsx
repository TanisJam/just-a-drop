import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy · JustADrop",
  description: "How JustADrop handles your voice: the minimum, and briefly.",
};

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}
