import "server-only";
import { localAllowed, sameOrigin, resolveLocalRequestUrl } from "./local-policy.mjs";
import { mongoFailure } from "./mongo-config.mjs";
export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function localGuard(request, mutation = false) {
  if (!localAllowed(request.url, process.env)) throw new ApiError(403, "پنل محلی غیرفعال است؛ اجرای development روی localhost و LOCAL_DEMO_WRITES=true لازم است.");
  let browserUrl;
  try { browserUrl = resolveLocalRequestUrl(request.url, request.headers); }
  catch { throw new ApiError(403, "میزبان پنل باید localhost یا 127.0.0.1 با پورت یکسان باشد؛ پراکسی عمومی مجاز نیست."); }
  if (mutation && !sameOrigin(browserUrl, request.headers.get("origin"))) throw new ApiError(403, "مبدأ درخواست معتبر نیست.");
}
export async function body(request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ApiError(415, "فقط JSON پذیرفته می‌شود.");
  const text = await request.text();
  if (text.length > 32768) throw new ApiError(413, "درخواست بیش از حد بزرگ است.");
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new ApiError(400, "JSON معتبر نیست."); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new ApiError(400, "بدنه باید یک شیء JSON باشد.");
  return parsed;
}
export function result(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
export async function handle(request, work, mutation = false) {
  try { localGuard(request, mutation); return await work(); }
  catch (error) {
    if (error.status) return result({ error: error.message }, error.status);
    if (error.code === 11000) return result({ error: "نشانی یا شناسه تکراری است." }, 409);
    const failure = mongoFailure(error);
    console.warn("Local demo API failed:", failure.code);
    return result({ error: `${failure.message} [${failure.code}]`, code: failure.code }, 503);
  }
}
export function revision(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new ApiError(400, "نسخه اطلاعات معتبر نیست؛ پنل را تازه‌سازی کنید.");
  return value;
}
