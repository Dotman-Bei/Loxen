import Link from "next/link";
import { CREDITS } from "@/lib/credits";
import { BOT_MAINNET, BOT_WEBSITE } from "@/lib/chains";

const LETTERS = [
  { ch: "L", h: 100 },
  { ch: "O", h: 74 },
  { ch: "X", h: 88 },
  { ch: "E", h: 62 },
  { ch: "N", h: 94 },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-mark" role="img" aria-label="Loxen">
        {LETTERS.map((l) => (
          <span key={l.ch} className="footer-block tag-px" style={{ height: `${l.h}%` }}>
            <svg className="footer-letter" aria-hidden="true">
              <text x="50%" y="100%" textAnchor="middle">{l.ch}</text>
            </svg>
          </span>
        ))}
      </div>

      <div className="footer-cols">
        <div>
          <h3>Product</h3>
          <ul>
            <li><Link className="link" href="/workbench">Workbench</Link></li>
            <li><Link className="link" href="/registry">Registry</Link></li>
            <li><Link className="link" href="/history">History</Link></li>
            <li><Link className="link" href="/profile">Profile</Link></li>
          </ul>
        </div>
        <div>
          <h3>Method</h3>
          <ul>
            <li><Link className="link" href="/methodology">Methodology</Link></li>
            <li><Link className="link" href="/privacy">Privacy</Link></li>
            <li><Link className="link" href="/terms">Terms</Link></li>
          </ul>
        </div>
        <div>
          <h3>BOT Chain</h3>
          <ul>
            <li><a className="link" href={BOT_WEBSITE} rel="noopener">Official website</a></li>
            <li><a className="link" href={BOT_MAINNET.explorer} rel="noopener">BOT Chain Explorer</a></li>
            <li><a className="link" href="https://dev-docs.botchain.ai/docs/Developers/quick-guide/" rel="noopener">Developer docs</a></li>
          </ul>
        </div>
        <div className="footer-chain">
          <p>BOT Chain mainnet, chain ID {BOT_MAINNET.id}</p>
        </div>
      </div>

      <div className="footer-credits">
        <h3>Pictures</h3>
        <ul>
          {CREDITS.map((c) => (
            <li key={c.key}>
              <a className="link" href={c.page} rel="noopener">{c.line}</a>
            </li>
          ))}
        </ul>
      </div>

      <div className="footer-last">
        <p>© 2026 Loxen. A research tool, not financial advice.</p>
        <Link href="/workbench" className="btn btn-sm">Open the workbench</Link>
      </div>
    </footer>
  );
}
