const hosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
export function localAllowed(url, env) {
  return env.NODE_ENV !== "production" && env.LOCAL_DEMO_WRITES === "true" && hosts.has(new URL(url).hostname);
}
export function sameOrigin(url, origin) {
  if (!origin) return false;
  try { return new URL(url).origin === new URL(origin).origin; } catch { return false; }
}
function localAuthority(value, protocol) {
  if (typeof value !== "string" || !value || /[\s,/@\\?#]/.test(value)) throw new Error("INVALID_LOCAL_HOST");
  const url = new URL(`${protocol}//${value}`);
  if (!hosts.has(url.hostname)) throw new Error("INVALID_LOCAL_HOST");
  return url;
}
export function resolveLocalRequestUrl(requestUrl, headers) {
  const internal = new URL(requestUrl);
  if (!hosts.has(internal.hostname)) throw new Error("INVALID_LOCAL_HOST");
  if (headers.get("forwarded")) throw new Error("INVALID_LOCAL_HOST");
  // Next may reconstruct request.url using 127.0.0.1 while the browser uses localhost.
  // Both must remain loopback, use the same port, and never contain a proxy host list.
  const browser = localAuthority(headers.get("host") || internal.host, internal.protocol);
  const forwarded = headers.get("x-forwarded-host");
  if (forwarded) {
    const proxy = localAuthority(forwarded, internal.protocol);
    if (proxy.port !== browser.port) throw new Error("INVALID_LOCAL_HOST");
  }
  if (browser.port !== internal.port) throw new Error("INVALID_LOCAL_HOST");
  internal.host = browser.host;
  return internal.href;
}
