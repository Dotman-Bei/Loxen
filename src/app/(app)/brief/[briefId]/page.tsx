import type { Metadata } from "next";
import { BriefDetail } from "@/components/app/BriefDetail";

export const metadata: Metadata = { title: "Brief" };

export default async function BriefPage({ params }: { params: Promise<{ briefId: string }> }) {
  const { briefId } = await params;
  return <BriefDetail id={decodeURIComponent(briefId).slice(0, 64)} />;
}
