import Link from "next/link";
import { Search, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-6 py-12 relative overflow-hidden font-sans">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        <span className="text-[12rem] sm:text-[16rem] md:text-[20rem] font-black text-gray-100/60 tracking-tighter leading-none">
          404
        </span>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="max-w-md w-full bg-white/70 backdrop-blur-md border border-gray-100/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-8 sm:p-10 rounded-3xl text-center relative z-10 flex flex-col items-center">
        {/* Animated Icon Container */}
        <div className="h-16 w-16 bg-primary-light text-primary rounded-2xl flex items-center justify-center mb-6 shadow-inner relative group transition-all duration-300 hover:scale-105">
          <Search className="h-8 w-8 stroke-[2.25]" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-cta rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-cta rounded-full" />
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-tight mb-2.5">
          Không Tìm Thấy Trang
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed mb-8 max-w-sm">
          Đường liên kết bạn đang truy cập có thể đã hết hạn, bị thay đổi hoặc không tồn tại trong hệ thống Bất Động Sản Quảng Ngãi.
        </p>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 active:scale-[0.98] text-white text-xs sm:text-sm font-bold h-11 px-5 rounded-xl transition-all shadow-md shadow-primary/10"
          >
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
          <Link
            href="/mua-ban"
            className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] text-gray-700 text-xs sm:text-sm font-semibold h-11 px-5 rounded-xl transition-all"
          >
            <Search className="h-4 w-4 text-gray-400" />
            Tìm tin đăng
          </Link>
        </div>
      </div>
    </div>
  );
}
