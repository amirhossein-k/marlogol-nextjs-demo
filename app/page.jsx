import App from "../src/App";
import { getCatalog } from "../lib/catalog";
export const dynamic = "force-dynamic";
export default async function Page() {
  const products = await getCatalog();
  return <App catalog={products} initialScreen="shop" routingMode="path" backend={true}/>;
}
