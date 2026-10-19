# PRD.md — Loxen

## 1. Product Overview

**Project name:** Loxen  
**Category:** Tools  
**Target ecosystem:** BOT Chain  
**Product type:** Market-context and evidence workspace with optional on-chain research receipts

### Product summary

Loxen is a market-context workspace that helps users formulate a useful market question, select an asset and time horizon, organize available evidence, identify missing data, and define the conditions that would invalidate their current view.

It is inspired by the market-context-workspace narrative demonstrated by Kaverload, but must have its own name, copy, implementation, contract design, and product details. Do not copy Kaverload's brand assets, source code, exact page copy, or genesis-points mechanism.

The product must help users distinguish:

- User-supplied assumptions
- Verified source data
- Derived calculations
- Model-generated interpretation
- Missing, stale, unavailable, or conflicting evidence
- Risk and invalidation conditions

Loxen is initially a research and preparation tool. It does **not** execute trades, hold user funds, or promise investment outcomes. It must not present itself as a financial adviser or imply that a structured brief is a trading signal.

### Core product promise

> Frame the question. Inspect the evidence. Make uncertainty visible.

---

## 2. Problem

Market information is spread across prices, liquidity measures, on-chain activity, news, social narratives, and other sources. Users often compare values with different timestamps or definitions, overlook missing data, and receive confident-sounding analysis without being able to inspect how it was produced.

Loxen should give users one repeatable workflow to:

1. Identify an asset or contract.
2. Choose a time horizon.
3. Select the main research lens.
4. Gather or enter relevant evidence.
5. See source names, timestamps, data status, and conflicts.
6. Describe risk and invalidation conditions.
7. Save or export the brief.
8. Optionally commit a privacy-preserving receipt of the brief to BOT Chain.

The product must prefer an explicit unavailable state over fabricated or silently substituted data.

---

## 3. Product Vision and Boundaries

### Vision

Become a reusable context layer for people and, later, software agents that need a structured view of market conditions with source traceability and risk boundaries.

### MVP boundary

The first release should provide a working brief composer, source-aware evidence structure, profile/history for saved or committed records, and a minimal on-chain receipt registry. Live data adapters may be limited to a small number of verified providers. Any provider that is not configured or currently available must be shown as unavailable; never generate fake live metrics.

### Not the product

Loxen is not an exchange, broker, portfolio manager, custody service, autonomous trading bot, or guarantee of market returns. Wallet connection is optional for composing a local brief and only required for on-chain receipt actions.

---

## 4. BOT Chain Tools Track and Incubation Fit

The project must be built as a real, deployable Tools application with a credible path to BOT Labs incubation. Optimize for product functionality, reliable data boundaries, a verified contract, evidence of real usage, and phased milestones.

### 4.1 Why the blockchain is useful

The workbench itself can operate off-chain. BOT Chain is used for an **optional, inspectable research receipt** that timestamps a digest of a brief and binds it to the wallet that committed it. A user can independently verify that a particular digest was recorded at a given block without publishing the brief's full text on-chain.

The contract must not:

- Custody user funds
- Execute trades or swaps
- Mint a tradable token
- Promise airdrops, rewards, allocation, or financial returns
- Store raw prompts, private notes, provider API keys, or full market briefs on-chain

This is a deliberate and transparent use of the chain, not a claim that all research must happen on-chain.

### 4.2 BOT Chain-native value

- Users can create low-cost, public-verifiable research receipts on BOT Chain.
- Receipt transactions and contract events provide measurable ecosystem activity.
- The receipt format can later be consumed by permitted applications or software agents.
- The product can become a small Tools primitive that other BOT Chain projects link to when publishing research or risk notes.

Do not claim BOT Chain guarantees the truth of off-chain information. The chain proves that a digest was recorded, not that the underlying data or interpretation is correct.

### 4.3 BOT Labs incubation criteria

Build to demonstrate:

