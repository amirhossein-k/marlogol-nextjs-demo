import test from "node:test";
import assert from "node:assert/strict";
import { mongoConfig, mongoFailure } from "../lib/mongo-config.mjs";
test("valid SRV and Docker URIs accepted", () => {
  assert.equal(mongoConfig({ MONGODB_URI: "mongodb+srv://demo:encoded@cluster.example.net/?retryWrites=true" }).name, "marlogol_demo");
  assert.doesNotThrow(() => mongoConfig({ MONGODB_URI: "mongodb://127.0.0.1:27017/?replicaSet=rs0&directConnection=true" }));
});
test("duplicate assignment, placeholders and SRV direct mode rejected", () => {
  for (const uri of ["MONGODB_URI=mongodb+srv://host/", "mongodb+srv://CLUSTER_HOST/", "mongodb+srv://host/?directConnection=true", "not-a-uri"]) assert.throws(() => mongoConfig({ MONGODB_URI: uri }));
});
test("nested DNS, auth and parse errors classified without leaking secrets", () => {
  assert.equal(mongoFailure({ name: "Error", code: "ENOTFOUND", message: "SECRET" }).code, "DB_DNS_NOT_FOUND");
  assert.equal(mongoFailure({ name: "MongoServerSelectionError", reason: { servers: new Map([["hidden", { error: { cause: { code: "ECONNREFUSED" } } }]]) } }).code, "DB_CONNECTION_REFUSED");
  assert.equal(mongoFailure({ code: 18, message: "SECRET" }).code, "DB_AUTH_FAILED");
  assert.equal(mongoFailure({ name: "MongoParseError", message: "SECRET" }).code, "DB_URI_PARSE_FAILED");
  assert.equal(JSON.stringify(mongoFailure({ message: "SECRET" })).includes("SECRET"), false);
});
