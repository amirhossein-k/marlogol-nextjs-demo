import { handle, body, result } from "../../../../../lib/http";
import { updateProduct } from "../../../../../lib/products";
export const runtime = "nodejs";
export async function PUT(request, { params }) {
  return handle(request, async () => result({ product: await updateProduct((await params).id, await body(request)) }), true);
}
