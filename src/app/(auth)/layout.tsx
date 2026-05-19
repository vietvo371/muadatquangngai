import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal Header for Auth */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <a href="/" className="flex items-center gap-2.5 w-fit">
            <Image
              src="/images/logo_mai.png"
              alt="BatDongSan Quang Ngai"
              width={160}
              height={44}
              className="object-contain h-10 w-auto"
              priority
            />
          </a>
        </div>
      </header>

      {/* Auth Content */}
      <main className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2025 BatDongSan Quang Ngai. Tất cả quyền được bảo lưu.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="/dieu-khoan" className="hover:text-gray-700">�iều khoản</a>
            <a href="/chinh-sach" className="hover:text-gray-700">Chính sách</a>
            <a href="/lien-he" className="hover:text-gray-700">Liên hệ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
