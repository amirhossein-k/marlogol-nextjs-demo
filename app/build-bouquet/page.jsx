import DemoPage from "../../lib/demo-page";
import { pageMetadata } from "../../lib/seo.mjs";
export const dynamic = "force-dynamic";
export const metadata = pageMetadata("ساخت دسته‌گل دلخواه، انتخاب رز و داوودی در تهران", "بسته داوودی ۴ تا ۵ شاخه و رز ۱۵ شاخه را ترکیب کنید؛ انتخاب کاغذ، چیدمان و روبان با نمایش قیمت و تعداد شاخه. نسخه نمایشی مارلوگل.", "/build-bouquet");
export default async function BuilderPage() {
  return <DemoPage screen="builder"/>;
}