- **Technical capability:** working app, reliable provider boundaries, tested contracts, verified deployment.
- **Market potential:** an identifiable user problem for traders, researchers, builders, and agents.
- **Ecosystem fit:** a useful tool with real BOT Chain transactions and an integration path for the ecosystem.
- **Milestone readiness:** a roadmap with verifiable delivery checkpoints.
- **Community foundation:** real testers, feedback, documentation, and public build updates.

### 4.4 Real traction and honest metrics

Track real usage including:

- Unique workbench users
- Briefs created and exported
- Data-provider requests and failures
- Research receipts committed on-chain
- Unique wallets committing receipts
- Repeat usage
- Public receipt lookups
- API/developer integrations when implemented

Never fabricate users, brief counts, data points, sources, transaction activity, confidence scores, or provider coverage.

### 4.5 No unnecessary token

Loxen does not need a native project token or points programme. Do not add either only to create an incentive narrative. The initial on-chain action records a digest receipt only; users pay their own network gas.

---

## 5. Target Users

### 5.1 Individual market researchers
People who want to prepare a structured market view and avoid mixing facts, assumptions, and conclusions.

### 5.2 On-chain users and builders
People researching a token or contract who need to record the basis of a public view or research snapshot.

### 5.3 Analysts and small communities
Groups that want to publish repeatable briefs with visible sources, timestamps, unknowns, and invalidation conditions.

### 5.4 Software agents and integrators (later phase)
Applications and agents that need normalized, evidence-bounded context rather than unstructured prose. Public API access is not required for the first MVP unless time allows after the core flow works.

---

## 6. Core Product Workflow

```text
Open Workbench
      ↓
Choose Asset / Contract
      ↓
Select Time Horizon + Research Lens
      ↓
Resolve Available Sources
      ↓
Collect / Enter Evidence
      ↓
Normalize Values and Timestamps
      ↓
Expose Missing or Conflicting Data
      ↓
Define Risks and Invalidation Conditions
      ↓
Generate Structured Brief
      ↓
Review and Save / Export
      ↓
Optionally Commit Brief Digest to BOT Chain
      ↓
View Transaction Receipt and Public History
```

The output must clearly indicate whether it was generated from live configured sources, user-provided inputs, local template logic, or a combination of these.

---

## 7. Brief Composer

The brief composer is the primary product feature.

### Inputs

- Asset symbol, name, or contract address
- Chain/network where applicable
- Time horizon: intraday, 1–7 days, 1–4 weeks, longer-term
- Primary research lens, at minimum:
  - Market structure
  - Liquidity
  - On-chain activity
  - Risk/invalidation
- Optional user question
- Optional user-provided evidence or notes

### Asset resolution

- Validate wallet-style contract addresses before querying.
- Resolve symbols/names only when a configured provider can identify them unambiguously.
- If a symbol maps to multiple assets, require the user to select the intended asset.
- Never silently assume that similarly named assets are identical.
- Show the chain and contract address whenever known.

### Structured output

A generated brief should contain:

1. **Question:** the research question being considered.
2. **Asset resolution:** chosen asset, network, and contract address if known.
3. **Time horizon:** selected timeframe.
4. **Evidence summary:** each data point separated from interpretation.
5. **Sources:** provider/source label and source link where available.
6. **Observation timestamps:** when each material value was collected or supplied.
7. **Source status:** live, cached, user supplied, stale, conflicting, or unavailable.
8. **Market context:** market structure/liquidity/on-chain sections when sources support them.
9. **Risk factors:** known conditions that may weaken the view.
10. **Invalidation:** concrete conditions that would make the current view less credible.
11. **Unknowns:** what is missing or could not be verified.
12. **Limitations:** provider gaps, data age, and any model-generated content.

If a source fails or is missing, the relevant section must remain visibly unavailable. Never invent data to fill a layout.

---

## 8. Data Providers and Evidence Rules

### MVP data policy

Implement an adapter interface so each provider can be enabled or disabled independently. Before using a live source, verify its current API, terms, rate limits, attribution requirements, and access credentials. Keep secrets server-side in environment variables.

