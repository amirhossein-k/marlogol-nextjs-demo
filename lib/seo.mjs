import { siteUrl } from "./deployment.mjs";
export function pageMetadata(title, description, path, env = process.env, image = "/images/hero.webp") {
  const url = new URL(path, siteUrl(env)).href;
  return {
    title, description, alternates: { canonical: url },
    robots: { index: false, follow: false },
    openGraph: { title, description, url, siteName: "مارلوگل", locale: "fa_IR", type: "website", images: [{ url: new URL(image, siteUrl(env)).href, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [new URL(image, siteUrl(env)).href] }
  };
}
export function jsonLd(value) { return JSON.stringify(value).replace(/</g, "\\u003c"); }
export function breadcrumbs(entries, env = process.env) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: entries.map(([name, path], index) => ({ "@type": "ListItem", position: index + 1, name, item: new URL(path, siteUrl(env)).href })) };
}
export const categoryPages = {
  bouquets: { name: "دسته‌گل", title: "خرید دسته‌گل در تهران، چیدمان‌های مارلوگل", description: "آشنایی با دسته‌گل‌های رز، گل‌های فصلی و آفتابگردان مارلوگل؛ تحویل از فردا تا هفت روز آینده، فقط در تهران. نسخه نمایشی." },
  "flower-boxes": { name: "باکس گل", title: "باکس گل در تهران، هدیه‌های مارلوگل", description: "باکس گل برای هدیه و تبریک با بسته‌بندی زیبا؛ انتخاب روز تحویل از فردا، فقط شهر تهران. محصولات این نسخه نمونه‌اند." },
  "flower-vases": { name: "جار گل", title: "جار گل و گل در گلدان، مارلوگل تهران", description: "گل‌های گلدانی و جار گل برای خانه، میز کار و هدیه؛ معرفی چیدمان‌های نمونه مارلوگل با ارسال برنامه‌ریزی‌شده تهران." }
};
