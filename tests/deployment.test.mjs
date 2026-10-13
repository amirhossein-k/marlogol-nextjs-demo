import test from "node:test";
import assert from "node:assert/strict";
import { demoDeployment, siteUrl } from "../lib/deployment.mjs";
import { localAllowed } from "../lib/local-policy.mjs";
test("Vercel never enables backend writes even with local flag", () => {
  const env = { VERCEL: "1", NODE_ENV: "development", LOCAL_DEMO_WRITES: "true" };
  assert.equal(demoDeployment(env).backend, false);
  assert.equal(localAllowed("http://localhost:3000/api", env), false);
});
test("production and hosted-demo isolate synthetic data", () => {
  for (const env of [{ NODE_ENV: "production", LOCAL_DEMO_WRITES: "true" }, { NODE_ENV: "development", DEPLOYMENT_MODE: "hosted-demo", LOCAL_DEMO_WRITES: "true" }]) {
    assert.equal(demoDeployment(env).backend, false);
    assert.equal(localAllowed("http://localhost:3000", env), false);
  }
});
test("local developer can opt into MongoDB", () => {
  assert.equal(demoDeployment({ NODE_ENV: "development", LOCAL_DEMO_WRITES: "true" }).backend, true);
  assert.equal(demoDeployment({ NODE_ENV: "development" }).backend, false);
});
test("metadata origin uses Vercel automatic host or owned URL", () => {
  assert.equal(siteUrl({ VERCEL_URL: "sample.vercel.app" }), "https://sample.vercel.app");
  assert.equal(siteUrl({ SITE_URL: "https://flowers.example", VERCEL_URL: "preview.vercel.app" }), "https://flowers.example");
});
