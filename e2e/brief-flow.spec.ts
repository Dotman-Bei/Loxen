import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

const TOKEN = "0x6916414F7e390af45c29c89b0aC1Aa79c568D09D";

/** Stub the provider service so the test is deterministic and offline. */
async function stubProviders(page: Page) {
  await page.route("**/api/providers", (r) => r.fulfill({ json: { providers: [], since: "server start" } }));
  await page.route("**/api/evidence**", (r) =>
    r.fulfill({
      json: {
        network: "botchain",
        address: TOKEN,
        asset: { address: TOKEN, isContract: true, name: "Wrapped ETH", symbol: "BOWETH", decimals: 18, standard: "ERC-20" },
        records: [
          {
            id: "s1",
            providerId: "botscan",
            sourceLabel: "BOTScan",
            sourceUrl: `https://scan.botchain.ai/token/${TOKEN}`,
            collectedAt: new Date().toISOString(),
            sourceTimestamp: "",
            kind: "source",
            metricName: "Holder count",
            value: "29",
            unit: "holders",
            status: "live",
            chainId: 677,
          },
        ],
        outcomes: [
          { providerId: "botscan", served: "live" },
          { providerId: "botchain-rpc", served: "error", error: { code: "timeout", message: "Did not answer in time." } },
        ],
        fetchedAt: new Date().toISOString(),
      },
    }),
  );
}

test("compose, fetch, add evidence and a rule, save, reopen, export", async ({ page }) => {
  await stubProviders(page);
  await page.goto("/workbench?q=Is%20the%20holder%20base%20stable%3F&h=weeks");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Is the holder base stable?");
  await expect(page.getByRole("button", { name: "Save brief" })).toBeEnabled();

  // asset and lens
  await page.getByLabel("Symbol, name or contract address").fill(TOKEN);
  await expect(page.getByText(/Valid address, checksum/)).toBeVisible();
  await page.getByRole("button", { name: "On-chain activity" }).click();

  // live fetch (stubbed): one value, one provider outage that must show as such
  await page.getByRole("button", { name: "Fetch evidence" }).click();
  await expect(page.getByText("Resolved as Wrapped ETH (BOWETH)")).toBeVisible();
  const evidence = page.locator("#card-evidence");
  await expect(evidence.getByText("29")).toBeVisible();
  await expect(page.locator("#card-sources").getByText("Did not answer in time.")).toBeVisible();

  // a value entered by hand
  await evidence.getByRole("button", { name: "Add evidence" }).click();
  await page.getByLabel("Metric").fill("Transfers in the horizon");
  await page.getByLabel("Value").fill("412");
  await page.getByLabel("Source", { exact: true }).fill("BOTScan transfers tab");
  await page.getByRole("button", { name: "Add to brief" }).click();
  await expect(evidence.getByText("BOTScan transfers tab")).toBeVisible();

  // a rule from a template
  await page.locator(".template").first().getByRole("button", { name: "Add" }).click();
  await expect(page.locator(".rule")).toHaveCount(1);

  // the finding line counts what the brief holds
  await expect(page.locator(".title-sub")).toContainText("parts filled");

  await page.getByRole("button", { name: "Save brief" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved on this device");
  await expect(page).toHaveURL(/brief=b_/);

  // reopen as a brief
  await page.getByRole("link", { name: "Open brief" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Is the holder base stable?");
  await expect(page.getByText("Only on this device")).toBeVisible();
  await expect(page.locator(".detail-main")).toContainText("29");
  await expect(page.locator(".detail-main")).toContainText("BOTScan transfers tab");

  // export Markdown and check what it says
  const [md] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Markdown" }).click()]);
  const text = await readFile((await md.path())!, "utf8");
  expect(md.suggestedFilename()).toBe("is-the-holder-base-stable.md");
  expect(text).toContain("Schema `loxen.brief/1` · Local only");
  expect(text).toContain("| Holder count | 29 holders |");
  expect(text).toContain("Generated from configured sources (BOTScan), user-provided inputs and local template logic.");

  // export JSON
  const [json] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "JSON" }).click()]);
  const parsed = JSON.parse(await readFile((await json.path())!, "utf8"));
  expect(parsed.schema).toBe("loxen.brief/1");
  expect(parsed.brief.evidence).toHaveLength(2);
  expect(parsed.brief.privateNotes).toBeUndefined();
});

test("profile lists the saved brief, and deleting it asks first", async ({ page }) => {
  await stubProviders(page);
  await page.goto("/workbench?q=Delete%20me");
  await page.getByRole("button", { name: "Save brief" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved on this device");

  await page.goto("/profile");
  await expect(page.getByRole("link", { name: "Delete me" })).toBeVisible();
  await page.getByRole("link", { name: "Delete me" }).click();

  await page.getByRole("button", { name: "Delete this brief…" }).click();
  await expect(page.getByText("Delete “Delete me” from this browser?")).toBeVisible();
  await page.getByRole("button", { name: "Delete brief" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByText("No briefs saved in this browser.")).toBeVisible();
});

test("an unknown brief ID says where briefs live instead of failing", async ({ page }) => {
  await page.goto("/brief/b_missing");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Brief not found");
  await expect(page.getByText(/stored in this browser only/)).toBeVisible();
});

test("the registry refuses to commit until it is configured, and says why", async ({ page }) => {
  await page.goto("/registry");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Research receipt");
  await expect(page.getByRole("button", { name: "Commit receipt" })).toBeDisabled();
  await expect(page.getByText("Choose a brief first.")).toBeVisible();
});

test("public pages name what Loxen is on the first screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Market briefs that show their\sgaps/);
  await expect(page.getByRole("link", { name: "Open the workbench" }).first()).toBeVisible();
  for (const [path, h1] of [
    ["/methodology", "How Loxen handles evidence"],
    ["/privacy", "What Loxen keeps, and where"],
    ["/terms", "Terms of use"],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
  }
});
