import DemoPage from "../../lib/demo-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "داشبورد عمومی نمایشی", alternates: { canonical: "/admin" } };
export default async function AdminPage() {
  return <DemoPage screen="admin"/>;
}
