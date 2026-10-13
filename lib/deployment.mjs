// Hosted demos never enable unauthenticated database mutations.
export function demoDeployment(env) {
  const hosted = env.VERCEL === "1" || env.NODE_ENV === "production" || env.DEPLOYMENT_MODE === "hosted-demo";
  return { hosted, backend: !hosted && env.LOCAL_DEMO_WRITES === "true" };
}
export function siteUrl(env) {
  const candidate = env.SITE_URL || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : env.VERCEL_URL ? `https://${env.VERCEL_URL}` : "http://localhost:3000");
  const url = new URL(candidate);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("SITE_URL must use http or https");
  return url.origin;
}
