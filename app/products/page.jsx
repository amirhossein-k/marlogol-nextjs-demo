import DemoPage from "../../lib/demo-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "گل‌های مارلو، کاتالوگ محصولات", alternates: { canonical: "/products" } };
export default async function ProductsPage() {
  return <DemoPage screen="products"/>;
}
