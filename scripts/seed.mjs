import { MongoClient } from "mongodb";
import fs from "node:fs/promises";
import { flowerPacks } from "../src/bouquet.mjs";
if (!process.argv.includes("--yes")) { console.error("Adds missing SAMPLE products and flower packs only. Run node --env-file=.env.local scripts/seed.mjs --yes after reviewing config."); process.exit(1); }
// Environment must be loaded explicitly: node --env-file=.env.local scripts/seed.mjs --yes
if (!process.env.MONGODB_URI) { console.error("MONGODB_URI missing. See README.md."); process.exit(1); }
const samples = JSON.parse(await fs.readFile(new URL("../src/data/products.json", import.meta.url), "utf8"));
const client = new MongoClient(process.env.MONGODB_URI);
const name = process.env.MONGODB_DB || "marlogol_demo";
if (!name.endsWith("_demo")) throw new Error("Database must end with _demo.");
try {
  await client.connect();
  const db = client.db(name);
  const collection = db.collection("products");
  await collection.createIndex({ slug: 1 }, { unique: true });
  await collection.createIndex({ id: 1 }, { unique: true });
  await collection.bulkWrite(samples.map(product => ({ updateOne: { filter: { id: product.id }, update: { $setOnInsert: { ...product, revision: 0, createdAt: new Date().toISOString() } }, upsert: true } })));
  await collection.updateMany({ revision: { $exists: false } }, { $set: { revision: 0 } });
  const packs = db.collection("flower_packs");
  await packs.createIndex({ id: 1 }, { unique: true });
  await packs.bulkWrite(flowerPacks.map(pack => ({ updateOne: { filter: { id: pack.id }, update: { $setOnInsert: { ...pack, revision: 0 } }, upsert: true } })));
  await db.collection("demo_orders").createIndex({ id: 1 }, { unique: true });
  await db.collection("demo_orders").createIndex({ requestId: 1 }, { unique: true });
  await db.collection("demo_orders").createIndex({ createdAt: -1 });
  await db.collection("demo_messages").createIndex({ at: -1 });
  await db.collection("demo_events").createIndex({ orderId: 1, at: -1 });
  console.log("Missing sample products/packs added; existing data preserved. Indexes ready.");
} finally { await client.close(); }
