import { handle, result } from "../../../../lib/http";
import { getDb, plain } from "../../../../lib/db";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request) {
  return handle(request, async () => {
    const db = await getDb();
    await db.command({ ping: 1 });
    const [products, packs, orders, messages] = await Promise.all([
      db.collection("products").find({}).sort({ createdAt: -1 }).limit(100).toArray(),
      db.collection("flower_packs").find({}).sort({ id: 1 }).toArray(),
      db.collection("demo_orders").find({}).sort({ createdAt: -1 }).limit(100).toArray(),
      db.collection("demo_messages").find({}).sort({ at: -1 }).limit(200).toArray()
    ]);
    return result({ status: { connected: true, writable: true, mode: "local-demo" }, products: products.map(plain), packs: packs.map(plain), orders: orders.map(plain), messages: messages.map(plain) });
  });
}
