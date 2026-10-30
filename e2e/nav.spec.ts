// e2e/nav.spec.ts
// The bottom bar on every screen ("Bottom nav on every screen"): shown with
// the screen's tab lit, a tab going to its top screen, + from anywhere, each
// form's main button above the bar, the "Leave without sending?" prompt, and
// the bar hiding while the phone's keyboard is open.

import { COLLECTION, fullName } from "./fixture-data";
import { actAs, backButton, dialog, expect, expectScreen, field, nav, notice, quick, tab, test } from "./helpers";

test("every screen shows the bar, with its tab lit and the main button above it", async ({ signIn }) => {
  const page = await signIn("nora");

  // The three tabs.
  await expectScreen(page, "Home");
  await tab(page, "Relationships").click();
  await expectScreen(page, "Relationships");
  await tab(page, "Wallet").click();
  await expectScreen(page, "Wallet");

  // Wallet screens light Wallet; a tab goes straight back to its top screen.
  await page.getByRole("button", { name: "Currencies", exact: true }).click();
  await expectScreen(page, "Wallet");
  await page.getByRole("button", { name: /Rose Currency Contribution/ }).first().click();
  await expectScreen(page, "Wallet");
  await backButton(page).click();
  await page.getByRole("button", { name: "Create a currency" }).click();
  await expectScreen(page, "Wallet");
  await tab(page, "Wallet").click();
  await expect(page.getByText("Total, in").first()).toBeVisible();
  for (const screen of ["Add funds", "Mint", "Convert"]) {
    await page.getByRole("button", { name: screen, exact: true }).click();
    await expectScreen(page, "Wallet");
    await tab(page, "Wallet").click();
  }

  // Quick actions from a tab, and + from an opened screen.
  await tab(page, "Home").click();
  await quick(page, "Send a payment");
  await expectScreen(page, "Home");
  await quick(page, "Convert currencies");
  await expectScreen(page, "Wallet");
  await tab(page, "Relationships").click();
  for (const action of ["Request a payment", "Propose work", "Invite someone"]) {
    await quick(page, action);
    await expectScreen(page, "Relationships");
  }

  // A relationship, its interaction and Amend terms.
  await tab(page, "Relationships").click();
  await page.locator("main").getByRole("button", { name: new RegExp(fullName("annie")) }).first().click();
  await expectScreen(page, "Relationships");
  await page.locator("main").getByRole("button", { name: /Garden design/ }).first().click();
  await expectScreen(page, "Relationships");
  await page.getByRole("button", { name: "Amend terms" }).click();
  await expectScreen(page, "Relationships");

  // From the header: search, the node page, Edit identity.
  await tab(page, "Home").click();
  await page.getByRole("button", { name: "Search the network" }).click();
  await expectScreen(page, "Home");
  await tab(page, "Home").click();
  await page.getByRole("button", { name: /Acting as/ }).click();
  await page.getByRole("button", { name: "Open node page: identity, roles, rules" }).click();
  await expectScreen(page, "Home");
  await page.getByRole("button", { name: "Edit identity" }).first().click();
  await expectScreen(page, "Home");

  // ROSE Org's membership screens.
  await tab(page, "Home").click();
  await actAs(page, new RegExp(COLLECTION));
  await page.getByRole("button", { name: /Acting as/ }).click();
  await page.getByRole("button", { name: "Open node page: identity, roles, rules" }).click();
  await expectScreen(page, "Home");
  for (const screen of [/^Add a member/, /^Change a role/, /^Remove a member/]) {
    await page.locator("main").getByRole("button", { name: "Members", exact: true }).click();
    await page.locator("main").getByRole("button", { name: screen }).first().click();
    await expectScreen(page, "Home");
    await backButton(page).click();
  }
});

