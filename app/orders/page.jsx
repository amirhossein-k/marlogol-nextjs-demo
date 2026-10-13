import App from "../../src/App";
import { getCatalog } from "../../lib/catalog";
export const dynamic = "force-dynamic";
export const metadata = { title: "پیگیری سفارش نمونه", alternates: { canonical: "/orders" } };
export default async function OrdersPage() {
  return <App catalog={await getCatalog()} initialScreen="orders" routingMode="path" backend={true}/>;
}
