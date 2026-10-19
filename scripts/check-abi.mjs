// Fails if the frontend's registry ABI (src/lib/registry.ts) expects anything the compiled
// contract does not have. Run after `forge build` in contracts/: npm run check:abi
import { readFileSync } from "node:fs";
import { parseAbi } from "viem";

const src = readFileSync(new URL("../src/lib/registry.ts", import.meta.url), "utf8");
const lines = [...src.matchAll(/^\s*"((?:function|event|error) [^"]+)",?$/gm)].map((m) => m[1]);
const built = JSON.parse(
  readFileSync(new URL("../contracts/out/ResearchReceiptRegistry.sol/ResearchReceiptRegistry.json", import.meta.url), "utf8"),
).abi;

const sig = (x) =>
  `${x.type} ${x.name}(${x.inputs.map((i) => i.type + (i.indexed ? " indexed" : "")).join(",")})` +
  (x.outputs ? ` -> (${x.outputs.map((o) => o.type).join(",")})` : "") +
  (x.stateMutability && x.type === "function" ? ` ${x.stateMutability}` : "");

const contract = new Set(built.filter((x) => x.type !== "constructor").map(sig));
const frontend = parseAbi(lines).map(sig);
const missing = frontend.filter((s) => !contract.has(s));

if (missing.length) {
  console.error("ABI mismatch. The frontend expects, but the contract lacks:\n  " + missing.join("\n  "));
  process.exit(1);
}
console.log(`ABI OK: all ${frontend.length} frontend entries match the compiled contract.`);
