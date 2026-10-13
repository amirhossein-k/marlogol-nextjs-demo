import { getCatalog } from "../../../lib/catalog";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({ mode: "demo", products: await getCatalog(), mutations: "development-loopback-only" }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
