import App from "../../src/App";
import { getCatalog } from "../../lib/catalog";
export const dynamic = "force-dynamic";
export const metadata = { title: "گل‌های مارلو، کاتالوگ محصولات", alternates: { canonical: "/products" } };
export default async function ProductsPage() {
  return <App catalog={await getCatalog()} initialScreen="products" routingMode="path" backend={true}/>;
}
