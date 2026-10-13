import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "../../../lib/catalog";
import { categoryPages, pageMetadata, jsonLd, breadcrumbs } from "../../../lib/seo.mjs";
import "../../../src/style.css";
import "../../../src/rails.css";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  const category = categoryPages[(await params).slug];
  return category ? pageMetadata(category.title, category.description, `/categories/${(await params).slug}`) : { title: "دسته‌بندی پیدا نشد", robots: { index: false, follow: false } };
}
export default async function CategoryPage({ params }) {
  const slug = (await params).slug, category = categoryPages[slug];
  if (!category) notFound();
  const products = (await getCatalog()).filter(p => p.category === category.name);
  return <main className="marlogol category-seo-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs([["خانه", "/"], ["گل‌های مارلو", "/products"], [category.name, `/categories/${slug}`]])) }}/>
    <nav aria-label="مسیر صفحه"><Link href="/">خانه</Link> / <Link href="/products">گل‌های مارلو</Link> / {category.name}</nav>
    <h1>{category.title}</h1><p>{category.description}</p><div className="category-seo-grid">{products.map(p => <article key={p.id}><Link href={`/products/${p.slug}`}><img src={`/images/${p.photo}.webp`} alt={p.name} width={627} height={627} loading="lazy"/><h2>{p.name}</h2></Link><p>{p.description}</p><strong>{new Intl.NumberFormat("fa-IR").format(p.price)} تومان (نمونه)</strong></article>)}</div>
    <Link href="/build-bouquet">ترکیب خودتان را می‌خواهید؟ دسته‌گل دلخواه بسازید.</Link>
  </main>;
}
