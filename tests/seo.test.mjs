import test from "node:test";
import assert from "node:assert/strict";
import { pageMetadata, breadcrumbs, jsonLd, categoryPages } from "../lib/seo.mjs";
test("page-specific canonical and sharing tags use deployment domain", () => {
  const meta = pageMetadata("گل نمونه", "معرفی نمونه", "/products/example", { VERCEL_URL: "demo.vercel.app" });
  assert.equal(meta.alternates.canonical, "https://demo.vercel.app/products/example");
  assert.equal(meta.openGraph.url, meta.alternates.canonical);
  assert.equal(meta.robots.index, false);
  assert.equal(meta.twitter.card, "summary_large_image");
});
test("breadcrumb paths and safe schema output", () => {
  const schema = breadcrumbs([["خانه", "/"], ["گل", "/products"]], { SITE_URL: "https://demo.example" });
  assert.equal(schema.itemListElement[1].position, 2);
  assert.equal(schema.itemListElement[1].item, "https://demo.example/products");
  assert.equal(jsonLd({ value: "</script>" }).includes("<"), false);
  assert.equal(Object.keys(categoryPages).length, 3);
});
