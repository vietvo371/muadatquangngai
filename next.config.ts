import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Không quảng cáo framework qua header `X-Powered-By: Next.js` — bớt thông tin cho người dò
  // lỗ hổng theo phiên bản.
  poweredByHeader: false,

  // Trang bản đồ riêng /ban-do đã gộp vào split-view của /mua-ban (feedback 28/07) — giữ
  // redirect để link cũ không 404.
  async redirects() {
    return [{ source: '/ban-do', destination: '/mua-ban', permanent: true }];
  },

  /**
   * Security headers — trước đây không set gì cả.
   *
   * CỐ Ý CHƯA BẬT Content-Security-Policy: trang đang nạp tài nguyên từ nhiều nguồn ngoài
   * (Goong tiles/API, Cloudinary, Unsplash, Google Fonts) và Next dùng inline script cho
   * hydration, nên một CSP dựng vội sẽ làm trắng trang. Cần đo bằng `Content-Security-Policy-
   * Report-Only` trước rồi mới siết — để riêng thành việc sau.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Chặn nhúng site vào iframe của bên khác (clickjacking).
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Trình duyệt không được tự đoán kiểu file khác với Content-Type khai báo.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Sang site khác chỉ gửi tên miền, không gửi full URL (tránh lộ tham số tìm kiếm).
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Không dùng camera/mic/định vị — tắt hẳn để script bên thứ ba không xin quyền.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
      {
        // HSTS chỉ áp cho production: bật ở localhost sẽ khoá trình duyệt vào https://localhost.
        source: '/:path*',
        has: [{ type: 'host', value: '(?<host>muadatquangngai\\.com|www\\.muadatquangngai\\.com)' }],
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "batdongsanquangngai.s3.ap-southeast-1.amazonaws.com",
      },
      {
        // Ảnh tin đăng upload thẳng lên Cloudinary (fileUploadApi.upload) — thiếu host này
        // thì next/image từ chối optimize → ảnh vỡ trên card trang chủ/danh sách.
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        // Avatar tài khoản đăng nhập bằng Google OAuth.
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "*.batdongsan.com.vn",
      },
      {
        protocol: "https",
        hostname: "file4.batdongsan.com.vn",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowLocalIP: true,
  },
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react"],
  },
};

export default nextConfig;
