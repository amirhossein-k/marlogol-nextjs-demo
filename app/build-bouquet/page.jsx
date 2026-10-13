import App from "../../src/App";
import { getCatalog } from "../../lib/catalog";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "ساخت دسته‌گل دلخواه، انتخاب بسته‌های گل",
  description: "انتخاب بسته داوودی ۴ تا ۵ شاخه، بسته رز ۱۵ شاخه و تزیین دسته‌گل به سلیقه شما. نسخه نمایشی.",
  alternates: { canonical: "/build-bouquet" }
};
export default async function BuilderPage() {
  return <App catalog={await getCatalog()} initialScreen="builder" routingMode="path" backend={true}/>;
}