The first release may ship with a limited number of live providers. If provider credentials or permissions are unavailable, the app must still be usable in manual/local brief mode, with the status clearly marked. Do not use mocked values under labels such as “live price”, “current liquidity”, or “on-chain activity”.

### Normalized source record

Each material data item should carry:

- `providerId`
- `sourceLabel`
- `sourceUrl` when applicable
- `assetId` and chain when applicable
- `metricName`
- `value` and unit when present
- `collectedAt`
- `sourceTimestamp` when supplied by source
- `status`
- `staleAfter` or age threshold when relevant
- `errorCode` / safe error description when unavailable

### Provider health

- Show provider status or last successful fetch time.
- Apply request timeouts and rate limits.
- Cache where provider terms and data freshness allow.
- Do not present cached data as live.
- Surface stale data with its actual timestamp.
- Keep provider-specific parsing isolated in adapters.
- If two sources disagree materially, show the conflict rather than silently selecting a preferred value.

### Model use

LLM-based summaries are optional. If included:

- Send only the minimum required information to the provider.
- Make it clear which text is model-generated.
- Ground generated claims in available evidence identifiers.
- Do not permit the model to invent a source or metric.
- Keep deterministic calculations separate from model interpretation.
- Return a no-conclusion/unavailable result when there is insufficient evidence.
- Do not output direct commands to buy/sell or promises of profit.

---

## 9. Risk and Invalidation

Risk/invalidation is a core output, not an optional decorative section.

The user should be able to:

- Add their own invalidation rules.
- Choose predefined rule templates for a selected lens.
- Distinguish measured thresholds from qualitative observations.
- See what data is required to evaluate each rule.
- See when the rule cannot be evaluated due to missing data.

The app may suggest general questions to investigate, but suggestions must be labeled as prompts to consider, not verified facts. The product should never imply that a brief provides a guaranteed or personalized investment outcome.

---

## 10. Save, Export, and Brief Versioning

MVP should support:

- Create a brief locally or in the user's account/session.
- Save a brief for later review.
- Export a brief to Markdown or JSON.
- Assign schema/version metadata so outputs remain interpretable later.
- Display provider state and timestamps in exports.
- Mark local-only records separately from records committed to chain.

If persistence requires a backend, store only data needed for the feature and provide a clear privacy policy. Avoid collecting unnecessary personal information. A wallet is not proof of unique human identity.

### Brief digest

Before a user commits a receipt:

1. Normalize the brief to a stable, documented serialization format.
2. Generate a cryptographically secure random salt/nonce.
3. Compute a digest that binds the normalized brief, salt, schema version, and relevant owner/domain context.
4. Explain exactly what will be written to the blockchain.
5. Let the user opt in and approve the transaction.
6. After confirmation, show the transaction hash, block number, owner, timestamp, and receipt digest.

Do not put the raw brief, private annotations, API output, or random salt into public contract storage. Users may download a receipt package containing the brief, salt, schema version, and receipt fields so they can independently demonstrate that the brief matches the committed digest. Do not call the receipt a certification that the brief is true.

---

## 11. On-Chain Research Receipt Registry

The MVP smart contract should provide a narrow, auditable registry for optional brief receipts.

### Proposed contract: `ResearchReceiptRegistry`

Core responsibilities:

- Register a digest for the connected wallet.
- Store owner, digest, schema/version identifier, and block timestamp (or emit enough event data to reconstruct it).
- Emit a receipt event with a unique receipt ID.
- Allow receipt lookup by ID or owner, bounded to avoid unbounded loops.
- Support public verification of a receipt transaction.
- Optionally allow a pause switch for emergency registry incidents.

### Contract restrictions

- No token issuance.
- No payment collection beyond the user's network gas.
- No transferability of receipts.
- No trade execution.
- No storing raw market briefs or prompts on-chain.
- No claim that the contract validates market data or research accuracy.
- Do not require a one-time points claim copied from the reference project.

### Design requirements

