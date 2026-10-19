# FRONTEND.md — Loxen

The source of truth for Loxen's visual design, layout, components, copy and interaction. The PRD
(`Loxen_PRD.md`) decides what the product does; this file decides how it looks and reads. Built with the
`design-taste-frontend` skill: direction `one-motif` (seed 1730592820) for the public pages, app style
`data-terminal` (seed 1738231979) for the working screens, one shared palette and typeface.

---

## 1. Who it is for, and the one action per page

**Readers.** People who prepare a view on a token or contract before they act on it: individual
market researchers, on-chain users and builders on BOT Chain, analysts who publish notes to a small
community. They already read charts and explorers. What they lack is one place that keeps facts,
assumptions, calculations and the model's words apart, and that admits what is missing. Later,
software agents read the same brief schema.

| Route | Kind | The one action it drives | The question it answers first |
| --- | --- | --- | --- |
| `/` | page | Open the workbench (with the question already typed) | What is this, and will it lie to me? |
| `/workbench` | app | Save the brief | Is this brief ready, and what is still missing? |
| `/brief/[briefId]` | app | Export the brief, or prepare its receipt | What does this brief rest on, and how old is it? |
| `/registry` | app | Commit a receipt (after reading exactly what is written) | What goes on-chain, and is my wallet ready? |
| `/history` | app | Search a wallet or receipt ID | Was this digest recorded, and when? |
| `/profile` | app | Open a receipt or a local brief | What have I recorded, and what is only on this device? |
| `/methodology` | page | Open the workbench | How does Loxen decide what to call live, stale or missing? |
| `/privacy` | page | (read) | What is stored, where, and for how long? |
| `/terms` | page | (read) | What Loxen is not, and what I am responsible for. |

---

## 2. Visual direction

### Thesis

