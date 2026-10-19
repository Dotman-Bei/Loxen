import { defineConfig } from "@playwright/test";

// End-to-end tests run against their own dev server and build folder, so they never disturb a running
// `npm run dev`. They use an installed browser channel (Edge by default) instead of downloading one;
// set E2E_BROWSER_CHANNEL=chrome to use Chrome. Provider calls are stubbed, so no network is needed.
const PORT = 3400;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: process.env.E2E_BROWSER_CHANNEL ?? "msedge",
    acceptDownloads: true,
  },
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      NEXT_PUBLIC_LOXEN_CHAIN: "testnet",
      NEXT_PUBLIC_LOXEN_REGISTRY_ADDRESS: "",
    },
  },
});
