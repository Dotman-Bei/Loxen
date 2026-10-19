import { NextResponse } from "next/server";
import { providerHealth } from "@/server/providers";

export const dynamic = "force-dynamic";

/** GET /api/providers — last successful fetch and last error per enabled provider, since this server started. */
export async function GET() {
  return NextResponse.json({ providers: providerHealth(), since: "server start" }, { headers: { "cache-control": "no-store" } });
}
