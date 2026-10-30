// e2e/helpers.ts
// What every browser test shares: signing in as a fixture user (each in its
// own browser window, so two people can take turns), failing the test on any
// console error, and small steps like opening a quick action or checking a
// screen's bottom bar.

import { expect, test as base, type BrowserContextOptions, type Locator, type Page } from "@playwright/test";

import { PASSWORD, USERS, type UserKey } from "./fixture-data";

type Fixtures = {
  /** Sign in as a fixture user in a fresh window at the project's width. */
  signIn: (user: UserKey, options?: BrowserContextOptions) => Promise<Page>;
};

export const test = base.extend<Fixtures>({
  signIn: async ({ browser }, use, testInfo) => {
    const errors: string[] = [];
    const pages: Page[] = [];
    await use(async (user, options = {}) => {
      const context = await browser.newContext({ viewport: testInfo.project.use.viewport, baseURL: testInfo.project.use.baseURL, ...options });
      const page = await context.newPage();
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(`[${user}] ${m.text()}`);
      });
      page.on("pageerror", (e) => errors.push(`[${user}] ${e.message}`));
      pages.push(page);
      await page.goto("/login");
      await page.locator('input[type="text"]').fill(USERS[user].username);
      await page.locator('input[type="password"]').fill(PASSWORD);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL("/");
      await nav(page).waitFor();
      return page;
    });
    // On failure, a picture of each window for the report.
    if (testInfo.status !== testInfo.expectedStatus) {
      for (const [i, page] of pages.entries()) {
        if (!page.isClosed()) await testInfo.attach(`window ${i + 1}`, { body: await page.screenshot(), contentType: "image/png" });
      }
    }
    for (const page of pages) await page.context().close();
    expect(errors, "console errors in the browser").toEqual([]);
  },
});

export { expect };

export const nav = (page: Page) => page.getByRole("navigation", { name: "Main" });
export const tab = (page: Page, name: "Home" | "Relationships" | "Wallet") => nav(page).getByRole("button", { name: new RegExp(`^${name}$`) });
export const backButton = (page: Page) => page.getByRole("button", { name: "Back" });
export const dialog = (page: Page) => page.getByRole("alertdialog");
/** The short note that fades after an action ("Converted."); not the environment banner, also a status. */
export const notice = (page: Page) => page.locator('p[role="status"]');

/** The input, select or text area of the form field labelled `label`. */
export const field = (page: Page, label: string | RegExp) => page.locator("label", { hasText: label }).locator("input, select, textarea").first();

/** Open a quick action from the + button. */
export async function quick(page: Page, action: string) {
  await nav(page).getByRole("button", { name: "Quick actions" }).click();
  await page.getByRole("region", { name: "Quick actions" }).getByRole("button", { name: new RegExp(action) }).click();
}

/** Pick the first option whose text starts with `prefix` (waits for the options to load). */
export async function choose(select: Locator, prefix: string) {
  await expect.poll(() => select.evaluate((el: HTMLSelectElement, p) => [...el.options].some((o) => o.text.startsWith(p)), prefix)).toBe(true);
  const value = await select.evaluate((el: HTMLSelectElement, p) => [...el.options].find((o) => o.text.startsWith(p))!.value, prefix);
  await select.selectOption(value);
}

/** Switch the acting node from the header (only on a tab's top screen). */
export async function actAs(page: Page, node: string | RegExp) {
  await page.getByRole("button", { name: /Acting as/ }).click();
  await page.getByRole("button", { name: node }).first().click();
}

/**
 * The bottom bar on this screen: shown, with `tabName` lit; a form's main
 * button never behind it, and touching it when it floats; nothing scrolls
 * sideways.
 */
export async function expectScreen(page: Page, tabName: "Home" | "Relationships" | "Wallet") {
  await expect(nav(page)).toBeVisible();
  await expect(nav(page).locator('[aria-current="page"]')).toHaveText(tabName);
  await page.waitForLoadState("networkidle");

  const navTop = (await nav(page).boundingBox())!.y;
  const action = page.locator("main div.sticky").first();
  if (await action.count()) {
    for (const where of ["top", "end"] as const) {
      await page.evaluate((w) => window.scrollTo(0, w === "top" ? 0 : document.body.scrollHeight), where);
      await page.waitForTimeout(100);
      const box = (await action.boundingBox())!;
      expect(box.y + box.height, `main button above the bar (scrolled to the ${where})`).toBeLessThanOrEqual(navTop + 1);
      const floating = await action.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return Math.abs(window.innerHeight - parseFloat(getComputedStyle(el).bottom) - r.bottom) < 2 && document.documentElement.scrollHeight > window.innerHeight;
      });
      if (floating) expect(navTop - (box.y + box.height), "a floating main button sits right on the bar").toBeLessThanOrEqual(1);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  const sideways = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(sideways, "nothing scrolls sideways").toBeLessThanOrEqual(0);
}

/** A name unique to this run's width, so the two widths don't collide in the shared database. */
export const perWidth = (prefix: string, testInfo: { project: { name: string } }) => `${prefix}${testInfo.project.name}`;
