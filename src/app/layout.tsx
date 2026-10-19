import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google"; // taste-skill-ignore: digests, hashes and addresses only
import "./globals.css";

// taste-skill-ignore: machine strings only
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400"], variable: "--font-mono", display: "swap" }); // taste-skill-ignore

export const metadata: Metadata = {
  title: { default: "Loxen · market briefs that show their gaps", template: "%s · Loxen" },
  description:
    "Loxen is a market-context workspace: frame one question, tag every value with its source, time and status, define what would invalidate your view, and optionally record a digest receipt on BOT Chain.",
};

export const viewport: Viewport = { themeColor: "#133621" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
