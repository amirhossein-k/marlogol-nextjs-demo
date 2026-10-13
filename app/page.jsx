import DemoPage from "../lib/demo-page";
import { pageMetadata, jsonLd } from "../lib/seo.mjs";
import { siteUrl } from "../lib/deployment.mjs";
export const dynamic = "force-dynamic";
export const metadata = pageMetadata("خرید گل و دسته‌گل در تهران، مارلوگل (نسخه نمایشی)", "دسته‌گل، باکس گل و ترکیب دلخواه از بسته‌های رز و داوودی؛ انتخاب تحویل از فردا تا هفت روز آینده، فقط تهران. خرید و پیامک نمایشی‌اند.", "/");
export default async function Page() {
  const data = { "@context": "https://schema.org", "@type": "WebSite", name: "مارلوگل", url: siteUrl(process.env), inLanguage: "fa-IR", description: "نسخه نمایشی فروشگاه گل در تهران" };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }}/><DemoPage screen="shop"/></>;
}
