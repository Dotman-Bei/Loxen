import type { Metadata } from "next";
import { DocFigureTag, DocPage } from "@/components/site/DocPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "Loxen's product boundaries, data limitations, non-advisory status and your responsibilities.",
};

const sections = [
  {
    id: "is",
    title: "What Loxen is",
    body: (
      <p>
        Loxen is a research tool. It helps you write down a market question, the evidence you have for it with sources
        and timestamps, what is missing, and what would change your view. It can record a digest of that brief on BOT
        Chain if you choose.
      </p>
    ),
  },
  {
    id: "is-not",
    title: "What Loxen is not",
    body: (
      <>
        <p>Loxen is not an exchange, broker, portfolio manager, custody service, trading bot or financial adviser. It:</p>
        <ul>
          <li>does not execute, route or recommend trades;</li>
          <li>does not hold, move or ask for your funds;</li>
          <li>does not issue a token, points or rewards of any kind.</li>
        </ul>
      </>
    ),
  },
  {
    id: "advice",
    title: "Not financial advice",
    body: (
      <p>
        Nothing in Loxen, including templates, checks and any future model summary, is investment, legal or tax advice. A
        brief is not a signal. A rule marked “data present” means the data exists, not that the rule holds or that any
        outcome will follow. Decisions you make are your own.
      </p>
    ),
  },
  {
    id: "data",
    title: "Data and its limits",
    body: (
      <>
        <p>
          Values in a brief can be wrong, late or incomplete. Providers fail; sources disagree; values you enter are only as
          good as the place you took them from. Loxen labels what it can detect (stale, conflicting, unavailable) and
          cannot detect everything.
        </p>
        <p>Loxen makes no promise that any value, check or brief is accurate, complete or current.</p>
      </>
    ),
  },
  {
    id: "third",
    title: "Third-party services",
    body: (
      <p>
        Loxen depends on services it does not control: the BOT Chain network and its RPC endpoints, the BOTScan explorer,
        your wallet software, and the font host. Their terms apply to your use of them, and their outages or changes can
        affect Loxen.
      </p>
    ),
  },
  {
    id: "receipts",
    title: "Research receipts",
    body: (
      <>
        <p>
          Committing a receipt is a transaction you sign and pay gas for. It cannot be reversed or deleted. A receipt is
          not transferable and has no monetary value.
        </p>
        <p>
          A receipt proves only that your wallet recorded a digest at a block. It is not a certification that the brief is
          true, and must not be presented as one.
        </p>
        <DocFigureTag
          fig={{
            src: "/archive/telegraph-receipt-1882.jpg",
            w: 1920,
            h: 1938,
            alt: "The back of an 1882 Indian Telegraph receipt, printed with its abstract of rules",
            caption: "The back of a telegraph receipt, 1882. Rule I: “The accuracy of messages is not guaranteed.”",
            position: "50% 96%",
          }}
        />
      </>
    ),
  },
  {
    id: "you",
    title: "Your responsibilities",
    body: (
      <ul>
        <li>Check sources before you rely on them, and name them honestly when you enter values.</li>
        <li>Keep your receipt package (brief and salt) if you want to prove what a digest stands for later.</li>
        <li>Do not enter other people’s personal information into a brief.</li>
        <li>Keep your wallet secure. Loxen will never ask for your seed phrase or private key.</li>
        <li>Follow the laws that apply where you are.</li>
      </ul>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <p>
        These terms may change as Loxen does. The date at the top shows the current version, and earlier versions stay in
        the project’s public commit history.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <DocPage
      path="/terms"
      title="Terms of use"
      lead="Loxen helps you prepare and record research. It does not trade, hold funds, issue tokens or tell you what to do."
      updated="19 October 2026"
      facts={[
        { label: "Advice", value: "None given" },
        { label: "Your funds", value: "Never held or moved" },
        { label: "A receipt proves", value: "A digest, at a block" },
      ]}
      sections={sections}
    />
  );
}
