import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, Globe, HeadphonesIcon } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-[1152px] px-4 py-12 sm:px-6">

        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">

          {/* Cột 1: Logo + địa chỉ */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/images/logo_xam.png"
                alt="Muadatquangngai.com"
                width={160}
                height={60}
                className="object-contain brightness-0 invert opacity-80"
              />
            </Link>
            <p className="text-sm text-gray-400 mb-1">Công ty cổ phần ĐQN</p>
            <p className="text-sm text-gray-400 mb-1">308 Hai Bà Trưng, Quảng Ngãi</p>
            <p className="text-sm text-gray-400">0365 285 863</p>
          </div>

          {/* Cột 2: Hướng dẫn */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Hướng dẫn</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Về chúng tôi', href: '/ve-chung-toi' },
                { label: 'Báo giá và hỗ trợ', href: '/bao-gia' },
                { label: 'Câu hỏi thường gặp', href: '/faq' },
                { label: 'Góp ý báo lỗi', href: '/gop-y' },
                { label: 'Site map', href: '/sitemap' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3: Quy định */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Quy định</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Quy định đăng tin', href: '/quy-dinh-dang-tin' },
                { label: 'Quy chế hoạt động', href: '/quy-che' },
                { label: 'Điều khoản thoả thuận', href: '/dieu-khoan' },
                { label: 'Chính sách bảo mật', href: '/chinh-sach' },
                { label: 'Giải quyết khiếu nại', href: '/khieu-nai' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 4: Hotline + Email + Newsletter */}
          <div className="col-span-2 md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {/* Hotline */}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-gray-300" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Hotline:</p>
                  <p className="text-white font-semibold text-sm">0365 285 863</p>
                  <a href="http://trogiup.muadatquangngai.com" className="text-xs text-primary hover:underline">
                    trogiup.muadatquangngai.com
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-gray-300" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Chăm sóc khách hàng</p>
                  <p className="text-white text-sm break-all">info.muadatquangngai@gmail.com</p>
                </div>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">
                Đăng ký nhận bảng tin
              </h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 outline-none focus:border-primary transition-colors"
                />
                <button className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors shrink-0">
                  Đăng ký
                </button>
              </div>
            </div>

            {/* Quốc gia & ngôn ngữ */}
            <div className="mt-4 flex items-center gap-2 text-gray-500 text-xs">
              <Globe className="h-4 w-4" />
              <span>Quốc gia & Ngôn ngữ</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-500">
            Copyright ©2026 mudatquangngai.com
          </p>
        </div>
      </div>
    </footer>
  );
}
