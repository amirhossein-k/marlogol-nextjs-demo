import { handle, body, result } from "../../../../lib/http";
import { createDemoOrder } from "../../../../lib/demo-orders";
export const runtime = "nodejs";
export async function POST(request) {
  return handle(request, async () => result({ order: await createDemoOrder(await body(request)) }, 201), true);
}
