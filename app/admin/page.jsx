import App from "../../src/App";
import { getCatalog } from "../../lib/catalog";
export const dynamic = "force-dynamic";
export const metadata = { title: "داشبورد عمومی نمایشی", alternates: { canonical: "/admin" } };
export default async function AdminPage() {
  return <App catalog={await getCatalog()} initialScreen="admin" routingMode="path" backend={true}/>;
}
