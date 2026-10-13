import "server-only";
import { getDb, plain } from "./db";
import samples from "../src/data/products.json";
import { validateProduct } from "../src/product-validation.mjs";
export async function getCatalog() {
  if (!process.env.MONGODB_URI) return samples;
  try {
    const db = await getDb();
    const documents = await db.collection("products").find({}).sort({ id: 1 }).limit(100).toArray();
    return documents.flatMap(doc => { try { return [{ ...validateProduct(doc), id: doc.id, revision: doc.revision || 0 }]; } catch { return []; } });
  } catch { console.warn("MongoDB catalog unavailable; no fallback writes or fabricated success."); return []; }
}
export async function getProduct(slug) { return (await getCatalog()).find(product => product.slug === slug); }
