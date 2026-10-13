import { expect, test } from "@playwright/test";
test.skip(process.env.TEST_MONGO !== "1", "Opt-in local MongoDB integration: run TEST_MONGO=1 npm run test:e2e after seed.");
test("create, edit, conflict and persisted product in admin", async ({ page }) => {
  const slug = "integration-" + Date.now();
  await page.goto("/admin");
  await expect(page.locator(".backend-callout")).toContainText("MongoDB متصل است");
  await page.getByRole("button", { name: "محصولات", exact: true }).click();
  await page.getByRole("button", { name: "محصول جدید", exact: true }).click();
  await page.getByLabel("نام محصول", { exact: true }).fill("گل تست دیتابیس");
  await page.getByLabel("نشانی انگلیسی محصول").fill(slug);
  await page.getByLabel("قیمت (تومان)").fill("1230000");
  await page.getByLabel("موجودی محصول").fill("4");
  await page.getByLabel("توضیحات محصول").fill("محصول آزمایشی برای بررسی ذخیره پایدار دیتابیس");
  await page.getByRole("button", { name: "ساخت محصول", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "محصولات", exact: true }).click();
  const row = page.locator(".admin-product-list article").filter({ hasText: "گل تست دیتابیس" }).first();
  await expect(row).toBeVisible();
  const checks = await page.evaluate(async slug => {
    const base = await (await fetch("/api/admin/bootstrap")).json();
    const product = base.products.find(p => p.slug === slug);
    const options = { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...product, price: 1400000 }) };
    const first = await fetch(`/api/admin/products/${product.id}`, options);
    const stale = await fetch(`/api/admin/products/${product.id}`, options);
    const duplicate = await fetch("/api/admin/products", { ...options, method: "POST" });
    return [first.status, stale.status, duplicate.status];
  }, slug);
  expect(checks).toEqual([200, 409, 409]);
});
test("synthetic order reprices on server, deduplicates and returns stock once", async ({ page }) => {
  await page.goto("/admin");
  const result = await page.evaluate(async () => {
    const send = async (url, method, data) => { const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); return { status: response.status, data: await response.json() }; };
    const slug = "order-fixture-" + Date.now();
    const p = await send("/api/admin/products", "POST", { name: "گل تست سفارش", slug, price: 900000, stock: 5, category: "دسته‌گل", photo: "hero", label: "", description: "دسته گل نمونه مخصوص بررسی transaction" });
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const get = type => parts.find(p => p.type === type).value;
    const date = new Date(`${get("year")}-${get("month")}-${get("day")}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + 3);
    const data = { city: "تهران", deliveryDate: date.toISOString().slice(0, 10), slot: "۱۰ تا ۱۴", occasion: "با عشق", requestId: crypto.randomUUID(), items: [{ id: p.data.product.id, qty: 2, price: 1 }] };
    const first = await send("/api/demo/orders", "POST", data), again = await send("/api/demo/orders", "POST", data);
    const cancel = await send(`/api/demo/orders/${first.data.order.id}`, "PATCH", { action: "cancel" });
    const twice = await send(`/api/demo/orders/${first.data.order.id}`, "PATCH", { action: "cancel" });
    const state = await (await fetch("/api/admin/bootstrap")).json();
    return { first: first.status, total: first.data.order.total, same: first.data.order.id === again.data.order.id, cancel: cancel.status, twice: twice.status, stock: state.products.find(v => v.id === p.data.product.id).stock };
  });
  expect(result).toEqual({ first: 201, total: 1950000, same: true, cancel: 200, twice: 409, stock: 5 });
});