- Use access control only where truly needed; regular users should be able to submit their own receipts.
- Avoid unbounded arrays/loops in contract calls.
- Emit events for indexer/history support.
- Define whether duplicate digests from the same owner are allowed. For MVP, allow a user to create a new receipt when a brief version changes; add duplicate protection only if it does not prevent legitimate versioning.
- Add a schema version to the receipt so future format changes can be handled.
- Ensure the receipt ID and digest are deterministic and collision-resistant for the chosen scheme.
- Test emitted event fields and read methods.

### Receipt verification boundary

The contract proves only that a wallet submitted a digest at a particular on-chain time. It does not prove that the brief is accurate, that sources were honest, or that the wallet belongs to a particular human.

---

## 12. History and Profile

### Public history

Users should be able to:

- Search receipts by wallet address or receipt ID.
- View recent receipt events from BOT Chain.
- See receipt ID, owner address, timestamp/block, schema version, transaction hash, and digest.
- Open the transaction/contract in BOTScan.
- Distinguish “no record found” from “provider/indexer unavailable”.

Do not synthesize recent activity or show fake total counts when the RPC/indexer is unavailable.

### Connected wallet profile

Display:

- Connected wallet
- Active network
- Receipt count where verifiable
- Receipt list
- Latest confirmed receipt
- Claim/transaction status where applicable

Do not claim KYC, unique-human identity, or eligibility for future rewards based on wallet connection.

---

## 13. Wallet and Transaction Flow

- Wallet connection is optional for brief composition.
- Use a maintained EVM wallet connector compatible with BOT Chain.
- Detect the current chain and offer a network switch only with verified configuration.
- Show the expected contract address and transaction purpose before the user signs.
- Never request a seed phrase, private key, or unrestricted token approval.
- Simulate/read-check the transaction where supported before requesting a signature.
- Wait for a confirmed successful receipt before showing a receipt as committed.
- Rejected, reverted, dropped, or timed-out transactions must not create a local false-success state.
- Provide a transaction link to the official explorer.

---

## 14. API and Developer Readiness

Public API access is not required for the core MVP. However, keep internal normalized schemas stable enough that future authenticated API access is possible.

If an API is added:

- Version endpoints.
- Apply authentication and rate limiting.
- Validate inputs and limit expensive provider calls.
- Record provider latency/failure metrics.
- Do not publish API keys in frontend bundles.
- Document response provenance and limitations.
- Never expose another user's private saved briefs by default.

Future API consumers and agents must be able to distinguish source data, deterministic calculations, model-generated summaries, and missing evidence.

---

## 15. Standard Pages and Routes

The MVP will have **9 standard pages/routes**.

### 1. Home
**Route:** `/`

Purpose:
- Explain the product and its evidence-first boundary.
- Link to the workbench.
- Show accurate product status and available source coverage.
- Explain optional on-chain receipts without promising token rewards.

### 2. Workbench
**Route:** `/workbench`

Purpose:
- Compose a question, asset, time horizon, and research lens.
- Collect available evidence and display provider states.
- Show risk, invalidation, and missing-data sections.
- Save/export a structured brief.

### 3. Brief Detail
**Route:** `/brief/[briefId]`

Purpose:
- Display a saved brief and its evidence trail.
- Show timestamps, provider status, and limitations.
- Allow re-export and optional receipt creation where authorized.

### 4. Registry
**Route:** `/registry`

Purpose:
- Explain and initiate optional on-chain receipt registration.
- Display the connected wallet, network, contract, and transaction state.
- Explain exactly what data is committed.

### 5. Profile
**Route:** `/profile`

Purpose:
- Show the connected wallet's public receipt records.
- Display latest confirmed receipt and transaction links.
- Distinguish on-chain records from locally saved briefs.

### 6. History
**Route:** `/history`

Purpose:
- Search a public wallet or receipt ID.
- List recent on-chain receipt events.
- Show truthful empty, loading, and provider-error states.

### 7. Methodology
**Route:** `/methodology`

Purpose:
- Explain source policies, timestamps, stale-data rules, risk/invalidation, and receipt limitations.
- Document which features are live versus planned.

### 8. Privacy
**Route:** `/privacy`

Purpose:
- Explain collected data, local/backend storage, analytics, on-chain public data, and retention.

