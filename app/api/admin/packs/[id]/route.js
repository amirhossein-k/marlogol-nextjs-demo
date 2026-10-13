import { handle, body, result } from "../../../../../lib/http";
import { updatePack } from "../../../../../lib/products";
export const runtime = "nodejs";
export async function PATCH(request, { params }) {
  return handle(request, async () => result({ pack: await updatePack((await params).id, await body(request)) }), true);
}
