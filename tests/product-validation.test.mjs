import test from "node:test";
import assert from "node:assert/strict";
import { validateProduct } from "../src/product-validation.mjs";
import { localAllowed, sameOrigin } from "../lib/local-policy.mjs";
const product = { name: "گل دلخواه جدید", slug: "new-flower", price: 1200000, stock: 4, category: "دسته‌گل", label: "جدید", photo: "hero", description: "شرح دسته‌گل با بسته‌بندی تازه" };
test("valid custom product accepts fields, removes unknown properties", () => {
  const parsed = validateProduct({ ...product, role: "admin", "$set": { stock: 999 } });
  assert.equal(parsed.name, product.name); assert.equal(parsed.role, undefined); assert.equal(parsed.$set, undefined);
});
test("bad slug, fractional/negative price and stock are rejected", () => {
  for (const change of [{ slug: "../admin" }, { price: -10 }, { price: 12.5 }, { stock: -1 }, { stock: 0.5 }, { photo: "https://foreign.example/test" }, { name: "" }, { description: "" }]) assert.throws(() => validateProduct({ ...product, ...change }));
});
test("zero stock is allowed", () => { assert.equal(validateProduct({ ...product, stock: 0 }).stock, 0); });
test("local writes require explicit env and loopback, never production", () => {
  assert.equal(localAllowed("http://127.0.0.1:3000", { NODE_ENV: "development", LOCAL_DEMO_WRITES: "true" }), true);
  assert.equal(localAllowed("http://localhost:3000", { NODE_ENV: "production", LOCAL_DEMO_WRITES: "true" }), false);
  assert.equal(localAllowed("https://shop.example", { NODE_ENV: "development", LOCAL_DEMO_WRITES: "true" }), false);
  assert.equal(localAllowed("http://127.0.0.1:3000", { NODE_ENV: "development" }), false);
});
test("mutations require exact same origin", () => {
  assert.equal(sameOrigin("http://127.0.0.1:3000/api/admin", "http://127.0.0.1:3000"), true);
  assert.equal(sameOrigin("http://127.0.0.1:3000/api/admin", "https://evil.example"), false);
  assert.equal(sameOrigin("http://127.0.0.1:3000/api/admin", null), false);
});
