import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Panel trái — chỉ hiện desktop */}
      <div 
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a87, #4a7ba8)' }}
      >
        {/* Background pattern overlay (optional but adds texture) */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <Image
              src="/images/logo_mai.png"
              alt="BatDongSan Quang Ngai"
              width={160}
              height={44}
              className="object-contain h-10 w-auto brightness-0 invert"
              priority
            />
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-[32px] font-bold text-white leading-tight mb-4">
            Tìm bất động sản<br />phù hợp nhất tại<br />
            <span className="text-[#fca5a5]">Quảng Ngãi</span>
          </h2>
          <p className="text-white/70 text-[15px] max-w-md">
            Hơn 1.200+ tin đăng xác thực. Kết nối trực tiếp chủ nhà và những nhà môi giới chuyên nghiệp hàng đầu.
          </p>
        </div>

        {/* 3 trust stats */}
        <div className="grid grid-cols-3 gap-4 relative z-10 border-t border-white/10 pt-8 mt-8">
          {[
            { num: '1.200+', label: 'Tin xác thực' },
            { num: '500+', label: 'Môi giới' },
            { num: '10.000+', label: 'Khách hàng' },
          ].map(item => (
            <div key={item.label} className="text-left">
              <div className="text-[28px] font-bold text-white">{item.num}</div>
              <div className="text-[13px] font-medium text-white/60 uppercase tracking-wider">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Panel phải — form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-white relative">
        {/* Mobile Header - only visible on small screens */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link href="/">
            <Image
              src="/images/logo_mai.png"
              alt="BatDongSan Quang Ngai"
              width={120}
              height={33}
              className="object-contain h-8 w-auto"
              priority
            />
          </Link>
        </div>

        <div className="w-full max-w-[390px] mt-12 lg:mt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