test("a proposal and Counter-propose show the bar too", async ({ signIn }, testInfo) => {
  const nora = await signIn("nora");
  await quick(nora, "Propose work");
  const picker = nora.locator("label", { hasText: "With" }).first();
  await picker.locator('input[type="search"]').fill("Annie");
  await picker.locator("button", { hasText: fullName("annie") }).first().click();
  await field(nora, "Work").fill(`Fence repair ${testInfo.project.name}`);
  await field(nora, "Price").fill("10");
  await nora.getByRole("button", { name: "Send proposal" }).click();
  await expect(notice(nora)).toContainText("Proposal sent");

  const annie = await signIn("annie");
  await annie.locator("main").getByRole("button", { name: "Review" }).first().click();
  await expectScreen(annie, "Home");
  await annie.getByRole("button", { name: /Counter/ }).first().click();
  await expectScreen(annie, "Home");
});

test("leaving a form with changes asks first; nothing changed or sent doesn't", async ({ signIn }) => {
  const page = await signIn("nora");
  const amount = () => field(page, "Amount");

  // Nothing changed: no prompt.
  await quick(page, "Send a payment");
  await tab(page, "Wallet").click();
  await expect(page.getByText("Total, in").first()).toBeVisible();
  await expect(dialog(page)).toHaveCount(0);

  // Changed, then a tab: Stay keeps the typing; Leave goes to the tab's top screen.
  await quick(page, "Send a payment");
  await amount().fill("12");
  await tab(page, "Wallet").click();
  await expect(dialog(page)).toContainText("Leave without sending?");
  await expect(dialog(page)).toContainText("Your changes will be lost.");
  await dialog(page).getByRole("button", { name: "Stay" }).click();
  await expect(amount()).toHaveValue("12");
  await tab(page, "Wallet").click();
  await dialog(page).getByRole("button", { name: "Leave" }).click();
  await expect(page.getByText("Total, in").first()).toBeVisible();

  // Back.
  await quick(page, "Send a payment");
  await amount().fill("3");
  await backButton(page).click();
  await dialog(page).getByRole("button", { name: "Leave" }).click();
  await expect(page.getByText("Total, in").first()).toBeVisible();

  // +: Leave opens the quick actions.
  await quick(page, "Send a payment");
  await amount().fill("4");
  await nav(page).getByRole("button", { name: "Quick actions" }).click();
  await dialog(page).getByRole("button", { name: "Leave" }).click();
  await expect(page.getByRole("region", { name: "Quick actions" })).toBeVisible();
  await page.getByRole("region", { name: "Quick actions" }).getByRole("button", { name: /Request a payment/ }).click();
  await expect(page.getByText("Request a payment").first()).toBeVisible();

  // The browser's back button.
  await tab(page, "Home").click();
  await quick(page, "Send a payment");
  await amount().fill("5");
  await page.goBack();
  await dialog(page).getByRole("button", { name: "Stay" }).click();
  await expect(amount()).toHaveValue("5");
  await page.goBack();
  await dialog(page).getByRole("button", { name: "Leave" }).click();
  await expect(backButton(page)).toHaveCount(0);

  // After a successful send: Add funds goes back by itself; Invite stays open.
  await tab(page, "Wallet").click();
  await page.getByRole("button", { name: "Add funds" }).click();
  await field(page, "Amount").fill("1");
  await field(page, "Bank reference").fill("e2e");
  await page.getByRole("button", { name: "Record deposit" }).click();
  await expect(notice(page)).toContainText("Deposit recorded");
  await tab(page, "Home").click();
  await expect(dialog(page)).toHaveCount(0);
  await quick(page, "Invite someone");
  await field(page, "Name").fill("Prompt Tester");
  await field(page, "Email").fill(`prompt${Date.now()}@example.org`);
  await page.getByRole("button", { name: "Create invitation link" }).click();
  await expect(page.getByText("Link for Prompt Tester")).toBeVisible();
  await tab(page, "Wallet").click();
  await expect(page.getByText("Total, in").first()).toBeVisible();
  await expect(dialog(page)).toHaveCount(0);
});

test("on a phone the bar hides while the keyboard is open", async ({ signIn }) => {
  const page = await signIn("nora", { hasTouch: true, isMobile: true });
  expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
  await quick(page, "Send a payment");
  await field(page, "Amount").focus();
  await expect(nav(page)).toHaveCount(0);
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  await expect(nav(page)).toBeVisible();
  // A select (a picker, not the keyboard) keeps the bar.
  await page.locator("main select").first().focus();
  await page.waitForTimeout(200);
  await expect(nav(page)).toBeVisible();
});
