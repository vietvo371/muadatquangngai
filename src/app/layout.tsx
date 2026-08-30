import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_OG_IMAGE } from "@/lib/site";
import { WebsiteJsonLd, OrganizationJsonLd } from "@/components/seo";
import { NewVersionBanner } from '@/components/shared/NewVersionBanner';

const inter = Inter({
  variable: "--font-sans",
  subsets: ["vietnamese", "latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // metadataBase bắt buộc để Next dựng URL tuyệt đối cho canonical/OG. Thiếu nó thì ảnh OG và
  // canonical tương đối bị resolve sai (localhost khi build), link chia sẻ hiện trống.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Mua Bán Nhà Đất Quảng Ngãi`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "mua bán đất Quảng Ngãi",
    "bất động sản Quảng Ngãi",
    "nhà đất Quảng Ngãi",
    "đất nền Quảng Ngãi",
    "chung cư Quảng Ngãi",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — Mua Bán Nhà Đất Quảng Ngãi`,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Mua Bán Nhà Đất Quảng Ngãi`,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased min-h-screen flex flex-col`}>
        {/* JSON-LD site-wide — nằm sẵn trong HTML đầu tiên để crawler đọc được. */}
        <WebsiteJsonLd />
        <OrganizationJsonLd />
        <Providers>
          <TooltipProvider delay={300}>
            {children}
            <Toaster position="top-right" richColors />
            {/* Nhắc tải lại khi máy chủ đã deploy bản mới (tab cũ bấm nút sẽ không chạy). */}
            <NewVersionBanner />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
