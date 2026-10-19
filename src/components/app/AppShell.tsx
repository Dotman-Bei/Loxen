"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FilePen, History, Stamp, Wallet } from "lucide-react";
import { TagMark } from "@/components/site/TagMark";

const NAV = [
  { href: "/workbench", label: "Workbench", Icon: FilePen },
  { href: "/registry", label: "Registry", Icon: Stamp },
  { href: "/history", label: "History", Icon: History },
  { href: "/profile", label: "Profile", Icon: Wallet },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const active = (href: string) => path === href || (href === "/workbench" && path.startsWith("/brief/"));
  return (
    <div className="app">
      <nav className="rail" aria-label="Loxen">
        <Link href="/" className="rail-mark" aria-label="Loxen home">
          <TagMark size={20} />
        </Link>
        <ul className="rail-list">
          {NAV.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link href={href} className="rail-item" aria-current={active(href) ? "page" : undefined}>
                <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                <span className="rail-label">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/methodology"
          className="rail-item rail-bottom"
          aria-current={path === "/methodology" ? "page" : undefined}
        >
          <BookOpen size={18} strokeWidth={1.5} aria-hidden="true" />
          <span className="rail-label">Method</span>
        </Link>
      </nav>
      <main className="canvas">{children}</main>
    </div>
  );
}
