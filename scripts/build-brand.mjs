// Generates the Loxen logo files in public/brand/ and the app icon. All geometry lives here, so every
// version is drawn from the same paths. Run: node scripts/build-brand.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const GREEN = "#10301d"; // bottle green ground
const GOLD = "#f4d96c"; // gold ink, for dark grounds
const OCHRE = "#94700f"; // gold darkened to read on light grounds
const CREAM = "#eef0e7";

// The mark: an evidence tag cut into an L. Clipped top corners and a punched hole make it a tag;
// the foot makes it an L. 22 × 28 units.
export const MARK = {
  w: 22,
  h: 28,
  d: "M0 3 3 0h5l3 3v16h11v9H0Z M5.5 4.1a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z",
};

// The wordmark, drawn on a cap height of 26 with a 5-unit stroke. The O carries the tag's clipped
// corners; the inner clip (2.07) keeps the diagonal stroke 5 units thick.
const LETTERS = [
  { w: 16, d: "M0 0h5v21h11v5H0Z" },
  { w: 20, d: "M5 0h10l5 5v16l-5 5H5l-5-5V5Z M7.07 5h5.86L15 7.07v11.86L12.93 21H7.07L5 18.93V7.07Z", hole: true },
  { w: 20, d: "M0 0h5.7L20 26h-5.7Z M14.3 0H20L5.7 26H0Z" },
  { w: 16, d: "M0 0h16v5H5v5.5h9v5H5V21h11v5H0Z" },
  { w: 20, d: "M0 0h5.5L15 17.5V0h5v26h-5.5L5 8.5V26H0Z" },
];
const GAP = 5;
const CAP = 26;

function wordmarkPaths() {
  let x = 0;
  const parts = LETTERS.map((l) => {
    const rule = l.hole ? ` fill-rule="evenodd"` : "";
    const p = `<path${rule} transform="translate(${x} 0)" d="${l.d}"/>`;
    x += l.w + GAP;
    return p;
  });
  return { width: x - GAP, body: parts.join("") };
}

const svg = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 4}" height="${h * 4}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;

const markBody = (fill) => `<path fill="${fill}" fill-rule="evenodd" d="${MARK.d}"/>`;

function mark(fill) {
  return svg(MARK.w, MARK.h, markBody(fill), "Loxen");
}

function wordmark(fill) {
  const { width, body } = wordmarkPaths();
  return svg(width, CAP, `<g fill="${fill}">${body}</g>`, "Loxen");
}

// Mark and wordmark side by side. The wordmark is scaled so its cap height is 0.62 of the mark's
// height and sits on the mark's baseline.
function lockup(markFill, wordFill) {
  const { width, body } = wordmarkPaths();
  const s = (MARK.h * 0.62) / CAP;
  const x = MARK.w + 8;
  const w = x + width * s;
  const y = MARK.h - CAP * s;
  return svg(
    +w.toFixed(2),
    MARK.h,
    `${markBody(markFill)}<g fill="${wordFill}" transform="translate(${x} ${+y.toFixed(3)}) scale(${+s.toFixed(4)})">${body}</g>`,
    "Loxen",
  );
}

// Square app icon: the gold mark on a green tile, sized to stay legible at 16 px.
function icon() {
  const size = 32;
  const s = 22 / MARK.h;
  const x = (size - MARK.w * s) / 2;
  const y = (size - MARK.h * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="7" fill="${GREEN}"/><g transform="translate(${+x.toFixed(3)} ${+y.toFixed(3)}) scale(${+s.toFixed(4)})">${markBody(GOLD)}</g></svg>\n`;
}

const files = {
  "public/brand/loxen-mark.svg": mark(GOLD),
  "public/brand/loxen-mark-on-light.svg": mark(OCHRE),
  "public/brand/loxen-mark-black.svg": mark("#000"),
  "public/brand/loxen-mark-white.svg": mark("#fff"),
  "public/brand/loxen-wordmark.svg": wordmark(CREAM),
  "public/brand/loxen-wordmark-on-light.svg": wordmark(GREEN),
  "public/brand/loxen-wordmark-black.svg": wordmark("#000"),
  "public/brand/loxen-wordmark-white.svg": wordmark("#fff"),
  "public/brand/loxen-lockup.svg": lockup(GOLD, CREAM),
  "public/brand/loxen-lockup-on-light.svg": lockup(OCHRE, GREEN),
  "public/brand/loxen-lockup-black.svg": lockup("#000", "#000"),
  "public/brand/loxen-lockup-white.svg": lockup("#fff", "#fff"),
  "public/brand/loxen-icon.svg": icon(),
  "src/app/icon.svg": icon(),
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await mkdir("public/brand", { recursive: true });
  for (const [path, body] of Object.entries(files)) await writeFile(path, body);
  console.log(`Wrote ${Object.keys(files).length} files.`);
}
