import "server-only";
import { randomUUID } from "node:crypto";
import { getDb, getClient, plain } from "./db";
import { ApiError } from "./http";
import { calculateBouquet, arrangements, wrappings } from "../src/bouquet.mjs";
import { deliveryDates, canCancel, formatDay } from "../src/rules.mjs";
const slots = ["۱۰ تا ۱۴", "۱۴ تا ۱۸", "۱۸ تا ۲۱"];
const transitions = { prepare: ["paid"], ready: ["paid", "preparing"], deliver: ["ready"], cancel: ["paid", "preparing", "ready"] };
const states = { prepare: "preparing", ready: "ready", deliver: "delivered", cancel: "cancelled" };
async function transaction(work) {
  const client = await getClient(), db = await getDb();
  const session = client.startSession();
  try { return await session.withTransaction(() => work(db, session)); }
  finally { await session.endSession(); }
}
async function message(db, session, order, type, text) {
  await db.collection("demo_messages").insertOne({ id: randomUUID(), orderId: order.id, type, text, at: new Date().toISOString(), sent: false }, { session });
}
function integer(value, max) { return Number.isSafeInteger(value) && value >= 1 && value <= max; }
export async function createDemoOrder(data) {
  if (data.city !== "تهران") throw new ApiError(400, "فقط شهر تهران پوشش داده می‌شود.");
  if (!deliveryDates(new Date()).includes(data.deliveryDate)) throw new ApiError(400, "تاریخ تحویل باید فردا تا هفت روز آینده باشد.");
  if (!slots.includes(data.slot) || !["با عشق", "تولدت مبارک", "به یاد تو"].includes(data.occasion)) throw new ApiError(400, "بازه تحویل یا کارت همراه معتبر نیست.");
  if (typeof data.requestId !== "string" || !/^[a-f0-9-]{36}$/.test(data.requestId)) throw new ApiError(400, "شناسه درخواست معتبر نیست.");
  if (!Array.isArray(data.items) || !data.items.length || data.items.length > 20) throw new ApiError(400, "سبد باید یک تا بیست ردیف داشته باشد.");
  return transaction(async (db, session) => {
    const existing = await db.collection("demo_orders").findOne({ requestId: data.requestId }, { session });
    if (existing) return plain(existing);
    if (!deliveryDates(new Date()).includes(data.deliveryDate)) throw new ApiError(409, "روز تغییر کرده است؛ تاریخ تحویل را دوباره انتخاب کنید.");
    const packs = await db.collection("flower_packs").find({}, { session }).toArray();
    const items = [], usedProducts = new Map(), usedPacks = new Map();
    for (const row of data.items) {
      if (!integer(row.qty, 20)) throw new ApiError(400, "تعداد دسته‌گل معتبر نیست.");
      if (row.custom) {
        const input = row.custom;
        if (!Array.isArray(input.packs) || !input.packs.length || input.packs.length > 10) throw new ApiError(400, "ترکیب گل معتبر نیست.");
        if (!arrangements.includes(input.arrangement) || !["زرشکی", "سبز", "شیری"].includes(input.ribbon) || !wrappings.some(w => w.id === input.wrapping?.id)) throw new ApiError(400, "تزیین دسته‌گل معتبر نیست.");
        const quantities = {};
        for (const part of input.packs) {
          if (!integer(part.qty, 100) || typeof part.id !== "string" || quantities[part.id] || !packs.some(p => p.id === part.id)) throw new ApiError(400, "بسته‌های گل معتبر نیستند.");
          quantities[part.id] = part.qty;
        }
        // Never trust browser price, stem count, product name or fee.
        const summary = calculateBouquet(quantities, packs, input.wrapping.id);
        const custom = { packs: summary.selected.map(({ id, name, qty, minStems, maxStems, price }) => ({ id, name, qty, minStems, maxStems, price })),
          wrapping: summary.wrapping, arrangement: input.arrangement, ribbon: input.ribbon, minStems: summary.minStems, maxStems: summary.maxStems, arrangingFee: 200000 };
        for (const part of custom.packs) usedPacks.set(part.id, (usedPacks.get(part.id) || 0) + part.qty * row.qty);
        items.push({ name: "دسته‌گل دلخواه شما", photo: "hero", price: summary.price, qty: row.qty, custom });
      } else {
        if (typeof row.id !== "string") throw new ApiError(400, "شناسه محصول معتبر نیست.");
        const product = await db.collection("products").findOne({ id: row.id }, { session });
        if (!product) throw new ApiError(409, "یکی از محصولات دیگر موجود نیست.");
        usedProducts.set(product.id, (usedProducts.get(product.id) || 0) + row.qty);
        items.push({ productId: product.id, name: product.name, photo: product.photo, price: product.price, qty: row.qty });
      }
    }
    for (const [id, qty] of usedProducts) {
      const update = await db.collection("products").updateOne({ id, stock: { $gte: qty } }, { $inc: { stock: -qty, revision: 1 } }, { session });
      if (update.modifiedCount !== 1) throw new ApiError(409, "موجودی محصول کافی نیست. پنل را تازه‌سازی کنید.");
    }
    for (const [id, qty] of usedPacks) {
      const update = await db.collection("flower_packs").updateOne({ id, stock: { $gte: qty } }, { $inc: { stock: -qty, revision: 1 } }, { session });
      if (update.modifiedCount !== 1) throw new ApiError(409, "موجودی بسته‌های گل کافی نیست.");
    }
    const subtotal = items.reduce((n, row) => n + row.price * row.qty, 0);
    const shipping = subtotal >= 3000000 ? 0 : 150000;
    const order = { id: "MG-" + randomUUID().slice(0, 8).toUpperCase(), requestId: data.requestId, items, deliveryDate: data.deliveryDate, slot: data.slot, occasion: data.occasion, city: "تهران", customer: "مشتری نمونه", address: "نشانی ساختگی", subtotal, shipping, total: subtotal + shipping, status: "paid", payment: { simulated: true, moneyTransferred: false }, createdAt: new Date().toISOString(), revision: 0 };
    await db.collection("demo_orders").insertOne(order, { session });
    await message(db, session, order, "خرید", `مشتری نمونه، سفارش ${order.id} ثبت شد. تحویل ${formatDay(order.deliveryDate)}، بازه ${order.slot}. این پرداخت نمایشی است.`);
    return plain(order);
  });
}
export async function changeDemoOrder(id, data) {
  if (!transitions[data.action]) throw new ApiError(400, "تغییر وضعیت معتبر نیست.");
  if (data.action === "ready" && !slots.includes(data.eta)) throw new ApiError(400, "زمان تقریبی معتبر نیست.");
  return transaction(async (db, session) => {
    const order = await db.collection("demo_orders").findOne({ id }, { session });
    if (!order) throw new ApiError(404, "سفارش پیدا نشد.");
    if (!transitions[data.action].includes(order.status)) throw new ApiError(409, "این تغییر برای وضعیت فعلی مجاز نیست.");
    if (data.action === "cancel" && !canCancel(order, new Date())) throw new ApiError(409, "مهلت لغو به وقت تهران گذشته است.");
    const update = { status: states[data.action], ...(data.action === "ready" ? { eta: data.eta } : {}), ...(data.action === "cancel" ? { refund: "پرداخت ساختگی بوده؛ بازپرداخت واقعی وجود ندارد." } : {}) };
    const changed = await db.collection("demo_orders").findOneAndUpdate({ id, revision: order.revision }, { $set: update, $inc: { revision: 1 } }, { session, returnDocument: "after" });
    if (!changed) throw new ApiError(409, "سفارش هم‌زمان تغییر کرده است.");
    if (data.action === "cancel") {
      for (const row of order.items) {
        if (row.custom) {
          for (const pack of row.custom.packs) await db.collection("flower_packs").updateOne({ id: pack.id }, { $inc: { stock: pack.qty * row.qty, revision: 1 } }, { session });
        } else await db.collection("products").updateOne({ id: row.productId }, { $inc: { stock: row.qty, revision: 1 } }, { session });
      }
      await message(db, session, order, "لغو", `سفارش ${order.id} لغو شد. موجودی بازگشت؛ پرداخت واقعی انجام نشده بود.`);
    }
    if (data.action === "ready") await message(db, session, order, "آماده ارسال", `سفارش ${order.id} آماده شد. زمان تقریبی دریافت: ${formatDay(order.deliveryDate)}، ساعت ${data.eta}.`);
    await db.collection("demo_events").insertOne({ id: randomUUID(), orderId: id, action: data.action, from: order.status, to: changed.status, at: new Date().toISOString() }, { session });
    return plain(changed);
  });
}