### 9. Terms
**Route:** `/terms`

Purpose:
- Describe product boundaries, third-party dependencies, data limitations, non-advisory status, and user responsibilities.

### Route summary

```text
/                     Home
/workbench            Workbench
/brief/[briefId]      Brief Detail
/registry             Registry
/profile              Profile
/history              History
/methodology          Methodology
/privacy              Privacy
/terms                Terms
```

**Total standard pages/routes: 9.**

Wallet modals, brief composer steps, source states, transaction confirmation, receipt success/failure, and other transient flows should remain inside these routes rather than becoming unnecessary standalone pages.

---

## 16. Frontend Instruction

This PRD intentionally contains **no visual design requirements**.

When it is time to build the frontend, the coding agent MUST read and follow **`frontend.md`**. That file is the source of truth for visual design, layout, components, typography, colors, responsive behavior, and interaction styling.

Do not invent or duplicate visual design requirements in this PRD.

---

## 17. Security, Privacy, and Reliability

### Data/provider security

- Keep provider API keys and LLM keys on the server.
- Apply request timeouts, rate limits, input validation, and output-size limits.
- Sanitize user-provided notes before rendering.
- Avoid unsafe rendering of arbitrary Markdown/HTML.
- Clearly identify the difference between data received from a provider and user-supplied material.
- Do not scrape services in violation of their terms.

### On-chain security

- Use checks-effects-interactions and reentrancy protections where relevant.
- Verify receipt inputs and schema lengths.
- Do not use unbounded loops.
- Avoid admin functions unless needed; document their scope.
- If a pause function exists, restrict it and document emergency conditions.
- Add unit tests for access, receipt submission, lookup, duplicate handling/versioning, pause behavior, and invalid inputs.
- Keep deployer keys and RPC credentials out of source control.

### Privacy

- Minimize personal data.
- Do not place full briefs, raw notes, API responses, private keys, or provider secrets on-chain.
- Warn users that wallet addresses, digests, transactions, and timestamps written on BOT Chain are public.
- Explain that a digest is only a commitment, not the underlying content.
- Provide a retention/deletion policy for any server-side saved briefs.
- If a brief has private user notes, require explicit opt-in before the receipt is published.

### Financial safety

- Do not execute or recommend trades.
- Do not claim guaranteed accuracy, return, or risk reduction.
- Label all calculated metrics and generated interpretations.
- Document stale data and source limitations.
- Do not present a provider outage as a zero value.

---

## 18. BOT Chain Network Configuration

The building agent MUST verify current network details against the official BOT Chain developer documentation before any deployment; do not rely only on values in this PRD.

The current official Quick Guide lists:

- **Mainnet:** Chain ID `677`, RPC `https://rpc.botchain.ai`, explorer `https://scan.botchain.ai`
- **Testnet:** Chain ID `968`, RPC `https://rpc.bohr.life`, explorer `https://scan.bohr.life`

Use these as initial references and re-check official docs at implementation/deployment time. Put configurable network values in an appropriate configuration/environment layer. Never hardcode a stale contract address or secret.

Official developer guide: https://dev-docs.botchain.ai/docs/Developers/quick-guide/

---

## 19. Technology Expectations

Use a standard, maintainable stack. Suggested options:

- Solidity
- Hardhat or Foundry
- TypeScript
- React/Next.js or another established web framework
- viem/wagmi or a maintained EVM wallet connector
- Small backend/API for source adapters and optional brief storage
- A database only if needed for saved briefs and indexed metadata

The coding agent may choose equivalent tools when they support BOT Chain correctly and reduce unnecessary complexity. Do not build an elaborate microservice architecture for this MVP.

---

## 20. MVP Non-Goals

Do NOT build these into the first version:

- Autonomous trading
- Trade execution or swap routing
- Custody of user funds
- Portfolio management
- Guaranteed market predictions
- A native token or airdrop promise
- Points with unstated future monetary value
- Complex social feeds or copy trading
- On-chain storage of full briefs
- Large-scale API marketplace
- Multi-chain deployments before BOT Chain works end-to-end
- Numerous provider integrations without reliable verification
- Model outputs that are not traceable to evidence

