"use client";

import { useEffect, useMemo, useState } from "react";
import { digestOf, newSalt } from "@/lib/digest";
import { SCHEMA_ID } from "@/lib/schema";

const DEFAULT_Q = "What would make this pool too thin for a two-week view?";
// Shown before script runs, and as the server render: a worked example with a fixed salt.
const EXAMPLE_SALT = "0x5c1e9a0d7f43b28e6a91c0d4e7b35f2a8c6d1e09b47a3f52e8d6c1b0a9f7e3d2";

export function DigestTool() {
  const [question, setQuestion] = useState(DEFAULT_Q);
  const [salt, setSalt] = useState(EXAMPLE_SALT);
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    setSalt(newSalt());
    setFresh(true);
  }, []);

  const digest = useMemo(
    () => digestOf({ brief: { question: question.trim() }, salt }),
    [question, salt],
  );

  return (
    <div className="ui digest-tool" data-ui>
      <label htmlFor="digest-q" className="dt-label">Your question</label>
      <textarea
        id="digest-q"
        className="dt-input"
        rows={2}
        maxLength={280}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <div className="dt-cols">
        <div className="dt-col">
          <h3 className="dt-h">Stays with you</h3>
          <ul>
            <li>The brief text <span className="dt-sub">{question.trim().length} characters</span></li>
            <li>Your private notes</li>
            <li>
              The salt <code className="dt-salt">{salt.slice(0, 18)}…</code>
            </li>
          </ul>
        </div>
        <div className="dt-col dt-col-chain">
          <h3 className="dt-h">Written to BOT Chain</h3>
          <ul>
            <li>
              The digest
              <code className="dt-digest" aria-live="polite">{digest}</code>
            </li>
            <li>Schema <code>{SCHEMA_ID}</code></li>
            <li>Your wallet address</li>
            <li>The block and its time</li>
          </ul>
        </div>
      </div>
      <div className="dt-foot">
        <button type="button" className="dt-btn" onClick={() => setSalt(newSalt())}>
          New salt
        </button>
        <p className="dt-note">
          {fresh
            ? "Computed in this browser with keccak256. Nothing was sent."
            : "A worked example with a fixed salt. With script on, this is computed in your browser."}
        </p>
      </div>
    </div>
  );
}
