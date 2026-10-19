import { ExternalLink } from "lucide-react";
import { addressUrl, chainById, txUrl } from "@/lib/chains";
import { shortHex } from "@/lib/digest";

/** A hash or address, linked to its chain's explorer when that chain has one. */
export function ExplorerLink({
  kind,
  value,
  chainId,
  label,
}: {
  kind: "tx" | "address";
  value: string;
  chainId?: number;
  label?: string;
}) {
  const chain = chainById(chainId);
  const url = kind === "tx" ? txUrl(value, chain) : addressUrl(value, chain);
  const text = label ?? <code>{shortHex(value)}</code>;
  if (!url) return <span className="inline-copy">{text}</span>;
  return (
    <a href={url} rel="noopener noreferrer" target="_blank" className="inline-copy" title={`Open on ${chain.name} explorer`}>
      {text} <ExternalLink size={12} aria-hidden="true" />
    </a>
  );
}