The MVP wins by delivering an honest, usable workflow and a verifiable receipt, not by pretending every planned intelligence feature is already live.

---

## 21. Milestone Roadmap

### M1 — Discovery and Foundation
- Inspect Kaverload's public product, whitepaper, launch note, and visible flows for functional inspiration only.
- Do not reuse its brand, copy, source code, or exact points mechanic.
- Initialize the repository, toolchain, test commands, and environment strategy.
- Verify BOT Chain configuration from official docs.
- Define a normalized brief schema and provider interface.

### M2 — Workbench MVP
- Implement asset/question inputs, time horizon, research lens, and structured local brief output.
- Add explicit unavailable/source-status states.
- Support save/export in a useful format.
- Ensure the product can work in local/manual mode without fabricated data.

### M3 — Evidence Adapters
- Integrate the first verified provider(s), limited to data that can be sourced reliably.
- Add provider timestamps, stale-data rules, source attribution, caching, and error handling.
- Separate raw values, derived calculations, and interpretations.
- Add tests for missing, conflicting, stale, and malformed data.

### M4 — Receipt Registry
- Implement and test `ResearchReceiptRegistry`.
- Add wallet connection/network handling.
- Add salted brief digest creation and receipt package export.
- Deploy on BOT Chain testnet.
- Show success only after confirmed transactions and link to explorer.

### M5 — History, Profile, and Documentation
- Add receipt history search and profile reads.
- Add methodology, privacy, and terms pages.
- Write README, architecture notes, contract assumptions, and threat model.
- Add end-to-end and regression tests.

### M6 — Testnet Pilot
- Run an end-to-end test with real users.
- Gather feedback about brief usability, source clarity, and receipt verification.
- Fix high-priority issues.
- Publish a 2–4 minute demo and a build log.

### M7 — Mainnet Readiness and Ecosystem Growth
- Review smart-contract security and operational setup.
- Verify deployed contracts and network information.
- Deploy to mainnet only after test coverage and review are satisfactory.
- Recruit at least 10 real testers/users as an initial traction target.
- Publish a builder tutorial or technical write-up and engage with the BOT Chain builder community.
- Track actual usage rather than estimating or fabricating traction.

---

## 22. Metrics

Track:

### Product usage
- Briefs started/completed
- Saved/exported briefs
- Returning workbench users
- Percent of briefs with complete source metadata
- Source failure/stale/conflict rates

### On-chain usage
- Unique wallets submitting receipts
- Receipt transactions
- Successful vs failed submissions
- Public history lookups
- Contract pause incidents if any

### Quality
- Provider response latency
- Error rate by provider
- Invalid/unresolved asset rate
- Receipt transaction failure rate
- User-reported data issues

### Ecosystem
- BOT Chain users brought to the product
- Number of public receipts that other projects reference
- Builder/tutorial engagement
- Integrations with other BOT projects or software agents

All metrics must be based on observable logs/events and labeled accurately.

---

## 23. Definition of Done

The MVP is complete only when:

- [ ] The application is deployed and usable.
- [ ] All 9 standard routes work.
- [ ] Workbench composes a structured brief from valid inputs.
- [ ] Brief outputs distinguish source facts, calculations, interpretation, and missing data.
- [ ] The product never invents live values or provider coverage.
- [ ] At least one verified data adapter works, or local/manual mode is clearly disclosed and the adapter limitation documented.
- [ ] Source timestamps and stale/provider-error states are handled.
- [ ] A brief can be saved/exported.
- [ ] The user can optionally create a salted research receipt.
- [ ] The receipt commits only a digest/limited metadata, not raw private brief content.
- [ ] Contract tests cover success and failure cases.
- [ ] Wallet/network handling works.
- [ ] A successful transaction generates a verifiable receipt and explorer link.
- [ ] Failed/rejected transactions never show as successful.
- [ ] Public history and profile read confirmed records accurately.
- [ ] Privacy, methodology, terms, README, and threat model are complete.
- [ ] BOT Chain settings were re-verified from official docs before deployment.
- [ ] A 2–4 minute demo is prepared.
- [ ] Real user testing is documented.
- [ ] Public repo has meaningful, continuous commit history.
- [ ] Mainnet is deployed or there is a clearly documented path to mainnet.

