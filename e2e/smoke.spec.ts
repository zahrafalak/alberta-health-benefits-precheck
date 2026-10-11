import { test, expect } from "@playwright/test";
import { SERVICE_NAME } from "../src/lib/service";

/**
 * A small smoke test: the app loads with the service's name and starts empty.
 * The journeys through the pre-check get their own tests once the questions exist.
 */

const STORAGE_KEY = "goa-public-form-draft";

test("the start page shows the service name", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(SERVICE_NAME);
  // The heading's text is slotted into the design system's web component, so match by accessible name
  await expect(page.getByRole("heading", { level: 1, name: SERVICE_NAME })).toBeVisible();
});

test("a new visitor starts with nothing saved", async ({ page }) => {
  await page.goto("/");

  const saved = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  expect(saved).toBeNull();
});
