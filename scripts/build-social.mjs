// Generates the X (Twitter) profile photo and header in public/brand/social/, as SVG sources and PNG
// uploads. They reuse the logo geometry and the site's palette, stripe and tag. The PNGs are rendered
// in an installed browser so the headline uses General Sans. Run: node scripts/build-social.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { MARK } from "./build-brand.mjs";

const BG = "#133621"; // site --bg
const SURFACE = "#1a4429"; // site --surface
const GOLD = "#f4d96c"; // site --ink
const MUTED = "#c9bb73"; // site --muted
const FONT = "https://api.fontshare.com/v2/css?f[]=general-sans@500,700&display=swap";
const MONO = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap";
const OUT = "public/brand/social";

const mark = (x, y, h, fill) => {
  const s = h / MARK.h;
  return `<path fill="${fill}" fill-rule="evenodd" transform="translate(${+x.toFixed(2)} ${+y.toFixed(2)}) scale(${+s.toFixed(4)})" d="${MARK.d}"/>`;
};

// Profile photo, 400 × 400. X crops it to a circle, so the mark stays inside the middle 55%. The mark
// is nudged right and up by a few units so its visual weight, which sits in the foot, reads as centred.
function profile() {
  const size = 400;
  const h = 210;
  const w = (MARK.w * h) / MARK.h;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
<rect width="${size}" height="${size}" fill="${BG}"/>
${mark((size - w) / 2 + 6, (size - h) / 2 - 4, h, GOLD)}
</svg>
`;
}

// Header, 1500 × 500. The profile photo covers the lower left on desktop and X trims the top and
// bottom on some phones, so the headline sits high on the left and nothing important is in the bottom
// 120 px of the first 420 px.
function header() {
  const W = 1500;
  const H = 500;
  const bar = 28;
  const stripe = Array.from({ length: Math.ceil(W / (bar * 2)) }, (_, i) => `<rect x="${i * bar * 2}" width="${bar}" height="44"/>`).join("");

  // The site's tag: clipped top corners and a punched hole, bleeding off the bottom edge.
  const tx = 1060;
  const tw = 340;
  const ty = 92;
  const c = 64;
  const tag = `M${tx + c} ${ty}H${tx + tw - c}L${tx + tw} ${ty + c}V${H + 10}H${tx}V${ty + c}Z`;
  const hole = { x: tx + tw / 2, y: ty + 44, r: 20 };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>@import url("${FONT}");text{font-family:"General Sans",sans-serif}</style>
<rect width="${W}" height="${H}" fill="${BG}"/>
<rect x="40" y="0" width="${W - 80}" height="${H}" fill="${SURFACE}"/>
<g fill="${GOLD}">${stripe}</g>
<path fill="${GOLD}" d="${tag}"/>
<circle cx="${hole.x}" cy="${hole.y}" r="${hole.r}" fill="${SURFACE}"/>
${mark(tx + (tw - 150 * (MARK.w / MARK.h)) / 2 + 4, 230, 150, BG)}
<text x="100" y="196" fill="${GOLD}" font-size="80" font-weight="700" letter-spacing="-2.4">Market briefs that</text>
<text x="100" y="278" fill="${GOLD}" font-size="80" font-weight="700" letter-spacing="-2.4">show their gaps</text>
<text x="102" y="338" fill="${MUTED}" font-size="26" font-weight="500">Every value sourced, timed and marked. Receipts on BOT Chain.</text>
</svg>
`;
}

// Mainnet announcement image, 1600 × 900 (16:9, X's in-feed size). The tag on the right is drawn as the
// receipt itself, carrying the real deployment values.
function mainnet() {
  const W = 1600;
  const H = 900;
  const bar = 28;
  const stripe = Array.from({ length: Math.ceil(W / (bar * 2)) }, (_, i) => `<rect x="${i * bar * 2}" width="${bar}" height="56"/>`).join("");

  const tx = 1060;
  const tw = 440;
  const ty = 150;
  const c = 80;
  const tag = `M${tx + c} ${ty}H${tx + tw - c}L${tx + tw} ${ty + c}V${H + 10}H${tx}V${ty + c}Z`;
  const rows = [
    ["Network", "BOT Chain mainnet"],
    ["Chain ID", "677"],
    ["Block", "27,948,210"],
    ["Contract", "0x4e76…941298"],
    ["Source", "Verified, BOTScan"],
    ["Digest", "keccak256"],
  ];
  const rx = tx + 48;
  const table = rows
    .map(
      ([k, v], i) =>
        `<text class="m" x="${rx}" y="${400 + i * 62}" fill="#4a5a3f">${k}</text><text class="m" x="${rx}" y="${428 + i * 62}" fill="${BG}">${v}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>@import url("${FONT}");@import url("${MONO}");text{font-family:"General Sans",sans-serif}.m{font-family:"JetBrains Mono",monospace;font-size:22px}</style>
<rect width="${W}" height="${H}" fill="${BG}"/>
<rect x="40" y="0" width="${W - 80}" height="${H}" fill="${SURFACE}"/>
<g fill="${GOLD}">${stripe}</g>
<path fill="${GOLD}" d="${tag}"/>
<circle cx="${tx + tw / 2}" cy="${ty + 56}" r="26" fill="${SURFACE}"/>
<text x="${rx}" y="330" fill="${BG}" font-size="24" font-weight="700" letter-spacing="3">RESEARCH RECEIPT</text>
<line x1="${rx}" x2="${tx + tw - 48}" y1="356" y2="356" stroke="${BG}" stroke-width="2"/>
${table}
${mark(100, 140, 40, GOLD)}
<text x="146" y="174" fill="${GOLD}" font-size="34" font-weight="700" letter-spacing="-0.5">Loxen</text>
<text x="102" y="350" fill="${MUTED}" font-size="26" font-weight="500" letter-spacing="3">MAINNET DEPLOYMENT</text>
<text x="96" y="460" fill="${GOLD}" font-size="96" font-weight="700" letter-spacing="-3">Live on</text>
<text x="96" y="560" fill="${GOLD}" font-size="96" font-weight="700" letter-spacing="-3">BOT Chain</text>
<text x="100" y="660" fill="${MUTED}" font-size="30" font-weight="500">A salted digest of a research brief,</text>
<text x="100" y="702" fill="${MUTED}" font-size="30" font-weight="500">recorded on-chain as a public receipt.</text>
</svg>
`;
}

await mkdir(OUT, { recursive: true });
const sources = {
  "loxen-x-profile": [profile(), 400, 400],
  "loxen-x-header": [header(), 1500, 500],
  "loxen-x-mainnet": [mainnet(), 1600, 900],
};

const browser = await chromium.launch({ channel: process.env.E2E_BROWSER_CHANNEL ?? "msedge" });
for (const [name, [svg, w, h]] of Object.entries(sources)) {
  await writeFile(`${OUT}/${name}.svg`, svg);
  for (const scale of [1, 2]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
    await page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="${FONT}"><link rel="stylesheet" href="${MONO}"></head><body style="margin:0">${svg}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.locator("svg").screenshot({ path: `${OUT}/${name}${scale === 2 ? "@2x" : ""}.png` });
    await page.close();
  }
}
await browser.close();
console.log(`Wrote ${OUT}/`);