---

## 24. Git Commit Rules

Git commits are a required part of the development process.

During the build, commit changes continuously instead of waiting until the entire project is finished.

### Commit Frequency

For a normal build, aim for **50+ meaningful commits** across the development process.

Do NOT create 50 meaningless commits just to reach the number. Every commit should represent a real, completed development step.

Make a commit whenever you complete a logical unit of work, such as:

- Creating a new page
- Creating or modifying a component
- Adding a feature
- Implementing an API endpoint
- Adding database functionality
- Adding authentication logic
- Adding validation
- Adding error handling
- Connecting frontend to backend
- Adding a utility/helper
- Adding a configuration
- Refactoring a specific section
- Fixing a bug
- Improving an existing feature
- Adding tests
- Fixing failing tests
- Improving responsiveness
- Fixing accessibility issues
- Updating documentation
- Completing a route
- Completing a major UI section
- Integrating an external service

### Commit Process

After completing each logical development unit:

1. Check the current changes.
2. Verify that the changes work.
3. Stage only the relevant files.
4. Create a descriptive commit.
5. Continue building from the committed state.

Use conventional commit messages where appropriate:

- `feat: add workbench composer`
- `feat: add wallet connection`
- `feat: implement provider adapters`
- `feat: add research receipt registry`
- `fix: handle unavailable market data`
- `refactor: normalize brief serialization`
- `test: add receipt registry tests`
- `style: improve mobile workbench`
- `docs: update setup instructions`

### Important Rules

- Do NOT wait until the end of the project to commit everything.
- Do NOT make one giant commit containing the entire project.
- Do NOT create fake changes solely to increase the commit count.
- Do NOT repeatedly modify and commit the same thing without a meaningful reason.
- Keep commits small, focused, and logically separated.
- Before moving to the next major feature, make sure the previous feature has been committed.
- If a task contains several independent steps, commit each completed step separately.
- If you encounter and fix a bug during development, commit the fix separately.
- If you make a meaningful refactor, commit it separately.

### Target

For a substantial project, aim for **50+ meaningful commits by the time the build is complete**, distributed naturally throughout development.

The commit history should clearly show the progression of the project from initial setup → individual features → integrations → fixes → testing → polish → final state.

At the end of the build, run `git log` and verify that the history accurately reflects the development process.

---

## 25. Build Rules for the Coding Agent

1. Read this PRD in full before coding.
2. Read and follow `frontend.md` before frontend implementation.
3. Keep all visual/design requirements in `frontend.md`, not this PRD.
4. Use Kaverload as product-narrative reference only; do not copy its brand, source code, exact text, or unique contract mechanic.
5. Verify BOT Chain network settings against official docs at build and deployment time.
6. Do not fabricate live data, sources, users, activity, or analytics.
7. Keep all provider/LLM secrets on the server.
8. Do not execute trades, custody funds, or issue a token.
9. Treat a research receipt as proof of digest registration, not proof of truth.
10. Test provider failure handling and contract edge cases before release.
11. Commit continuously according to the Git Commit Rules.
12. Document assumptions, trust boundaries, limitations, and data sources.
13. Complete every Definition of Done item before declaring the build finished.
14. Run `git log` at completion and verify that it reflects the real development process.

---

## 26. Final Positioning

> **Loxen is a market-context workspace that turns a question into an inspectable research brief, makes missing evidence visible, and lets users timestamp a brief digest on BOT Chain.**

The product loop is:

**Frame the question → inspect evidence → define risk and invalidation → produce a structured brief → optionally record an on-chain receipt.**

Build the trustworthy core first. Live intelligence, agent access, and richer integrations should only expand when the necessary data sources, permissions, monitoring, and reliability can be verified.
