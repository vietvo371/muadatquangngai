import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["vietnamese", "latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Bất Động Sản Quảng Ngãi — Mua Bán Bất Động Sản Quảng Ngãi",
    template: "%s | Bất Động Sản Quảng Ngãi",
  },
  description:
    "Nền tảng mua bán bất động sản hàng đầu Quảng Ngãi. 100% tin đã xác thực, không tin ảo.",
  keywords: [
    "mua bán đất Quảng Ngãi",
    "bất động sản Quảng Ngãi",
    "nhà đất Quảng Ngãi",
    "đất nền Quảng Ngãi",
    "chung cư Quảng Ngãi",
  ],
  openGraph: {
    title: "Bất Động Sản Quảng Ngãi — Mua Bán Bất Động Sản Quảng Ngãi",
    description: "Nền tảng mua bán bất động sản hàng đầu Quảng Ngãi",
    type: "website",
    locale: "vi_VN",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <Providers>
          <TooltipProvider delay={300}>
            {children}
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
