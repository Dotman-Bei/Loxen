# Loxen

A market-context workspace for one question at a time. Loxen turns a market question into an
inspectable research brief: every value carries its source, timestamp and status, anything missing
stays marked as missing, and the brief says what would make its view less credible. A salted digest
of a brief can optionally be recorded on BOT Chain as a public receipt.

Loxen is a research tool. It does not trade, hold funds, issue a token or give advice. A brief is not
a signal, and a receipt proves only that a wallet recorded a digest at a block, not that the brief is
true.

## Status

| Part | State |
| --- | --- |
| Brief composer, local save, Markdown and JSON export | Working |
| Stale, conflict and rule checks | Working |
| Live evidence: BOTScan and BOT Chain RPC (contract verification, holders, transfers, total supply) | Working, for BOT Chain contract addresses |
| Prices, pool liquidity, volume | Not live: entered by hand. No DEX source has been verified yet |
| `ResearchReceiptRegistry` | Deployed and verified on BOT Chain testnet at [`0x597Ea5d6…3EDe95`](https://scan.bohr.life/address/0x597Ea5d69C2B859AcB0f98B700E9608dC93EDe95). Mainnet: not deployed |
| Receipt commit, history search, profile, package verification | Working on testnet |
| Model-generated summaries | Off |
| Public API for agents | Not built (later phase) |

Everything above "Working" is covered by tests; see [Tests](#tests).

## Pages

| Route | What it is for |
| --- | --- |
| `/` | What Loxen is, its source coverage, and a live demo of what goes on-chain |
| `/workbench` | Compose a brief: question, asset, horizon, lens, evidence, rules, unknowns |
| `/brief/[id]` | A saved brief's evidence trail, record and exports |
| `/registry` | Commit a receipt, after seeing exactly what is written |
| `/history` | Search receipts by wallet or ID; verify a receipt package |
| `/profile` | Your on-chain receipts beside the briefs on this device |
| `/methodology`, `/privacy`, `/terms` | How evidence is handled; what is stored; boundaries |

Visual design, copy and components are specified in [docs/FRONTEND.md](docs/FRONTEND.md). The product
requirements are in [Loxen_PRD.md](Loxen_PRD.md).

## Architecture

```
Browser (Next.js app)                         Server (Next.js route handlers)        BOT Chain
───────────────────────────────────────       ───────────────────────────────        ─────────────────────
Workbench ── briefs in localStorage           /api/evidence ─┬─ BOTScan adapter ──▶ scan.*/api/v2
   │        (src/lib/storage.ts)                             └─ RPC adapter ──────▶ rpc (eth_call at one block)
   │                                           cache 60 s · timeouts 8 s · 20 req/min/client
   ├─ checks: src/lib/evaluate.ts              /api/providers ── provider health
   ├─ export: src/lib/export.ts
   └─ digest: src/lib/digest.ts ──────────────────────────────────────────────────▶ ResearchReceiptRegistry
Registry/History/Profile ── wallet (EIP-1193) + viem reads ─────────────────────▶ (contracts/)
```

- **No backend storage.** Briefs live in the browser. The server holds only a 60-second in-memory
  cache of public provider answers and an in-memory request counter.
- **Provider adapters** (`src/server/providers/`) each parse only their own source and report a
  failure as an error with a reason, never as an empty or zero value. Switch them with
  `NEXT_PUBLIC_LOXEN_PROVIDERS`; the coverage shown on the home page is computed from that switch.
- **Deterministic checks** (`src/lib/evaluate.ts`): a provider value is Live for 10 minutes after it is
  read, then Cached; source data older than the horizon allows is Stale; two values for one metric
  more than 2% apart (prices, supply) or 10% apart (counts) are both Conflicting; expected metrics with
  no value stay in the brief as Unavailable with the reason.
- **Receipt digest**: keccak256 over canonical JSON (sorted keys) of
  `{domain, schema, chainId, owner, salt, brief}`. The salt is 32 random bytes and never leaves the
  user's receipt package. The scheme is pinned by a test vector computed independently with
  Foundry's `cast keccak`.
- **Contract**: see [contracts/README.md](contracts/README.md) for the interface, guarantees, admin
  scope and deployment record.

## Run it

Requirements: Node 22+, and Foundry for the contract.

```
npm install
cp .env.example .env.local     # then set NEXT_PUBLIC_LOXEN_REGISTRY_ADDRESS (testnet address above)
npm run dev                    # http://localhost:3000
```

| Variable | Meaning |
| --- | --- |
| `NEXT_PUBLIC_LOXEN_CHAIN` | `testnet` (968, default), `mainnet` (677) or `local` (Anvil, 31337) |
| `NEXT_PUBLIC_LOXEN_REGISTRY_ADDRESS` | Registry address. Empty: commit, history and profile say receipts cannot be committed or read |
| `NEXT_PUBLIC_LOXEN_PROVIDERS` | Enabled providers, default `botscan,botchain-rpc` |
| `NEXT_DIST_DIR` | Build folder, so a second server (tests) can run beside `npm run dev` |

Network values were checked against the
[BOT Chain developer guide](https://dev-docs.botchain.ai/docs/Developers/quick-guide/) on 19 October
2026 (testnet: chain 968, `https://rpc.bohr.life`, `https://scan.bohr.life`; mainnet: chain 677,
`https://rpc.botchain.ai`, `https://scan.botchain.ai`). Re-check them before any deployment.

## Tests

```
npm test                       # 61 unit tests (Vitest)
npm run test:e2e               # 5 end-to-end tests (Playwright, uses installed Edge; E2E_BROWSER_CHANNEL=chrome for Chrome)
cd contracts && forge test     # 21 contract tests including a 512-run fuzz test
npm run check:abi              # frontend ABI matches the compiled contract (after forge build)
```

Unit tests cover the brief checks (stale, live window, conflicts, missing reasons, rules, address
checksums), the digest (including the pinned vector), exports (escaping, unavailable rows, private
notes excluded), both adapters against recorded-style replies (success, 404, wallet address, non-token
contract, missing counters, HTTP errors, timeouts, malformed replies, price fields ignored), caching
(served as Cached, outages not cached), provider switches and rate limiting. A mutation check
(breaking the live window, the cache label, and key sorting in the digest) fails the suite each time.

End-to-end tests run the main flow in a real browser with provider calls stubbed: compose, fetch,
add evidence and a rule, save, reopen, export Markdown and JSON and check their contents; delete with
confirmation; the not-found brief; the registry's blocked state; and the public page titles.

The commit path was also exercised against a real chain (local Anvil, and reads against the live
testnet registry): confirmed commit, paused registry and wallet rejection, each showing success only
after a confirmed transaction.

## Deploying

- **Contract (testnet):** put a funded testnet-only key in `contracts/.env` and run
  `npm run deploy:testnet`. Details and the mainnet procedure (encrypted keystore, multisig admin) are
  in [contracts/README.md](contracts/README.md).
- **Web app:** any Next.js host. Set the variables above. The rate limiter and cache are per server
  process; on a multi-instance or serverless host they are best-effort, and a shared store (for example
  Redis) should replace them before heavy public use.

## Known limitations

- No DEX or price source is integrated, so market-structure and liquidity values are entered by hand.
- BOTScan exposes all-time transfer counts only; "transfers in the horizon" is entered by hand.
- Health and cache state reset when the server restarts.
- Briefs are per browser. Clearing site data deletes them; export what you want to keep.
- Privacy and Terms describe this build and have not had legal review.

## Repository layout

```
src/app/(site)        public pages          src/server/providers   adapters, cache, health
src/app/(app)         working screens       src/lib                schema, checks, digest, export, chain, wallet
src/app/api           route handlers        contracts/             Foundry project, tests, deploy script
e2e/                  Playwright tests      docs/                  frontend spec, threat model
public/archive        credited archive pictures (see public/archive/credits.json)
```

See [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) for trust boundaries and threats.
