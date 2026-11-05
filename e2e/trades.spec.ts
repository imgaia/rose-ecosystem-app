// e2e/trades.spec.ts
// Step 11b: trading (S28), prices that come from trades, amounts through the
// shared formatter, the wallet total without unpriced currencies, and the
// whole-network map (R-VIS-02).
//
// Theo issues TEO (free, 6 decimals, like JCN); Annie issues ANN (free,
// never traded); Annie and Theo have a relationship of their own (fixture.ts).

import type { Page } from "@playwright/test";

import { fullName } from "./fixture-data";
import { choose, expect, expectScreen, field, nav, notice, tab, test } from "./helpers";

/** Reload so this window sees what the other person just did (queries stay fresh for 30 s). */
async function refresh(page: Page) {
  await page.reload();
  await nav(page).waitFor();
}

/** The inbox card on Home whose title is `title`. */
const card = (page: Page, title: string) => page.locator("main section", { hasText: title }).first();

test("propose, counter-propose and accept a trade; its rate shows on the currency", async ({ signIn }) => {
  // Theo offers 10 TEO for 5 RCC to Nora, from the Wallet.
  const theo = await signIn("theo");
  await tab(theo, "Wallet").click();
  await theo.getByRole("button", { name: "Propose a trade", exact: true }).click();
  await expectScreen(theo, "Wallet");
  await field(theo, "With").fill("Nora");
  await theo.getByRole("button", { name: fullName("nora") }).click();
  await choose(theo.getByRole("combobox", { name: "Currency you give" }), "TEO");
  await field(theo, "You give").fill("10");
  await choose(theo.getByRole("combobox", { name: "Currency you get" }), "RCC");
  await field(theo, "You get").fill("5");
  await expect(theo.getByText("1 TEO = 0.50 RCC")).toBeVisible();
  await expect(theo.getByText("Last published rate")).toBeVisible();
  await theo.getByRole("button", { name: "Propose trade" }).click();
  await expect(notice(theo)).toContainText("Trade proposed.");

  // Nora reviews it from her inbox and counter-proposes 4 RCC instead.
  const nora = await signIn("nora");
  const offer = card(nora, "Theo Test offers a trade");
  await expect(offer).toContainText("You give 5.00 RCC · you get 10.00 TEO");
  await offer.getByRole("button", { name: "Review" }).click();
  await expect(nora.getByText("Trade · version 1")).toBeVisible();
  await expect(nora.getByRole("button", { name: "Accept trade" })).toBeVisible();
  await nora.getByRole("button", { name: "Counter-propose" }).click();
  await expect(field(nora, "You give")).toHaveValue("5.00");
  await field(nora, "You give").fill("4");
  await expect(nora.getByText("1 RCC = 2.50 TEO")).toBeVisible();
  await nora.getByRole("button", { name: "Send counter-proposal" }).click();
  await expect(notice(nora)).toContainText("Sent.");

  // Theo sees the new amounts, what they replace, and accepts.
  await refresh(theo);
  await tab(theo, "Home").click();
  const counter = card(theo, "Nora Test proposes new amounts");
  await expect(counter).toContainText("You give 10.00 TEO · you get 4.00 RCC");
  await counter.getByRole("button", { name: "Review" }).click();
  await expect(theo.locator(".line-through", { hasText: "5.00 RCC" })).toBeVisible();
  await theo.getByRole("button", { name: "Accept trade" }).click();
  await expect(theo.getByRole("button", { name: "Accept trade" })).toHaveCount(0);

  // TEO now has a price: worked out through the trade's rate and RCC's, with the trade rate listed (no names).
  await tab(theo, "Wallet").click();
  await theo.getByRole("button", { name: "Currencies", exact: true }).click();
  await theo.getByRole("button", { name: /Theo's hours/ }).click();
  await expect(theo.getByText("1 TEO = 0.40 CHF")).toBeVisible();
  await expect(theo.getByText("Worked out through other rates", { exact: true })).toBeVisible();
  await expect(theo.getByText("Recent trades")).toBeVisible();
  await expect(theo.getByText("1 TEO = 0.40 RCC").first()).toBeVisible();
  await expect(theo.locator("main")).not.toContainText(fullName("nora"));

  // The trade itself, from Theo's relationship with Nora.
  await tab(theo, "Relationships").click();
  await theo.locator("main").getByRole("button", { name: new RegExp(fullName("nora")) }).first().click();
  await theo.locator("main").getByRole("button", { name: /^Trade/ }).first().click();
  await expect(theo.getByText("Traded · version 2")).toBeVisible();
  await expect(theo.getByText("1 TEO = 0.40 RCC")).toBeVisible();
  await expect(theo.getByText("You gave")).toBeVisible();
  await expect(theo.getByText("Nora Test gave")).toBeVisible();

  // Nora now holds TEO: its detail's Trade button opens the form with TEO to give.
  await refresh(nora);
  await tab(nora, "Wallet").click();
  await nora.getByRole("button", { name: "Currencies", exact: true }).click();
  await nora.getByRole("button", { name: /Theo's hours/ }).click();
  await nora.getByRole("button", { name: "Trade TEO" }).click();
  await expect(nora.getByRole("combobox", { name: "Currency you give" }).locator("option:checked")).toHaveText("TEO");
});

test("JCN-style decimals: 6-decimal amounts show 2 decimals unless more aren't zero, old text too", async ({ signIn }) => {
  // An activity line written before the shared formatter reads as it would now.
  const annie = await signIn("annie");
  await expect(annie.getByText("Annie Test noted a tip of 1.00 TEO")).toBeVisible();
  await expect(annie.locator("main")).not.toContainText("1.000000");

  const theo = await signIn("theo");
  await tab(theo, "Wallet").click();
  const row = theo.locator("div").filter({ has: theo.getByText("TEO", { exact: true }) }).last();
  await expect(row).toHaveText(/^TEO\d+\.00$/);
  await theo.getByRole("button", { name: "Currencies", exact: true }).click();
  await theo.getByRole("button", { name: /Theo's hours/ }).click();
  await expect(theo.locator("main")).toContainText("Decimal places6");
});

test("the wallet total leaves out a currency with no price yet, and says so", async ({ signIn }) => {
  const annie = await signIn("annie");
  await tab(annie, "Wallet").click();
  await expect(annie.getByText("1 currency has no price yet (ANN), so it isn't in the total.")).toBeVisible();
});

test("the map shows the whole network: other people's connections, without their trust", async ({ signIn }) => {
  const nora = await signIn("nora");
  await tab(nora, "Relationships").click();
  await nora.getByRole("button", { name: "Map", exact: true }).click();
  await expect(nora.getByRole("region", { name: "Map of the network" })).toBeVisible();
  await expectScreen(nora, "Relationships");

  const connections = nora.getByRole("list", { name: "Connections" });
  const annieAndTheo = connections.getByRole("listitem").filter({ hasText: /^(Annie Test and Theo Test|Theo Test and Annie Test)$/ });
  await expect(annieAndTheo).toHaveCount(1); // other people's: just the pair, no trust
  await expect(connections.getByRole("listitem").filter({ hasText: /^Nora Test and Annie Test, trust \d\.\d\d$/ })).toHaveCount(1);

  // The kind filter narrows Nora's own relationships only.
  await nora.getByRole("button", { name: "Gifts", exact: true }).click();
  await expect(connections.getByRole("listitem").filter({ hasText: /^Nora Test and/ })).toHaveCount(0);
  await expect(annieAndTheo).toHaveCount(1);

  // Tap a node: its page, with Propose a trade to it.
  await nora.getByRole("button", { name: `Open ${fullName("theo")}` }).click();
  await expect(nora.getByRole("heading", { name: fullName("theo") })).toBeVisible();
  await nora.getByRole("button", { name: "Propose a trade" }).click();
  await expect(nora.locator("label", { hasText: "With" })).toContainText(fullName("theo"));
});
