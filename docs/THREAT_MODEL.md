# Loxen threat model

Scope: the web app, its provider route handlers, the `ResearchReceiptRegistry` contract and the
wallet interaction, as built on 19 October 2026. Contract-specific detail is in
[contracts/README.md](../contracts/README.md).

## What is worth protecting

| Asset | Why it matters |
| --- | --- |
| The honesty of a brief's labels | Loxen's whole value is that Live, Stale, Conflicting and Unavailable mean what they say |
| Users' brief text and private notes | Research intent can be sensitive (position sizing, targets) |
| The receipt record | Users rely on a receipt to show a brief existed at a time |
| Users' wallets | A signing prompt is a chance to trick someone |
| The upstream providers | Abusing BOTScan or the RPC through Loxen could get the service blocked |
| The deployer and pause-admin keys | They control deployment and the pause switch |

## Trust boundaries

1. **Browser ↔ Loxen server.** The browser sends only a contract address and network to
   `/api/evidence`. Briefs never reach the server.
2. **Loxen server ↔ BOTScan and BOT Chain RPC.** Third-party, unauthenticated, outside our control.
   Their answers are data, not instructions, and are labelled with their source.
3. **Browser ↔ wallet ↔ BOT Chain.** The user's wallet signs; the chain is the record. Loxen's server is
   not involved in signing.
4. **Loxen ↔ users' own sources.** User-supplied values are labelled as such and never treated as
   provider data.

## Threats and handling

| # | Threat | Handling | Residual risk |
| --- | --- | --- | --- |
| 1 | A provider outage is shown as zero or silently dropped | Adapters return an error with a reason; metrics stay Unavailable with "X did not answer: …"; outages are not cached (unit-tested) | Low |
| 2 | Old data presented as live | Live only within 10 minutes of the read, then Cached with real age; cache hits relabelled Cached; Stale by horizon (unit-tested) | Low |
| 3 | Two sources disagree and one is picked silently | Both shown as Conflicting with the gap; total supply is read from both BOTScan and the RPC so this is exercised | Low |
| 4 | An undocumented field is shown as a price | BOTScan's `exchange_rate` and market-cap fields are ignored (unit-tested) | Low |
| 5 | Wrong asset: a similarly named token is assumed | Symbols are never resolved; only a checksummed contract address is fetched, and the resolved name is shown with "Check this is the asset you mean" | Low |
| 6 | Malformed or hostile provider data rendered as HTML | React escapes all text; Markdown export escapes table and emphasis characters; no `dangerouslySetInnerHTML` | Low |
| 7 | Using Loxen to hammer BOTScan or the RPC | 20 lookups per minute per client, 60-second cache, 8-second timeouts, input validation before any upstream call | Medium on multi-instance hosts, where limits are per process |
| 8 | Brief text or notes leak through the chain | Only a salted keccak256 digest goes on-chain; salt stays in the user's package; private notes excluded from the digest unless opted in | Low. A user who shares their package shares the brief |
| 9 | Brief text leaks to Loxen or third parties | Briefs stay in localStorage; no analytics or cookies; providers see the server, not the user | Fontshare sees visitors' IPs when loading the typeface |
| 10 | Showing a receipt as committed when it is not | Success only after a confirmed receipt with a decoded `ReceiptRegistered` event; rejected, reverted, paused and timed-out paths store nothing (tested end to end on a local chain) | Low |
| 11 | A malicious signing prompt (approvals, transfers, seed phrases) | The only transaction is `registerReceipt(digest, schemaVersion)` to the configured address, simulated first; the screen states "No token approval, no transfer"; Loxen never asks for a key | Low, provided the deployment's registry address is trustworthy |
| 12 | A receipt presented as proof the research is true | Every receipt screen, the contract NatSpec and the Terms say it proves registration only | Social risk remains: people may still overclaim |
| 13 | Front-running or copying a digest | The receipt binds to `msg.sender`; a copier gets their own receipt, not yours | Low |
| 14 | Registry spam | Each registration costs the sender gas and touches only their own storage; reads are bounded (page cap 100, events over 50,000 blocks) | Low |
| 15 | Pause-admin key compromise | Worst case: registrations paused. Receipts cannot be edited or deleted; reads never pause; renounce refused while paused | Use a multisig or hardware wallet for mainnet |
| 16 | Deployer key leak from `contracts/.env` | File is gitignored; the deploy script never prints it; README requires a testnet-only key there and a keystore for mainnet | A plaintext key on disk is acceptable only for testnet |
| 17 | Frontend and contract drift apart | `npm run check:abi` fails on any mismatch; the digest scheme is pinned by an independent test vector | Low |
| 18 | Stale network configuration | Chain IDs and URLs live in one file and were re-checked against the official guide; the deploy script refuses any chain but 968, 677 or local | Re-check before mainnet |

## Not covered yet

- No external audit of the contract. Required before mainnet.
- No shared rate-limit store for multi-instance hosting.
- No content-security policy headers are configured yet.
- Legal review of Privacy and Terms.
