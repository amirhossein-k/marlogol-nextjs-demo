import test from "node:test";
import assert from "node:assert/strict";
import { resolveLocalRequestUrl, sameOrigin } from "../lib/local-policy.mjs";
test("Next internal loopback and browser localhost alias are accepted", () => {
  const url = resolveLocalRequestUrl("http://127.0.0.1:3000/api/admin/bootstrap", new Headers({ host: "localhost:3000", "x-forwarded-host": "localhost:3000" }));
  assert.equal(url, "http://localhost:3000/api/admin/bootstrap");
  assert.equal(sameOrigin(url, "http://localhost:3000"), true);
  assert.equal(sameOrigin(url, "https://evil.example"), false);
});
test("reverse alias is accepted without relaxing port", () => {
  assert.equal(resolveLocalRequestUrl("http://localhost:3000/api", new Headers({ host: "127.0.0.1:3000", "x-forwarded-host": "localhost:3000" })), "http://127.0.0.1:3000/api");
});
test("external, list, injected and differing port hosts are rejected", () => {
  for (const value of ["evil.example:3000", "localhost:3000, evil.example", "localhost:4000", "localhost:3000@evil.example", "localhost:3000/path"]) {
    assert.throws(() => resolveLocalRequestUrl("http://127.0.0.1:3000/api", new Headers({ host: "localhost:3000", "x-forwarded-host": value })));
  }
  assert.throws(() => resolveLocalRequestUrl("http://127.0.0.1:3000/api", new Headers({ host: "evil.example:3000" })));
  assert.throws(() => resolveLocalRequestUrl("http://127.0.0.1:3000/api", new Headers({ host: "localhost:3000", forwarded: "host=evil.example" })));
});
