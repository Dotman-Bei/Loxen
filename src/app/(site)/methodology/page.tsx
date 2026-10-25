import type { Metadata } from "next";
import Link from "next/link";
import { DocFigureTag, DocPage } from "@/components/site/DocPage";
import { StatusMark } from "@/components/StatusMark";
import { HORIZONS, SCHEMA_ID } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How Loxen labels sources, timestamps, stale and conflicting data, invalidation rules and research receipts.",
};

const sections = [
  {
    id: "record",
    title: "The source record",
    body: (
      <>
        <p>
          Every material value in a brief is stored as one record. The record carries everything needed to judge the
          value later, so a number never travels without its source, its time and its state.
        </p>
        <table className="doc-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>What it holds</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Metric and value</td><td>What was measured, the value and its unit.</td></tr>
            <tr><td>Kind</td><td>Source data, calculation, interpretation or assumption.</td></tr>
            <tr><td>Provider and source</td><td>Who supplied it (a configured provider, or you) and the page or label it came from, with a link where there is one.</td></tr>
            <tr><td>Observed at</td><td>When the value was true at its source. Kept separately from when it was entered.</td></tr>
            <tr><td>Collected at</td><td>When Loxen received or you entered the value.</td></tr>
            <tr><td>Status</td><td>One of the six states below, recomputed every time the brief is opened.</td></tr>
            <tr><td>Error</td><td>For an unavailable value, the reason in words. Never a zero.</td></tr>
          </tbody>
        </table>
        <DocFigureTag
          fig={{
            src: "/archive/edison-ticker.jpg",
            w: 1920,
            h: 2375,
            alt: "Edison's Universal stock printer under a glass dome",
            caption: "Edison’s Universal stock printer, 1870s. Its tape carried prices, and nothing about where or when they came from.",
            contain: true,
          }}
        />
      </>
    ),
  },
  {
    id: "states",
    title: "Six states",
    body: (
      <>
        <p>Each state is a shape and a word, so it reads without colour.</p>
        <div className="doc-states">
          <div><StatusMark status="live" /><p>Fetched from a configured provider for this brief in the last 10 minutes, with the provider’s own timestamp where it gives one. After 10 minutes the same value is shown as cached.</p></div>
          <div><StatusMark status="cached" /><p>Read earlier: either served from Loxen’s 60-second cache, or a provider value in a saved brief more than 10 minutes old. Shown with its real age and never called live.</p></div>
          <div><StatusMark status="user" /><p>Entered by you, with the source you name. Kept apart from provider data in every export.</p></div>
          <div><StatusMark status="stale" /><p>Older than the horizon allows (see the next section). The value stays, with its timestamp and age.</p></div>
          <div><StatusMark status="conflicting" /><p>Two sources for the same metric disagree past the threshold. Both values stay; Loxen chooses neither.</p></div>
          <div><StatusMark status="unavailable" /><p>Expected by the lens but missing: the provider is not configured, failed, or nothing was entered. The row stays, with a dash and the reason.</p></div>
        </div>
      </>
    ),
  },
  {
    id: "stale",
    title: "When a value goes stale",
    body: (
      <>
        <p>
          A value is stale when the time since it was observed is longer than its horizon allows. The threshold follows
          the horizon you choose, because a five-hour-old price matters for an intraday view and hardly at all for a
          monthly one.
        </p>
        <table className="doc-table">
          <thead>
            <tr>
              <th>Horizon</th>
              <th>Stale after</th>
            </tr>
          </thead>
          <tbody>
            {HORIZONS.map((h) => (
              <tr key={h.id}>
                <td>{h.label}</td>
                <td>{h.staleLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>These are Loxen’s defaults. A stale value is not removed; its age is printed next to it.</p>
        <DocFigureTag
          fig={{
            src: "/archive/tapeworm-1907.png",
            w: 1097,
            h: 1516,
            alt: "Cartoon: ticker tape streams from a machine and tangles investors, money bags, a ship and a house",
            caption: "Frank Nankivell, “The Tapeworm”, 1907. Tape that nobody checked, wrapped around everything.",
            position: "50% 20%",
          }}
        />
      </>
    ),
  },
  {
    id: "providers",
    title: "Where live values come from",
    body: (
      <>
        <p>
          When a brief names a BOT Chain contract address, <strong>Fetch evidence</strong> asks Loxen’s server to read
          two public sources. Only the address and network are sent.
        </p>
        <ul>
          <li><strong>BOTScan</strong> (the chain’s explorer): whether the contract is verified, its holder count, all-time transfer count and total supply.</li>
          <li><strong>BOT Chain RPC</strong> (the chain itself): whether code exists at the address, and the token’s name, symbol and total supply, read at one block whose time becomes the source timestamp.</li>
        </ul>
        <p>
          Each request stops after 8 seconds. A failure is shown as unavailable with its reason, never as zero, and is
          not cached. Answers are kept in server memory for 60 seconds; a repeat inside that window is labelled cached.
          BOTScan’s price fields are not used, because their source and definition are not documented.
        </p>
        <p>
          Both sources report total supply, so if they ever disagree by more than 2%, both values are shown as
          conflicting.
        </p>
      </>
    ),
  },
  {
    id: "conflicts",
    title: "When sources disagree",
    body: (
      <>
        <p>
          When two records for the same metric are more than <strong>2% apart for prices</strong> or <strong>10% apart for
          volumes and counts</strong>, both are marked conflicting and both stay in the brief, with the size of the gap.
          Loxen does not average them, prefer the newer one, or pick a favourite provider.
        </p>
        <p>A provider outage is never treated as agreement: an unavailable value takes no part in the comparison.</p>
      </>
    ),
  },
  {
    id: "kinds",
    title: "Four kinds of content",
    body: (
      <>
        <ul>
          <li><strong>Source data:</strong> a value read from somewhere, with that place named.</li>
          <li><strong>Calculation:</strong> derived from other values in the brief by a stated method, such as slippage from pool depth.</li>
          <li><strong>Interpretation:</strong> what a value might mean. If a model ever writes one, it is labelled model-generated.</li>
          <li><strong>Assumption:</strong> something you take as given. Marked so a reader does not mistake it for a fact.</li>
        </ul>
        <p>Every export prints the kind beside each value.</p>
      </>
    ),
  },
  {
    id: "invalidation",
    title: "Risk and invalidation",
    body: (
      <>
        <p>
          Invalidation rules say what would make your view less credible. Each rule is either a <strong>measured
          threshold</strong> (pool liquidity below 10,000 USD) or <strong>qualitative</strong> (the main venue stops quoting
          the pair), and each names the data it needs.
        </p>
        <p>
          A rule whose data is missing reads <strong>Cannot evaluate</strong>, with the missing metric named. Loxen never
          guesses at a rule it cannot check. Templates for each lens are offered as prompts to consider, not as verified
          facts or advice.
        </p>
      </>
    ),
  },
  {
    id: "model",
    title: "Model use",
    body: (
      <>
        <p>
          <strong>Off in this build.</strong> No brief contains model-generated text. If a model summary is added later,
          it will:
        </p>
        <ul>
          <li>receive only the values it needs, never your private notes;</li>
          <li>cite the evidence records each claim rests on, and be labelled as model-generated;</li>
          <li>return “not enough evidence” rather than a conclusion when the brief is thin;</li>
          <li>never invent a source or a metric, and never say buy or sell.</li>
        </ul>
        <DocFigureTag
          fig={{
            src: "/archive/keppler-bubbles-1901.jpg",
            w: 1920,
            h: 1296,
            alt: "Puck cartoon: a bull blows soap bubbles marked Inflated Values towards a crowd",
            caption: "Udo Keppler, “Wall Street Bubbles: Always the Same”, Puck, 1901.",
            position: "45% 40%",
          }}
        />
      </>
    ),
  },
  {
    id: "receipts",
    title: "Research receipts",
    body: (
      <>
        <p>
          A receipt records that a wallet committed a digest at a block. The digest is <code>keccak256</code> over a
          canonical JSON envelope with sorted keys: the domain <code>loxen.research-receipt</code>, the schema{" "}
          <code>{SCHEMA_ID}</code>, the chain ID, the owner address, a random 32-byte salt, and the brief (private notes
          only if you opt in).
        </p>
        <p>
          Only the digest and schema version are sent. The owner and time come from the chain. The brief and the salt
          stay with you, in the receipt package you download. Anyone you give that package to can recompute the digest
          on the <Link className="link" href="/history">History</Link> screen and compare it with the chain.
        </p>
        <p>
          <strong>What it does not prove:</strong> that the brief is accurate, that its sources were honest, that a value
          was live, or who holds the wallet.
        </p>
        <DocFigureTag
          fig={{
            src: "/archive/telegraph-receipt-1882.jpg",
            w: 1920,
            h: 1938,
            alt: "An 1882 Indian Telegraph receipt stamped AKYAB 23-4-82",
            caption: "Receipt for an inland telegram, Akyab, 1882. Proof that it was sent, not that it was true.",
            position: "50% 15%",
          }}
        />
        <figure className="doc-fig">
          <div className="doc-video tag">
            <video autoPlay muted loop playsInline preload="metadata" poster="/archive/teleprinter-poster.jpg" width={854} height={480} aria-hidden="true">
              <source src="/archive/teleprinter.webm" type="video/webm" />
            </video>
          </div>
          <figcaption className="caption">A Lorenz teleprinter printing a record, 1960s. Konrad Gutkowski, CC BY 3.0.</figcaption>
        </figure>
      </>
    ),
  },
  {
    id: "status",
    title: "Live and planned",
    body: (
      <table className="doc-table">
        <thead>
          <tr>
            <th>Part</th>
            <th>In this build</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Brief composer, local save, Markdown and JSON export</td><td>Working</td></tr>
          <tr><td>Stale, conflict and rule checks</td><td>Working, on your entries</td></tr>
          <tr><td>Receipt digest and package</td><td>Working, computed in your browser</td></tr>
          <tr><td>Registry contract on BOT Chain</td><td>Deployed and verified on mainnet and testnet</td></tr>
          <tr><td>Receipt history and profile reads</td><td>Working on testnet</td></tr>
          <tr><td>BOTScan: contract verification, holders, transfers, total supply</td><td>Live, for BOT Chain contract addresses</td></tr>
          <tr><td>BOT Chain RPC: contract code, name, symbol, total supply at a block</td><td>Live, for BOT Chain contract addresses</td></tr>
          <tr><td>Prices, pool liquidity, volume (DEX pools)</td><td>Planned, after a venue’s terms and limits are checked. Enter them by hand meanwhile</td></tr>
          <tr><td>Model summaries</td><td>Off</td></tr>
          <tr><td>Public API for agents</td><td>Planned for a later phase</td></tr>
        </tbody>
      </table>
    ),
  },
];

export default function MethodologyPage() {
  return (
    <DocPage
      path="/methodology"
      title="How Loxen handles evidence"
      lead="The rules behind every status mark, timestamp and receipt, and which parts of Loxen are live today."
      updated="19 October 2026"
      facts={[
        { label: "Live providers", value: "BOTScan and BOT Chain RPC" },
        { label: "Model-generated text", value: "Off" },
        { label: "Written on-chain", value: "A digest, never the brief" },
      ]}
      sections={sections}
    />
  );
}
