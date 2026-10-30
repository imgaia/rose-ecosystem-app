// e2e/currencies.spec.ts
// The currency screens (step 10b and after): the Wallet in the home currency,
// creating and editing a currency with its live price, its detail and
// backing, minting, the home currency choices, and Convert with its
// "Your currencies" table, prices and refusals. Then a collection's currency,
// which needs a Treasurer and an Owner (two people).

import { COLLECTION } from "./fixture-data";
import { actAs, backButton, choose, expect, field, notice, perWidth, tab, test } from "./helpers";

test("an individual's currency: create, price, edit, mint, home currency", async ({ signIn }, testInfo) => {
  const symbol = perWidth("H", testInfo); // H360, H430
  const name = `Harvest ${symbol}`;
  const page = await signIn("nora");

  await tab(page, "Wallet").click();
  await expect(page.getByText("(home currency)")).toBeVisible();
  for (const button of ["Convert", "Add funds", "Mint", "Currencies"]) {
    await expect(page.getByRole("button", { name: button, exact: true })).toBeVisible();
  }

  // Create, with the live price and the policy toggle; made the home currency at once.
  await page.getByRole("button", { name: "Currencies", exact: true }).click();
  await expect(page.getByText("Home currency").first()).toBeVisible();
  await page.getByRole("button", { name: "Create a currency" }).click();
  await field(page, "Name").fill(name);
  await field(page, "Symbol").fill(symbol.toLowerCase());
  await field(page, "Reserve ratio").fill("0.5");
  await expect(page.getByText(`1 ${symbol} = 0.50 CHF`)).toBeVisible();
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.getByText("Beyond the reserve, swaps straight")).toBeVisible();
  await page.getByRole("checkbox", { name: /Make this my home currency/ }).check();
  await page.getByRole("button", { name: "Create currency" }).click();
  await expect(notice(page)).toContainText("Currency created. It is now the home currency.");

  // Detail: price history, backing for the Treasurer, Delete while never held, the home label.
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await expect(page.getByText("Price history")).toBeVisible();
  await expect(page.getByText("What backs it")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  await expect(page.getByText("Home currency", { exact: true })).toBeVisible();

  // Edit the ratio: a second price row.
  await page.getByRole("button", { name: "Edit" }).click();
  await field(page, "Reserve ratio").fill("0.25");
  await expect(page.getByText(`1 ${symbol} = 0.25 CHF`)).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(notice(page)).toContainText("Saved.");
  await expect(page.getByText("0.25 CHF").first()).toBeVisible();

  // Mint it from CHF: 10.00 CHF at 0.25 gives 40.00.
  await tab(page, "Wallet").click();
  await page.getByRole("button", { name: "Mint", exact: true }).click();
  // The currency picker shows once the node issues more than one (the other width's run made one).
  if (await page.locator("label", { hasText: "Currency" }).count()) await choose(field(page, "Currency"), symbol);
  await field(page, "Amount").fill("10");
  await expect(page.getByText("You will mint")).toBeVisible();
  await expect(page.getByText(`40.00 ${symbol}`).first()).toBeVisible();
  await page.getByRole("button", { name: /^Mint \d/ }).click();
  await expect(notice(page)).toContainText("Minted");

  // Set RCC (a collection's currency) back as home from its detail screen.
  await page.getByRole("button", { name: "Currencies", exact: true }).click();
  await page.getByRole("button", { name: /Rose Currency Contribution/ }).first().click();
  await page.getByRole("button", { name: "Set as home currency" }).click();
  await expect(notice(page)).toContainText("RCC is now the home currency.");
  await expect(page.getByText("Home currency", { exact: true })).toBeVisible();
});

test("Convert: the currencies table, refusals named, a conversion and a mint", async ({ signIn }) => {
  const page = await signIn("nora");
  await tab(page, "Wallet").click();
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  const table = page.getByRole("table", { name: "Your currencies" });
  const row = (symbol: string) => table.getByRole("row").filter({ has: page.getByText(symbol, { exact: true }) });

  // CHF into EUR: fiat into fiat, refused with a plain reason and the rule.
  await choose(field(page, "From"), "CHF");
  await choose(field(page, "Into"), "EUR");
  // The header row is hidden under 400px (the cells stack), so look for it in the page, not by role.
  await expect(page.locator('[role="columnheader"]', { hasText: "Into EUR" })).toBeAttached();
  await expect(row("CHF")).toContainText("Not available: fiat into fiat");
  await expect(row("CHF")).toContainText("R-FIN-14");
  await expect(row("CHF")).toHaveAttribute("aria-selected", "true");
  // EUR isn't held: listed with its rate into the primary fiat, approximate (1 / 1.08).
  await expect(row("EUR")).toContainText("Not held");
  await expect(row("EUR")).toContainText("Fiat face value · 1 EUR ≈ 0.93 CHF");

  // CHF into RCC: both prices, the rate, what you receive; converted.
  await choose(field(page, "Into"), "RCC");
  await expect(row("CHF")).toContainText("1 CHF = 1.00 RCC");
  await expect(row("RCC")).toContainText("Balance:");
  await expect(row("RCC")).toContainText("1 RCC = 1.00 CHF");
  await field(page, "Amount").fill("5");
  await expect(page.getByText("You receive", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Convert for 5.00 RCC/ }).click();
  await expect(notice(page)).toContainText("Converted.");
});

test("a collection's currency needs a Treasurer and an Owner; its home currency applies on approval", async ({ signIn }, testInfo) => {
  const symbol = perWidth("ORG", testInfo);
  const nora = await signIn("nora");
  await actAs(nora, new RegExp(COLLECTION));
  await tab(nora, "Wallet").click();
  await nora.getByRole("button", { name: "Currencies", exact: true }).click();
  await nora.getByRole("button", { name: "Create a currency" }).click();
  await expect(nora.getByText("Needs a Treasurer and an Owner (two people)")).toBeVisible();
  await field(nora, "Name").fill(`Org coin ${symbol}`);
  await field(nora, "Symbol").fill(symbol);
  await nora.getByRole("checkbox", { name: `Make this ${COLLECTION}'s home currency` }).check();
  await expect(nora.getByText("Applies once the currency is approved.")).toBeVisible();
  await nora.getByRole("button", { name: "Propose currency" }).click();
  await expect(nora.getByText(/Proposed\. It applies once a Treasurer and an Owner approve\. It becomes the home currency then\./)).toBeVisible();

  // Annie (an Owner, not a Treasurer) approves it from her inbox.
  const annie = await signIn("annie");
  await annie.locator("main").getByRole("button", { name: "Review" }).first().click();
  await expect(annie.getByText("New currency")).toBeVisible();
  await expect(annie.getByText(`Becomes ${COLLECTION}'s home currency`)).toBeVisible();
  await annie.getByRole("button", { name: "Approve" }).click();
  await expect(annie.getByRole("button", { name: "Approve" })).toHaveCount(0);

  // Acting as ROSE Org: the new currency is its home currency; changing needs a Treasurer.
  await tab(annie, "Home").click();
  await actAs(annie, new RegExp(COLLECTION));
  await tab(annie, "Wallet").click();
  await annie.getByRole("button", { name: "Currencies", exact: true }).click();
  await expect(annie.getByText(`${symbol} · Org coin ${symbol}`).first()).toBeVisible();
  await annie.getByRole("button", { name: /Rose Currency Contribution/ }).first().click();
  const setHome = annie.getByRole("button", { name: /Set as home currency/ });
  await expect(setHome).toBeDisabled();
  await expect(setHome).toContainText("Needs Treasurer");
  await backButton(annie).click();
});
