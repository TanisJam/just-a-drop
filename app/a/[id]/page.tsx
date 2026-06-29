import type { Metadata } from "next";
import { ListenClient } from "./listen-client";

interface ListenPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ListenPage({ params }: ListenPageProps) {
  const { id } = await params;
  return <ListenClient audioId={id} />;
}
