import { ExternalLink } from "lucide-react";
import { addressUrl, txUrl } from "@/lib/chains";
import { shortHex } from "@/lib/digest";
import type { ReceiptRow } from "@/lib/registry";
import { CopyButton } from "./CopyButton";

const fmt = (sec: number) =>
  new Date(sec * 1000).toLocaleString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Receipt rows as read from BOT Chain. Columns stay even when there are no rows. */
export function ReceiptTable({ rows, empty }: { rows: ReceiptRow[]; empty: React.ReactNode }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Receipt</th>
            <th>Owner</th>
            <th>Digest</th>
            <th>Schema</th>
            <th className="num">Block</th>
            <th className="num">Time</th>
            <th>Transaction</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="is-missing">
              <td colSpan={7}>{empty}</td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.receiptId}>
                <td className="ident num-left">{r.receiptId}</td>
                <td>
                  <a href={addressUrl(r.owner)} rel="noopener" target="_blank"><code>{shortHex(r.owner)}</code></a>
                </td>
                <td className="m-line2">
                  <span className="inline-copy">
                    <code>{shortHex(r.digest, 8, 6)}</code>
                    <CopyButton value={r.digest} label="Copy digest" />
                  </span>
                </td>
                <td className="m-line2">loxen.brief/{r.schemaVersion}</td>
                <td className="num m-line2">{r.blockNumber != null ? r.blockNumber.toLocaleString("en-GB") : <span className="dash">—</span>}</td>
                <td className="num m-line2">{fmt(r.timestamp)}</td>
                <td className="m-line2">
                  {r.txHash ? (
                    <a href={txUrl(r.txHash)} rel="noopener" target="_blank" className="inline-copy">
                      <code>{shortHex(r.txHash)}</code> <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="dash">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
