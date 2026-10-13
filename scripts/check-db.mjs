import { MongoClient } from "mongodb";

// Read-only connection diagnosis. Never prints the URI, credentials or raw error message.
const uri = process.env.MONGODB_URI;
const name = process.env.MONGODB_DB || "marlogol_demo";
if (!uri) {
  console.log("RESULT=ENV_URI_MISSING");
  console.log("Load .env.local from the project root: node --env-file=.env.local scripts/check-db.mjs");
  process.exit(1);
}
if (!name.endsWith("_demo")) {
  console.log("RESULT=DATABASE_NAME_MUST_END_IN_DEMO");
  process.exit(1);
}
if (!/^mongodb(\+srv)?:\/\//.test(uri) || /[<>]/.test(uri)) {
  console.log("RESULT=URI_FORMAT_INVALID_OR_PLACEHOLDER");
  process.exit(1);
}
let client;
try {
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 6000, connectTimeoutMS: 6000, maxPoolSize: 1 });
  await client.connect();
  const db = client.db(name);
  await db.command({ ping: 1 });
  console.log("PING=OK");
  const hello = await client.db("admin").command({ hello: 1 });
  console.log("REPLICA_SET=" + (hello.setName ? "PRESENT" : hello.msg === "isdbgrid" ? "SHARDED" : "ABSENT"));
  console.log("WRITABLE_PRIMARY=" + (hello.isWritablePrimary ? "YES" : "NO"));
  const counts = {};
  for (const collection of ["products", "flower_packs", "demo_orders", "demo_messages"]) {
    counts[collection] = await db.collection(collection).countDocuments({});
  }
  console.log("COLLECTION_COUNTS=" + JSON.stringify(counts));
  console.log("RESULT=" + (hello.setName || hello.msg === "isdbgrid" ? "CONNECTION_OK" : "CONNECTED_BUT_TRANSACTIONS_REQUIRE_REPLICA_SET"));
} catch (error) {
  const codes = new Set(), names = new Set();
  function inspect(err, depth = 0) {
    if (!err || depth > 4) return;
    if (typeof err.name === "string" && /^[A-Za-z0-9_]+$/.test(err.name)) names.add(err.name);
    if (typeof err.code === "number" || typeof err.code === "string" && /^[A-Z0-9_]+$/.test(err.code)) codes.add(String(err.code));
    inspect(err.cause, depth + 1);
    if (err.reason?.servers instanceof Map) for (const server of err.reason.servers.values()) inspect(server.error, depth + 1);
  }
  inspect(error);
  console.log("RESULT=CONNECTION_FAILED");
  console.log("ERROR_NAMES=" + [...names].join(","));
  console.log("ERROR_CODES=" + [...codes].join(","));
  console.log("No connection string, passwords or raw messages were printed.");
  process.exitCode = 1;
} finally {
  if (client) await client.close();
}
