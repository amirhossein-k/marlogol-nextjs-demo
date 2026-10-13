import { expect, test } from "@playwright/test";
test("home has three product rails with working arrows and add to cart", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".product-rail")).toHaveCount(3);
  const rail = page.locator(".product-rail").first();
  await expect(rail.locator(".rail-card")).toHaveCount(5);
  await page.setViewportSize({ width: 390, height: 844 });
  await rail.getByRole("button", { name: "بعدی گل‌های مارلو، برای یک حال خوب", exact: true }).click();
  await expect.poll(async () => page.locator("#marlo-selection-track").evaluate(el => Math.abs(el.scrollLeft))).toBeGreaterThan(100);
  await expect(rail.getByRole("button", { name: "قبلی گل‌های مارلو، برای یک حال خوب", exact: true })).toBeEnabled();
  await rail.locator(".add-circle").nth(1).click();
  await page.getByRole("button", { name: "سبد خرید", exact: true }).click();
  await expect(page.locator(".cart-item")).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
