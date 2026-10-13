import { handle, body, result } from "../../../../../lib/http";
import { changeDemoOrder } from "../../../../../lib/demo-orders";
export const runtime = "nodejs";
export async function PATCH(request, { params }) {
  return handle(request, async () => result({ order: await changeDemoOrder((await params).id, await body(request)) }), true);
}
