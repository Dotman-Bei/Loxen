"use client";

import { useState } from "react";

const CARDS = [
  {
    tab: "Advice",
    q: "Is a brief a recommendation?",
    a: "No. Loxen helps you write down a question, the evidence and the conditions that would change your mind. It never tells you to buy or sell, and a brief is not a signal.",
  },
  {
    tab: "Trades",
    q: "Does Loxen trade or hold funds?",
    a: "No. There is no swap, no order and no custody. The only transaction Loxen ever asks you to sign records a digest, and you pay the network gas yourself.",
  },
  {
    tab: "Token",
    q: "Is there a Loxen token or points?",
    a: "No token, no points and no airdrop. A receipt is not transferable and earns nothing.",
  },
  {
    tab: "Privacy",
    q: "What is public on BOT Chain?",
    a: "Your wallet address, the digest, the schema version, the transaction and its block time. Your brief, notes and salt stay with you unless you publish them.",
  },
  {
    tab: "Missing data",
    q: "What happens when a source is down?",
    a: "The row stays and says Unavailable, with the reason and the last good time if there is one. A provider outage is never shown as zero.",
  },
  {
    tab: "Wallet",
    q: "Do I need a wallet?",
    a: "Only to commit a receipt. Composing, saving and exporting work without one.",
  },
];

export function FaqCards() {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq-stack">
      {CARDS.map((c, i) => {
        const isOpen = open === i;
        return (
          <div
            key={c.tab}
            className={`faq-card faq-c${i % 3}${isOpen ? " is-open" : ""}`}
            style={{ ["--n" as string]: i, zIndex: i + 1 }}
          >
            <h3 className="faq-q">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-a-${i}`}
                id={`faq-b-${i}`}
                onClick={() => setOpen(i)}
              >
                <span className="faq-tab">{c.tab}</span>
                <span className="faq-question">{c.q}</span>
              </button>
            </h3>
            <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-b-${i}`} className="faq-a" hidden={!isOpen}>
              <p>{c.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
