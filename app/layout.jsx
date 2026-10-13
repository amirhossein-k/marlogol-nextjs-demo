import "./globals.css";
import { siteUrl } from "../lib/deployment.mjs";
export const metadata = {
  metadataBase: new URL(siteUrl(process.env)),
  title: { default: "مارلوگل | نسخه نمایشی خرید گل و دسته‌گل در تهران", template: "%s | مارلوگل" },
  description: "فروشگاه نمایشی مارلوگل؛ انتخاب دسته‌گل، باکس و جار گل با تحویل از فردا تا هفت روز آینده، فقط در تهران.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
  openGraph: { locale: "fa_IR", type: "website", siteName: "مارلوگل", title: "مارلوگل، یک دنیا حال خوب", description: "نسخه نمایشی فروشگاه گل در تهران", images: [{ url: "/images/hero.webp", width: 1122, height: 1402, alt: "دسته‌گل باغ صورتی مارلوگل" }] },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" }
};
export default function RootLayout({ children }) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
