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
        <div className="container mx-auto px-4 py-4">
          <a href="/" className="flex items-center gap-2 w-fit">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="font-bold text-xl text-gray-900">BatDongSan</span>
          </a>
        </div>
      </header>

      {/* Auth Content */}
      <main className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t bg-white py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2024 BatDongSan. Tất cả quyền được bảo lưu.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="/dieu-khoan" className="hover:text-gray-700">Điều khoản</a>
            <a href="/chinh-sach" className="hover:text-gray-700">Chính sách</a>
            <a href="/lien-he" className="hover:text-gray-700">Liên hệ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
