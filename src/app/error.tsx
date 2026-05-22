"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error("System Error boundary caught error:", error);
  }, [error]);

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-6 py-12 relative overflow-hidden font-sans">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        <span className="text-[12rem] sm:text-[16rem] md:text-[20rem] font-black text-gray-100/60 tracking-tighter leading-none">
          500
        </span>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="max-w-md w-full bg-white/70 backdrop-blur-md border border-gray-100/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-8 sm:p-10 rounded-3xl text-center relative z-10 flex flex-col items-center">
        {/* Animated Icon Container */}
        <div className="h-16 w-16 bg-red-50 text-cta rounded-2xl flex items-center justify-center mb-6 shadow-inner relative group transition-all duration-300 hover:scale-105">
          <AlertTriangle className="h-8 w-8 stroke-[2.25]" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-cta rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-cta rounded-full" />
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-tight mb-2.5">
          Lỗi Kết Nối Hệ Thống
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed mb-6 max-w-sm">
          Đã xảy ra lỗi không mong muốn từ hệ thống máy chủ Bất Động Sản Quảng Ngãi. Chúng tôi đang nhanh chóng khắc phục sự cố này.
        </p>

        {/* Technical Error Details (Collapsible) */}
        <div className="w-full mb-8 text-left">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between py-2.5 px-4 bg-gray-50/80 hover:bg-gray-100/60 rounded-xl text-gray-600 text-xs font-semibold transition-all border border-gray-100/50"
          >
            <span>Chi tiết kỹ thuật</span>
            {showDetails ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {showDetails && (
            <div className="mt-2.5 p-4 bg-gray-950/90 text-gray-250 rounded-xl text-[10px] sm:text-xs font-mono overflow-x-auto max-h-40 border border-gray-800 shadow-inner leading-relaxed">
              <p className="font-bold text-red-400 mb-1">
                Lỗi: {error.message || "Không xác định"}
              </p>
              {error.digest && (
                <p className="text-gray-400 mt-1">Mã định danh (Digest): {error.digest}</p>
              )}
              <p className="text-gray-500 mt-2 text-[9px]">
                Thời gian: {new Date().toLocaleString("vi-VN")}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 active:scale-[0.98] text-white text-xs sm:text-sm font-bold h-11 px-5 rounded-xl transition-all shadow-md shadow-primary/10 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            Thử lại ngay
          </button>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] text-gray-700 text-xs sm:text-sm font-semibold h-11 px-5 rounded-xl transition-all"
          >
            <Home className="h-4 w-4 text-gray-400" />
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
