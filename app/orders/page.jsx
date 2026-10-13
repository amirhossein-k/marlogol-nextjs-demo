import DemoPage from "../../lib/demo-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "پیگیری سفارش نمونه", alternates: { canonical: "/orders" } };
export default async function OrdersPage() {
  return <DemoPage screen="orders"/>;
}
