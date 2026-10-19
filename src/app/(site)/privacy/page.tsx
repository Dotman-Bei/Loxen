import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/site/DocPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Loxen stores, where it is stored, what becomes public on BOT Chain, and how to delete it.",
};

const sections = [
  {
    id: "browser",
    title: "In this browser",
    body: (
      <>
        <p>
          Briefs you save are kept in this browser’s local storage under the key <code>loxen.briefs.v1</code>. That
          includes the question, asset, evidence, rules, notes and private notes. They do not leave your device unless you
          export them, or commit a receipt (which sends a digest, not the brief).
        </p>
        <p>Another browser, another device or a private window will not see them.</p>
      </>
    ),
  },
  {
    id: "servers",
    title: "On our servers",
    body: (
      <>
        <p>
          <strong>Nothing, in this version.</strong> Loxen has no account system and no server-side brief storage. If
          server storage is added, this page will say what is kept, why, and for how long, before that feature ships.
        </p>
      </>
    ),
  },
  {
    id: "analytics",
    title: "Analytics and third parties",
    body: (
      <>
        <p>
          Loxen sets no cookies and runs no analytics or advertising scripts in this version. Usage figures reported for
          the project come from public on-chain receipt events, which anyone can count.
        </p>
        <p>
          The General Sans typeface is loaded from Fontshare, which receives your IP address and browser details as part
          of any web request. Reading the registry sends requests to the BOT Chain RPC endpoint, and links to BOTScan open
          that site under its own terms.
        </p>
      </>
    ),
  },
  {
    id: "wallet",
    title: "Your wallet",
    body: (
      <>
        <p>
          Connecting a wallet lets Loxen read your address and current network. Loxen does not store your address, and it
          will never ask for a seed phrase, a private key or a token approval.
        </p>
        <p>A wallet address is not proof of who you are, and connecting one makes you eligible for nothing.</p>
      </>
    ),
  },
  {
    id: "chain",
    title: "On BOT Chain",
    body: (
      <>
        <p>
          A receipt is a public transaction. It makes these permanently public: <strong>your wallet address, the digest,
          the schema version, the transaction and its block time</strong>. Nobody, including Loxen, can delete or edit them.
        </p>
        <p>
          The digest does not reveal the brief. Without the brief and its salt, it cannot be reversed into your text. If
          you share your receipt package, whoever receives it can read the brief inside it.
        </p>
      </>
    ),
  },
  {
    id: "notes",
    title: "Private notes",
    body: (
      <p>
        Private notes are left out of exports and out of the digest by default. Including them is an explicit choice on
        the <Link className="link" href="/registry">Registry</Link> screen, and even then only the digest changes; the
        notes themselves are never sent.
      </p>
    ),
  },
  {
    id: "retention",
    title: "Retention and deletion",
    body: (
      <ul>
        <li>Briefs on this device stay until you delete them, one at a time or all at once on the <Link className="link" href="/profile">Profile</Link> screen, or by clearing this site’s data.</li>
        <li>Exported files are yours; Loxen keeps no copy.</li>
        <li>On-chain receipts are permanent and outside anyone’s control to delete.</li>
      </ul>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        When what Loxen stores changes, this page changes first, with a new date at the top. Earlier versions stay in the
        project’s public commit history.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <DocPage
      path="/privacy"
      title="What Loxen keeps, and where"
      lead="Your briefs live in your browser. Only a digest you choose to commit ever reaches BOT Chain, and that part is public for good."
      updated="19 October 2026"
      facts={[
        { label: "Stored on our servers", value: "Nothing" },
        { label: "Cookies and analytics", value: "None" },
        { label: "Public on BOT Chain", value: "Wallet, digest, schema, time" },
      ]}
      sections={sections}
    />
  );
}
