// e2e/picker.spec.ts
// Picking a person in a search picker (NodePicker) keeps them selected: type
// a name, tap the result, and it stays chosen. It used to be undone at once
// by the <label> around the picker (fixed in "Fix: picker selection cleared on tap").

import { fullName } from "./fixture-data";
import { dialog, expect, quick, tab, test } from "./helpers";
import type { Page } from "@playwright/test";

const annie = fullName("annie");

async function pick(page: Page, label: string, how: "click" | "tap") {
  const picker = page.locator("label", { hasText: label }).first();
  await picker.locator('input[type="search"]').fill("Annie");
  const result = picker.locator("button", { hasText: annie }).first();
  await result.waitFor();
  if (how === "tap") await result.tap();
  else await result.click();
  // Still chosen a moment later: the name with "Change", and no search box.
  await page.waitForTimeout(500);
  await expect(picker.locator("button", { hasText: /^Change$/ })).toHaveCount(1);
  await expect(picker).toContainText(annie);
  await expect(picker.locator('input[type="search"]')).toHaveCount(0);
}

/** Leave a form that has changes: a tab, then Leave. */
async function leaveFor(page: Page) {
  await tab(page, "Home").click();
  await dialog(page).getByRole("button", { name: "Leave" }).click();
}

for (const how of ["click", "tap"] as const) {
  test(`a picked person stays selected (${how}): Send, Request, Propose work`, async ({ signIn }) => {
    const page = await signIn("nora", how === "tap" ? { hasTouch: true, isMobile: true } : {});

    await quick(page, "Send a payment");
    await pick(page, "To", how);
    await leaveFor(page);

    await quick(page, "Request a payment");
    await pick(page, "From", how);
    await leaveFor(page);

    await quick(page, "Propose work");
    await pick(page, "With", how);
    await page.getByRole("button", { name: /curator/i }).first().click();
    await pick(page, "Curator", how);

    // A toggle inside a <label> still switches.
    const side = page.getByRole("button", { name: "You do the work" });
    if (how === "tap") await side.tap();
    else await side.click();
    await expect(side).toHaveAttribute("aria-pressed", "true");
  });
}
