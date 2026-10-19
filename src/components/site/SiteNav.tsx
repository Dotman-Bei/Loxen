import Link from "next/link";
import { TagMark } from "./TagMark";

export function SiteNav({ current }: { current?: string }) {
  const links = [
    { href: "/registry", label: "Registry" },
    { href: "/history", label: "History" },
    { href: "/methodology", label: "Methodology" },
  ];
  return (
    <header className="site-nav">
      <Link href="/" className="wordmark" aria-label="Loxen, home">
        <TagMark size={18} />
        <span>Loxen</span>
      </Link>
      <nav aria-label="Main">
        <ul>
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="link" aria-current={current === l.href ? "page" : undefined}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Link href="/workbench" className="btn btn-sm">
        Open the workbench
      </Link>
    </header>
  );
}
