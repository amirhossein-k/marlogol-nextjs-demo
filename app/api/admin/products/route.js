import { handle, body, result } from "../../../../lib/http";
import { createProduct } from "../../../../lib/products";
export const runtime = "nodejs";
export async function POST(request) {
  return handle(request, async () => result({ product: await createProduct(await body(request)) }, 201), true);
}
