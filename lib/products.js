import "server-only";
import { randomUUID } from "node:crypto";
import { getDb, plain } from "./db";
import { ApiError, revision } from "./http";
import { validateProduct } from "../src/product-validation.mjs";
function checked(data) {
  try { return validateProduct(data); } catch (error) { throw new ApiError(400, error.message); }
}
export async function createProduct(data) {
  const fields = checked(data);
  const db = await getDb();
  await db.collection("products").createIndex({ slug: 1 }, { unique: true });
  await db.collection("products").createIndex({ id: 1 }, { unique: true });
  const doc = { ...fields, id: "product-" + randomUUID(), revision: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await db.collection("products").insertOne(doc);
  return plain(doc);
}
export async function updateProduct(id, data) {
  const fields = checked(data);
  const db = await getDb();
  const doc = await db.collection("products").findOneAndUpdate({ id, revision: revision(data.revision) },
    { $set: { ...fields, updatedAt: new Date().toISOString() }, $inc: { revision: 1 } }, { returnDocument: "after" });
  if (!doc) throw new ApiError(409, "محصول پیدا نشد یا توسط درخواست دیگری تغییر کرد. پنل را تازه‌سازی کنید.");
  return plain(doc);
}
export async function updatePack(id, data) {
  if (!Number.isSafeInteger(data.stock) || data.stock < 0 || data.stock > 10000) throw new ApiError(400, "موجودی بسته معتبر نیست.");
  const db = await getDb();
  const doc = await db.collection("flower_packs").findOneAndUpdate({ id, revision: revision(data.revision) }, { $set: { stock: data.stock }, $inc: { revision: 1 } }, { returnDocument: "after" });
  if (!doc) throw new ApiError(409, "موجودی تغییر کرده؛ دوباره اتصال را بررسی کنید.");
  return plain(doc);
}
