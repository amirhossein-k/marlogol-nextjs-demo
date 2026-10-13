import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "../../../lib/catalog";
import { siteUrl } from "../../../lib/deployment.mjs";
import "../../../src/style.css";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "محصول پیدا نشد" };
  return { title: product.name, description: product.description, alternates: { canonical: `/products/${product.slug}` }, robots: { index: false, follow: false } };
}
export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const data = { "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description, category: product.category, image: new URL(`/images/${product.photo}.webp`, siteUrl(process.env)).href };
  return <main className="marlogol standalone-product">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}/>
    <Link href="/">مارلوگل · بازگشت به فروشگاه</Link>
    <div className="standalone-grid"><img src={`/images/${product.photo}.webp`} alt={product.name} width="627" height="627"/>
      <div><span className="eyebrow">محصول نمونه · فقط تهران</span><h1>{product.name}</h1><p>{product.description}</p><strong>{new Intl.NumberFormat("fa-IR").format(product.price)} تومان</strong><p>تحویل از فردا تا ۷ روز آینده. لغو تا ساعت ۲۲ شب قبل، به وقت تهران.</p><Link href="/#collection">انتخاب و خرید نمایشی در فروشگاه ←</Link><small className="sample-note">قیمت و عکس نمونه هستند. این صفحه محصول واقعی قابل خرید نیست.</small></div>
    </div>
  </main>;
}
