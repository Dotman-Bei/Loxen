import { NextResponse, type NextRequest } from "next/server";
import { isAddress } from "viem";
import { fetchEvidence } from "@/server/providers";
import type { ProviderNetwork } from "@/server/providers/types";
import { createLimiter } from "@/server/rateLimit";

export const dynamic = "force-dynamic";

const limiter = createLimiter(20, 60_000); // 20 lookups per minute per client
const NETWORKS: ProviderNetwork[] = ["botchain", "bohr"];

function clientKey(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/** GET /api/evidence?address=0x…&network=bohr — provider records for one contract on BOT Chain. */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") ?? "";
  const network = req.nextUrl.searchParams.get("network") ?? "";

  if (!isAddress(address, { strict: false })) {
    return NextResponse.json({ error: "address must be 0x followed by 40 hexadecimal characters" }, { status: 400 });
  }
  if (!NETWORKS.includes(network as ProviderNetwork)) {
    return NextResponse.json({ error: "network must be botchain (677) or bohr (968)" }, { status: 400 });
  }
  const gate = limiter(clientKey(req));
  if (!gate.ok) {
    return NextResponse.json(
      { error: `Too many lookups. Try again in ${gate.retryAfterS} s.` },
      { status: 429, headers: { "retry-after": String(gate.retryAfterS) } },
    );
  }

  const result = await fetchEvidence(address as `0x${string}`, network as ProviderNetwork);
  return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
}
