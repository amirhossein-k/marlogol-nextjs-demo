import DemoPage from "../../lib/demo-page";
import { pageMetadata, breadcrumbs, jsonLd } from "../../lib/seo.mjs";
export const dynamic = "force-dynamic";
export const metadata = pageMetadata("گل‌های مارلو، دسته‌گل و باکس گل در تهران", "کاتالوگ گل‌های مارلوگل؛ معرفی دسته‌گل، باکس و جار گل، قیمت‌های نمونه و ساخت دسته‌گل دلخواه با تحویل برنامه‌ریزی‌شده در تهران.", "/products");
export default async function ProductsPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs([["خانه", "/"], ["گل‌های مارلو", "/products"]])) }}/><DemoPage screen="products"/></>;
}
