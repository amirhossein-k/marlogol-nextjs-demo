export class MongoConfigError extends Error {
  constructor(code) { super(code); this.name = "MongoConfigError"; this.code = code; }
}
export function mongoConfig(env) {
  const uri = typeof env.MONGODB_URI === "string" ? env.MONGODB_URI.trim() : "";
  if (!uri) throw new MongoConfigError("DB_NOT_CONFIGURED");
  if (uri.startsWith("MONGODB_URI=")) throw new MongoConfigError("DB_DUPLICATE_ASSIGNMENT");
  if (!/^mongodb(?:\+srv)?:\/\//.test(uri)) throw new MongoConfigError("DB_URI_FORMAT");
  const authority = uri.split("://")[1].split(/[/?]/)[0];
  const host = authority.slice(authority.lastIndexOf("@") + 1);
  if (!host || /CLUSTER_HOST|YOUR_CLUSTER|[<>]/i.test(host)) throw new MongoConfigError("DB_PLACEHOLDER_HOST");
  if (/\s/.test(uri)) throw new MongoConfigError("DB_URI_FORMAT");
  const query = new URLSearchParams(uri.includes("?") ? uri.slice(uri.indexOf("?") + 1) : "");
  if (uri.startsWith("mongodb+srv://") && query.get("directConnection")?.toLowerCase() === "true") throw new MongoConfigError("DB_SRV_DIRECT_CONNECTION");
  const name = env.MONGODB_DB || "marlogol_demo";
  if (!name.endsWith("_demo")) throw new MongoConfigError("DEMO_DATABASE_REQUIRED");
  return { uri, name };
}
export function mongoFailure(error) {
  const codes = new Set();
  const names = new Set();
  function walk(err, depth = 0) {
    if (!err || depth > 5) return;
    if (err.code !== undefined) codes.add(String(err.code));
    if (err.name) names.add(err.name);
    walk(err.cause, depth + 1);
    if (err.reason?.servers instanceof Map) for (const server of err.reason.servers.values()) walk(server.error, depth + 1);
  }
  walk(error);
  const known = {
    DB_NOT_CONFIGURED: "متغیر MONGODB_URI بارگذاری نشده؛ فایل .env.local و راه‌اندازی مجدد سرور را بررسی کنید.",
    DB_DUPLICATE_ASSIGNMENT: "در .env.local عبارت MONGODB_URI= دو بار آمده؛ باید فقط یک بار باشد.",
    DB_URI_FORMAT: "ساختار رشته اتصال نامعتبر است؛ آدرس اصلی Connect → Drivers را استفاده کنید.",
    DB_PLACEHOLDER_HOST: "نام میزبان نمونه یا خالی است؛ آدرس واقعی کلاستر را از Atlas کپی کنید.",
    DB_SRV_DIRECT_CONNECTION: "directConnection=true با mongodb+srv سازگار نیست؛ این گزینه محلی را حذف کنید.",
    DEMO_DATABASE_REQUIRED: "نام MONGODB_DB باید به _demo ختم شود."
  };
  for (const [code, message] of Object.entries(known)) if (codes.has(code) || error?.message === code) return { code, message };
  if (codes.has("ENOTFOUND")) return { code: "DB_DNS_NOT_FOUND", message: "DNS نام میزبان دیتابیس را پیدا نکرد؛ میزبان واقعی Atlas و DNS را بررسی کنید. هنوز رمز بررسی نشده است." };
  if (codes.has("EAI_AGAIN") || codes.has("ETIMEOUT")) return { code: "DB_DNS_TEMPORARY", message: "پاسخ DNS دریافت نشد یا موقتاً ناموفق بود؛ DNS و شبکه را بررسی کنید." };
  if (codes.has("18") || codes.has("8000")) return { code: "DB_AUTH_FAILED", message: "احراز هویت دیتابیس رد شد؛ کاربر Database Access، رمز و کدگذاری کاراکترهای رمز را بررسی کنید." };
  if (codes.has("13")) return { code: "DB_PERMISSION_DENIED", message: "کاربر دیتابیس اجازه این عملیات را ندارد؛ نقش دیتابیس نمایشی را بررسی کنید." };
  if (codes.has("ECONNREFUSED")) return { code: "DB_CONNECTION_REFUSED", message: "اتصال به پورت دیتابیس رد شد؛ سرویس MongoDB و میزبان و پورت را بررسی کنید." };
  if (codes.has("20")) return { code: "DB_TRANSACTION_UNSUPPORTED", message: "این عملیات به replica set نیاز دارد؛ اتصال standalone برای transaction سفارش کافی نیست." };
  if (names.has("MongoParseError")) return { code: "DB_URI_PARSE_FAILED", message: "درایور ساختار یا گزینه‌های آدرس اتصال را نپذیرفت؛ URI اصلی Atlas را بدون گزینه‌های Docker استفاده کنید." };
  if (names.has("MongoServerSelectionError") || codes.has("ETIMEDOUT")) return { code: "DB_SERVER_UNREACHABLE", message: "سرور دیتابیس در مهلت اتصال پیدا نشد؛ شبکه، وضعیت کلاستر و IP مجاز Atlas را بررسی کنید." };
  return { code: "DB_OPERATION_FAILED", message: "عملیات دیتابیس ناموفق بود؛ خروجی scripts/check-db.mjs لازم است. این پیام به‌تنهایی علت را مشخص نمی‌کند." };
}
