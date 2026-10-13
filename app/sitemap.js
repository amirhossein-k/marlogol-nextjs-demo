import { getCatalog } from "../lib/catalog";
import { siteUrl, demoDeployment } from "../lib/deployment.mjs";

// Sitemap: all public routes plus the product catalog when the site is
// indexable on a real HTTPS deployment (hosted demo or NODE_ENV production).
// Admin and order-tracking pages are always excluded from indexing.
export default async function sitemap() {
  const env = process.env;
  const origin = siteUrl(env);
  const indexable = demoDeployment(env).hosted || (env.NODE_ENV === "production" && env.SITE_URL?.startsWith("https://"));
  const base = { changefreq: "weekly", priority: 0.5 };
  const entries = [
    { url: `${origin}/`, lastModified: new Date().toISOString(), changefreq: "daily", priority: 1 },
    { url: `${origin}/products`, ...base },
    { url: `${origin}/build-bouquet`, ...base },
    { url: `${origin}/categories/bouquets`, ...base },
    { url: `${origin}/categories/flower-boxes`, ...base },
    { url: `${origin}/categories/flower-vases`, ...base },
    { url: `${origin}/orders`, ...base }
  ];
  if (indexable) {
    const catalog = await getCatalog();
    for (const product of catalog) {
      entries.push({
        url: `${origin}/products/${product.slug}`,
        lastModified: new Date().toISOString(),
        changefreq: "weekly",
        priority: 0.6
      });
    }
  }
  return entries;
}