**The evidence tag.** In an evidence room every exhibit carries a tag: a stiff card with chamfered
top corners and a punched hole, on which someone wrote where the thing came from, when, and in what
state. Loxen does that for every value in a market brief. The tag is the one motif: it is drawn
enormous and gold on the hero, it masks every archival picture, it is the shape of the primary
button and the bullet beside list items, and it is the Loxen mark. Market feeds have never carried
their own tags. The archive pictures on the site show that (Edison's ticker, Daumier's readers of the
quotations, Keppler's "inflated values") and Loxen answers it.

On this page, **the evidence tag (source, time, status, written on every value)** becomes **the one
motif that runs the whole system**.

**The live thing (home).** "What goes on-chain": type a brief question and the page computes, in the
browser, the exact `keccak256` digest a receipt would commit, with a fresh random salt. Two columns
show what stays with you (the text, your notes, the salt) and what BOT Chain would see (64 hex
characters, schema `loxen.brief/1`, your wallet, the block time). "New salt" changes every character
of the digest. Without script it shows a worked example.

### Palette

Bottle green and gold, as the ledger lamp and the "Gold & Stock" ticker. One ground, one ink, one
accent. Gold is both the ink and the accent on the public pages; on the app screens running text goes
to a warm paper white and gold is kept for the 1px selection line, the primary action and the main
data mark.

**Public pages**

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#133621` | the ground, everywhere |
| `--surface` | `#1a4429` | the printed card, panels one step up |
| `--surface-2` | `#215234` | the second field colour (bars, tiles) |
| `--ink` | `#f4d96c` | all type, the motif, the button fill |
| `--muted` | `#c9bb73` | secondary notes (≥ 4.5:1 on `--bg` and `--surface`) |
| `--accent` | `#f4d96c` | the button, the motif |
| `--accent-ink` | `#133621` | text on gold |
| `--paper` | `#f4eedb` | the coverage sheet and the dialog |
| `--paper-ink` | `#133621` | text on paper |

**App screens** (data-terminal roles mapped onto the brand; cards are darker than the ground)

| Token | Value | Role |
| --- | --- | --- |
| `--ground` | `#10301d` | rail, title row, page |
| `--surface` | `#0b2314` | cards (darker than the ground) |
| `--raised` | `#173d26` | inputs, nested wells, hover |
| `--border` | `#1f4a30` | card edges (1px) |
| `--rule` | `#173d26` | row rules |
| `--control` | `#3a6b4b` | control borders |
| `--text` | `#f4eedb` | primary text and figures |
| `--muted` | `#b9b28f` | secondary text (≥ 4.5:1 on `--surface`) |
| `--faint` | `#9c9677` | meta, placeholders (≥ 4.5:1 on `--surface`) |
| `--accent` | `#f4d96c` | 1px selection line, primary fill, the main data mark |
| `--positive` | `#8fd6a5` | a rule that holds |
| `--negative` | `#f2958a` | a conflict, a failed or reverted transaction |
| `--warning` | `#e8c46a` | stale |

Status colours never appear without their shape and word (see §4, Status mark).

### Type

Two typefaces, and the second has one job.

- **General Sans** (Fontshare, 400/500/700) for everything.
- **JetBrains Mono** (Google Fonts, 400) only for machine strings: digests, salts, transaction
  hashes, contract and wallet addresses, receipt IDs, inside `<code>`. Never for labels or prices.

Public scale, five steps: small `14px` · body `18px` (16px phone) · lead `24px` · head
`clamp(36px, 5vw, 72px)` · display `clamp(44px, 7.4vw, 120px)`. Display: 700, tracking −0.02em,
leading 0.92. Text: 400, leading 1.45–1.55, measure 45–68ch.

App scale: `12` meta and axis · `14` body, cells, nav · `16` card titles (500) · `24` page title (600)
· `13` mono IDs. Tabular figures on every number.

### Spacing scale

4px base: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 192`.
Public pages: outer margin `clamp(16px, 2.5vw, 32px)`, 12 columns, 16px gutter, sections 128–192px
apart on desktop and 72–96px on a phone. App: 16px gap everywhere (one gutter), card padding 20px,
canvas padding 24px desktop / 16px phone, control height 34px (44px on touch), table rows 42px, list
rows 28px pitch for single lines and 44px for two lines.

### Shape

Square corners everywhere except the motif's own geometry: the tag (top two corners chamfered at
14% of the shorter side, a round hole centred 9% below the top). Buttons are small tags: 6px
chamfers on the top corners, square at the bottom. The app keeps one 4px radius for inputs and
cards.

### Motion rules

- **Signature (home):** the hero's tag stage crossfades slowly between three archive pictures, 1.6s
  fades, 6s holds; it pauses when the tab is hidden and shows only the first under reduced motion.
- **Entrances (public pages):** inside each section, heading, then text, then picture, staggered
  70ms, rising 24px with opacity over 800ms `cubic-bezier(.16,1,.3,1)`, fired once at 85% of the
  viewport. Lists arrive row by row (60ms). Content is visible without script: the hidden start
  state is applied only by a class that script adds.
- **One moving picture:** the teleprinter clip as a muted loop with its poster, beside the receipt
  section.
- **Feedback:** press 140ms (translateY 1px), hover 180ms (tone step, the gold underline grows from
  the left), focus a 2px gold outline offset 2px. The live digest changes character by character
  with no animation, because it updates on every keystroke.
- **App screens:** no entrances. Feedback only (hover tone step, the 1px gold line moving under a
  tab in 240ms, a sheet opening from the bottom on the phone in 300ms).
- Transform and opacity only. Every move has a `prefers-reduced-motion` version that keeps the
  finished state.

---

## 3. Pages and sections, in build order

Copy below is final copy, written from the PRD. Sample content that must be confirmed before launch
is listed in §6.

### 3.1 Home `/` (build first)

**Navigation.** Wordmark "Loxen" (with the tag mark) · Registry · History · Methodology · button
**Open the workbench**.

**Hero, the striped card beside the stage.** Split 50/50 on desktop with 12px gaps. Left: the
printed card (`--surface`) with a band of gold and green 28px bars across its top. Right: sticky,
an enormous gold tag cropped by the viewport's right edge, holding the archive picture (multiplied
into the gold) and its caption.

- h1: **Market briefs that show their gaps**
- Supporting line: Loxen is a workspace for one market question at a time. Every value carries its
  source, timestamp and status, and anything missing stays marked as missing.
- Button: **Open the workbench** · text link: How Loxen handles evidence
- Card foot links: Registry · History · Methodology
- Picture caption: Edison's Universal stock printer, 1870s. It printed prices with no source, no
  time and no status.

**Section: One question, four lenses** (square plate, spare text). Left: the example brief as a
working interface fragment inside a tag-shaped stage. Right: four tabs (Market structure ·
Liquidity · On-chain activity · Risk and invalidation) that switch the fragment, the title, a
description, and two action cells.

- Title: **One question, four lenses**
- Market structure: Price range, order book depth and where the asset trades, each with the venue
  it came from and the minute it was read.
- Liquidity: Pool depth, volume and what a trade of your size would move, kept apart from the
  slippage Loxen calculates from them.
- On-chain activity: Holders, transfers and contract verification from BOT Chain, with the block
  each figure was read at.
- Risk and invalidation: The conditions that would make your view less credible, each with the data
  it needs and a plain "cannot evaluate" when that data is missing.
- Action cells: **Open the workbench** · **Read the method**

**Section: Where the time goes** (stages as one bar). One bar across the page, segments sized by
the share of the work.

- Heading: **Where the time goes**
- Frame the question · *About a minute* · First, name the asset, the horizon and the one lens
  you are reading it through.
- Gather the evidence · *Most of the work* · Then enter or fetch each value, with its source and
  the time you read it.
- Write the invalidation · *Ten minutes* · Next, say what would prove the view wrong and what data
  that needs.
- Save, export, or record · *One signature* · Last, keep it on this device, export it, or commit its
  digest to BOT Chain.

**Section: Six honest states** (close-ups on a board). Eight tiles: the heading tile and one tile
per state, each a status mark enlarged until the tile crops it, plus one tile for the kinds of
content.

- Heading: **Six honest states**
- Unavailable · The provider is not configured or did not answer. The row stays, with a dash and
  the reason, never a zero.
- Conflicting · Two sources disagree by more than the threshold. Both values are shown and neither
  is chosen for you.
- Stale · Older than the horizon allows. The value keeps its real timestamp and its age.
- Cached · Read earlier from a provider whose terms allow it. Never labelled live.
- User supplied · Typed in by you, with the source you name. Kept apart from provider data.
- Live · Fetched from a configured provider for this brief, with the provider's own timestamp.
- Four kinds of content · Source data, calculation, model interpretation and your assumptions each
  carry their own label in every export.

**Band: Inflated values** (the one full-width picture band, Keppler 1901 in a tag-shaped mask).

- Statement (paragraph, ≤ 25 words): A confident paragraph is cheap. Loxen keeps every claim next to
  the value it rests on, and marks the model's words as the model's.
- Caption: "Wall Street Bubbles: Always the Same", Udo Keppler for Puck, 1901.

**Section: Source coverage** (the printed sheet, on Daumier's lithograph as a full-bleed ground).
A paper sheet with scalloped edges, rendered from the provider configuration, so it is true for
this build.

- Sheet title: **Source coverage**
- Note: What this build can read for you today, and what you enter by hand.
- Groups and rows: computed by `coverage()` in `src/lib/providers.ts` from the enabled providers, so the
  sheet can never claim a live source that is switched off. With the default providers, On-chain
  activity shows Contract verification, Holder count, Total supply and Total transfers as Live
  (BOTScan, BOT Chain RPC); prices, liquidity and volume stay Manual entry.
- Sheet foot (two lines): Live rows fill in when you give a BOT Chain contract address. The rest you
  enter by hand. / A provider is added only after its terms, limits and attribution are checked.
- Picture caption: Daumier, "Croquis parisiens", 1865: "Look at the stock prices… are our shares
  going up?" "At the moment only the barometer is."

**Section: What goes on-chain** (the live thing). Left: heading, text and the digest tool. Right:
the 1882 telegraph receipt in a tag mask, with the teleprinter loop beneath it.

- Heading: **What goes on-chain**
- Text: A receipt records that your wallet committed a digest at a block. It does not record your
  brief, and it does not make the brief true.
- Tool, field label: Your question · default text: What would make this pool too thin for a two-week
  view? · button: New salt
- Column "Stays with you": the brief text · your private notes · the 32-byte salt
- Column "Written to BOT Chain": the digest · schema `loxen.brief/1` · your wallet address · the
  block and its time
- Under the tool: Download the receipt package (brief, salt, schema and receipt fields) and anyone
  can check the digest against the brief you choose to show them.
- Picture caption: Receipt for an inland telegram, Akyab, 1882. Rule I on the back: "The accuracy
  of messages is not guaranteed."

**Section: Before you start** (tabbed index cards; one open at a time, the first open on load).

- Advice · Is a brief a recommendation? · No. Loxen helps you write down a question, the evidence
  and the conditions that would change your mind. It never tells you to buy or sell, and a brief is
  not a signal.
- Trades · Does Loxen trade or hold funds? · No. There is no swap, no order and no custody. The only
  transaction Loxen ever asks you to sign records a digest, and you pay the network gas yourself.
- Token · Is there a Loxen token or points? · No token, no points and no airdrop. A receipt is not
  transferable and earns nothing.
- Privacy · What is public on BOT Chain? · Your wallet address, the digest, the schema version, the
  transaction and its block time. Your brief, notes and salt stay with you unless you publish them.
- Missing data · What happens when a source is down? · The row stays and says Unavailable, with the
  reason and the last good time if there is one. A provider outage is never shown as zero.
- Wallet · Do I need a wallet? · Only to commit a receipt. Composing, saving and exporting work
  without one.

**CTA: Start with the question** (first step, already open). Gold field. Left, bottom: closing line
and sentence. Right: the "New brief" dialog as the product renders it.

- Closing line: **Start with the question**
- Sentence: The workbench opens with your question, asset field and horizon filled in. Nothing is
  sent anywhere until you choose to.
- Dialog title: New brief · field: Question (editable example: "What would make this pool too thin
  for a two-week view?") · choice: Horizon, 1–7 days | 1–4 weeks · button **Open the workbench**
  (carries `?q=` and `?h=` into `/workbench`).

**Footer: the mark, built large.** The word LOXEN built from five gold tag-shaped blocks of
different heights. Columns: Product (Workbench, Registry, History, Profile) · Method (Methodology,
Privacy, Terms) · BOT Chain (Mainnet explorer, Testnet explorer, Developer docs) · Pictures (credit
lines). Contact lines: BOT Chain mainnet, chain ID 677 / testnet, chain ID 968. Last row: © 2026
Loxen. Research tool, not financial advice. · small button **Open the workbench**.

### 3.2 Workbench `/workbench`

Shell: icon rail (56px) with the tag mark at the top: Workbench, Registry, History, Profile; then
Methodology at the bottom. On the phone it becomes a bottom bar with labels.

**Title row.** h1 = the question once typed, "New brief" before. Subline (the finding, computed):
"7 of 12 parts filled · 3 values unavailable · 1 rule cannot be evaluated". Right: a freshness note
"Saved on this device 14:02" or "Not saved", **Save brief** (the one gold primary), Export (menu:
Markdown, JSON).

**The twelve-part strip** (signature element). Under the title, twelve cells naming the brief's
parts (Question, Asset, Horizon, Evidence, Sources, Timestamps, Status, Context, Risks,
Invalidation, Unknowns, Limitations). A filled part is set in text colour with a gold 1px line under
it, an empty part shows a grey dash. Clicking a cell scrolls the composer to it.

**Composer (left, 7 of 12 columns).** Cards in this order:

1. *Question.* Label "What are you trying to find out?" · helper "One question. You can change it
   later." 
2. *Asset.* Label "Symbol, name or contract address" · network select (BOT Chain mainnet · 677,
   BOT Chain testnet · 968, Another EVM chain, Not on a chain). Address validation inline:
   "Looks like a contract address (42 characters, checksum valid)" or "This is not a valid
   address: 0x followed by 40 hexadecimal characters." A symbol with no configured provider reads:
   "No provider can resolve symbols in this build. Enter the contract address to be sure which asset
   you mean."
3. *Horizon and lens.* Two segmented rows: Intraday · 1–7 days · 1–4 weeks · Longer-term, and
   Market structure · Liquidity · On-chain activity · Risk and invalidation. Selection is the 1px
   gold line under the label.
4. *Sources.* One row per provider from the configuration with its state ("Not configured in this
   build", "Last good fetch 13:58", "Timed out after 8 s") and the sentence "Manual mode: every
   value below is entered by you and marked User supplied."
5. *Evidence.* A table: metric, value (right-aligned with unit), kind (Source data · Calculation ·
   Interpretation · Assumption), source, observed at, status mark. "Add evidence" opens an inline
   row form. Rows that are known to the lens but empty show as Unavailable with the reason.
6. *Risks and invalidation.* Rule list: each rule names its type (Measured threshold or
   Qualitative), the data it needs, and whether it can be evaluated ("Cannot evaluate: pool
   liquidity is unavailable"). "Add from template" lists the templates for the selected lens;
   suggestions are labelled "A prompt to consider, not a verified fact."
7. *Unknowns and limitations.* Free text with the computed list above it (unavailable values,
   stale values, provider gaps).

**Brief preview (right, 5 of 12 columns, sticky).** The structured output exactly as it will be
exported: the twelve parts in order, every value with its status mark, and a header line stating
the mode: "Generated from user-provided inputs and local template logic. No live sources." Under
it the digest preview (mono, truncated, copy button).

**Phone.** Two tabs at the top: Compose · Brief. The strip becomes a horizontal scroller. Save stays
in the title row; Export moves into a kebab.

### 3.3 Brief detail `/brief/[briefId]`

- Breadcrumb: Briefs on this device / the brief's short ID.
- h1: the question. Subline: asset · network · horizon · lens · "Saved 19 Oct 2026, 14:02" · schema
  `loxen.brief/1`.
- Record pill: "Only on this device" or "Receipt confirmed at block 1,204,557".
- Main column: Evidence trail table (as in the workbench, read-only, with "observed at" and age),
  then Market context, Risks, Invalidation (with evaluability), Unknowns, Limitations.
- Right rail (384px): Record. Actions: Export Markdown, Export JSON, **Prepare receipt** (to
  `/registry?brief=…`). When committed: receipt ID, digest, transaction hash, block, owner, each
  with copy and a BOTScan link.
- Not found: "No brief with this ID is saved on this device. Briefs are stored in this browser
  only; open the device you saved it on, or import its JSON."

### 3.4 Registry `/registry`

- h1: Research receipt. Subline: "Records a digest of one brief against your wallet on BOT Chain.
  The brief itself is not published."
- Left: *Choose a brief* (select of local briefs) → *What is written* (a table of field, value,
  public: Owner · Digest · Schema version · Block time, all "Public"; Brief text · Private notes ·
  Salt, all "Stays with you") → *Private notes* checkbox, unchecked by default: "Include my private
  notes in the digest. They stay private; only the digest changes." → Salt (mono, New salt).
- Right: *Wallet and network.* Connected wallet, active network with chain ID, the expected
  network, contract address. States: "No wallet found in this browser", "Connect wallet", "Wrong
  network: connected to chain 1, the registry is on BOT Chain testnet (968). Switch network",
  "Registry contract is not configured for this deployment. Receipts cannot be committed yet."
- Transaction state, one line each with its mark: Ready to sign · Waiting for your wallet ·
  Submitted, waiting for confirmation · Confirmed at block N · Rejected in your wallet · Reverted ·
  No confirmation after 120 s. Only "Confirmed" shows the receipt and enables the package download.
- Primary: **Commit receipt**, disabled with its reason in words until every check passes.

### 3.5 History `/history`

- h1: Receipt history. Subline: "Public receipts recorded on BOT Chain by the Loxen registry."
- Search (one field): "Wallet address or receipt ID". Result states: "No receipt found for 0x12…ab
  on BOT Chain testnet." (a real empty answer) versus "Couldn't read the registry: RPC did not answer
  after 8 s. This is not the same as no receipts. Retry".
- Recent receipts table: Receipt ID · Owner · Digest · Schema · Block · Time · Transaction (BOTScan
  link). Capped at 20 with "Load older".
- When the contract is not configured: the table keeps its header and one sentence: "The registry
  address is not set for this deployment, so no events can be read."

### 3.6 Profile `/profile`

- h1: Your records. Subline: connected wallet and network, or "Connect a wallet to see receipts it
  committed. Local briefs are listed either way."
- Two blocks side by side, never merged: **On BOT Chain** (receipt count where verifiable, latest
  confirmed receipt, list) and **Only on this device** (local briefs with saved time, open, export,
  delete with confirmation naming the brief).
- Receipt count shows a grey dash, never 0, when the registry cannot be read.

### 3.7 Methodology `/methodology` (page)

- h1: **How Loxen handles evidence**
- Lead: The rules behind every status mark, timestamp and receipt, and which parts of Loxen are
  live today.
- Sections: The source record (each field and why) · Six states (definition, when it applies) ·
  Stale thresholds by horizon (Intraday 15 minutes, 1–7 days 6 hours, 1–4 weeks 24 hours,
  Longer-term 7 days) · Conflicts (prices more than 2% apart, volumes and counts more than 10% apart,
  both values shown) · Four kinds of content · Risk and invalidation · Model use (off in this build;
  rules for when it is on) · Receipts (how the digest is built, what it proves, what it does not) ·
  Live and planned (a table).
- Pictures: "The Tapeworm" (Nankivell, 1907) beside the stale-data section; Edison's ticker beside
  the source record.

### 3.8 Privacy `/privacy` (page)

- h1: **What Loxen keeps, and where**
- Sections: In this browser · On our servers (none in this version) · Analytics (none in this
  version) · Your wallet · On BOT Chain (public and permanent) · Private notes · Retention and
  deletion · Changes to this policy. "Last updated 19 October 2026."

### 3.9 Terms `/terms` (page)

- h1: **Terms of use**
- Sections: What Loxen is · What Loxen is not · Not financial advice · Data and its limits ·
  Third-party services (BOT Chain, BOTScan, wallets, data providers) · Research receipts · Your
  responsibilities · No token or rewards · Changes. Picture: the telegraph receipt's back, with Rule
  I quoted.

---

## 4. Components

| Component | Desktop | Phone |
| --- | --- | --- |
| **Tag mark / TagShape** | The motif as a CSS `clip-path` (two chamfered top corners) with a ground-coloured hole. Sizes: 16px (bullet, mark), 40px (button), 640px+ (hero stage). | Same geometry; the hero tag becomes a 48svh stage above the card. |
| **Button (tag)** | Gold fill, green text, 6px top chamfers, 48px tall, 18px/500. Press moves 1px down. | 52px tall, full width in the CTA dialog. |
| **Site nav** | Wordmark left, three links, one button; plain bar on the ground. | Wordmark and the button; links in a sheet behind "Menu". |
| **Status mark** | Shape + word: Live ● filled gold dot · Cached ○ hollow dot · User supplied ■ filled square · Stale ◐ half dot in warning · Conflicting ●● two dots in negative · Unavailable — dash in a dashed 1px slot. 12px shape, 12–14px label. | Same; the word may drop to an icon-only mark with the word in `aria-label` inside dense rows only. |
| **Twelve-part strip** | 12 equal cells in one row under the title. | Horizontal scroll inside its own row; the page never scrolls sideways. |
| **Segmented control** | Labels in a row; the selected one carries a 1px gold line under it, as wide as the label. | Scrolls sideways when it does not fit. |
| **Evidence table** | Columns as in §3.2, values right-aligned and tabular. | Two-line rows: metric and value on line 1; kind, source, time and status on line 2 in 13px grey. |
| **Rule row** | Rule text, type, required data, evaluability on one row. | Stacked: rule, then a grey line with type and evaluability. |
| **Machine string** | JetBrains Mono 13px, truncated to 10 characters with an ellipsis in the middle, copy button 12px after. | Same. |
| **Wallet panel** | Right column card with network, contract and transaction state. | Moves above the brief selection as a one-line summary ("Wallet not connected · Connect"). |
| **Empty and error block** | Keeps its frame and header; one sentence spanning the block; Retry as a text button. | Same. |
| **Index cards (FAQ)** | Overlapping filled cards, tab steps 150px right per card. | Tabs 120px wide stepping 48px. |
| **Coverage sheet** | 640px paper sheet with scalloped top and bottom, on the Daumier ground. | Full width less 10px each side, 28px padding. |
| **Icon rail** | 56px, gold tag mark top, 18px outline icons on a 44px pitch, the active item a 1px gold bar on the rail's right edge, tooltips. | Bottom bar, five items with labels. |

---

## 5. Avoid

- A centred hero over three icon cards, the stock order of hero, logos, three features,
  testimonial, pricing and CTA.
- Eyebrow labels, pill badges above headings, "New ·" chips, tiny tracked uppercase labels.
- Monospace anywhere but machine strings in `<code>`. Index numbers (01, 02, Step 1).
- Gradients, glows, glass and backdrop blur, shadows on resting things, hairline dividers on public
  pages.
- Violet, indigo, cream with terracotta, neon on dark, a navy sidebar.
- A styled accent word in a headline. More than two typefaces.
- Fake dashboards: grey bars, invented "live" prices, invented user counts, testimonials, partner
  logos, "trusted by". On the app screens: KPI tiles with icons in tinted circles, sparklines,
  "+12.5%" pills, zebra tables, uppercase headers, a zero where a value is unavailable.
- Words of the genre: unlock, supercharge, seamless, empower, AI-powered, next-generation.
- Any page that implies a brief is a signal, a recommendation, or a source of returns.

---

## 6. Sample content to confirm before launch

- The example brief on the home page (question, the user-supplied holder count and its source) is
  illustrative and labelled "Example".
- The stale thresholds (15 min, 6 h, 24 h, 7 days) and conflict thresholds (2%, 10%) are Loxen
  defaults chosen here; confirm or change them in `src/lib/schema.ts`.
- The work shares in "Where the time goes" are estimates, not measurements.
- Privacy and Terms copy describe this build (no server storage, no analytics) and need review
  before launch, and again whenever a backend or analytics is added.
- Picture credits: see `public/archive/credits.json`; each picture is credited in the footer.
