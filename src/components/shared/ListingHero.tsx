'use client';

interface ListingHeroProps {
  title: string;
  subtitle?: string;
  type: 'sale' | 'rent';
  totalResults: number;
}

export function ListingHero({ title, subtitle, type, totalResults }: ListingHeroProps) {
  const gradientFrom = type === 'sale' ? '#0c5d8f' : '#b91c1c';
  const gradientTo = type === 'sale' ? '#1075b1' : '#e03131';
  const statBg = type === 'sale' ? 'bg-primary/10' : 'bg-cta/10';
  const statText = type === 'sale' ? 'text-primary' : 'text-cta';

  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-8 px-8 py-10 text-white"
      style={{
        background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 50%, ${gradientFrom} 100%)`,
      }}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-white/[0.03]" />
        {/* Grid dots pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]">
          <defs>
            <pattern id={`hero-grid-${type}`} x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#hero-grid-${type})`} />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="max-w-xl">
          <h1 className={`text-[32px] lg:text-[38px] font-extrabold tracking-tight leading-tight text-balance`}
              style={{ fontFamily: 'var(--font-heading)' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-base text-white/80 mt-2 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 lg:gap-8 flex-shrink-0">
          <div className="text-center">
            <div className={`text-3xl lg:text-4xl font-bold`}
                 style={{ fontFamily: 'var(--font-heading)' }}>
              {totalResults}
            </div>
            <div className="text-[13px] text-white/70 mt-1 font-medium uppercase tracking-wider">
              Tin đăng
            </div>
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div className="text-center">
            <div className={`text-3xl lg:text-4xl font-bold`}
                 style={{ fontFamily: 'var(--font-heading)' }}>
              100%
            </div>
            <div className="text-[13px] text-white/70 mt-1 font-medium uppercase tracking-wider">
              Xác thực
            </div>
          </div>
          <div className="w-px h-12 bg-white/20 lg:hidden" />
          <div className="text-center hidden lg:block">
            <div className="w-px h-12 bg-white/20 mx-auto mb-0" />
          </div>
          <div className="text-center">
            <div className={`text-3xl lg:text-4xl font-bold tracking-tight`}
                 style={{ fontFamily: 'var(--font-heading)' }}>
              QNg
            </div>
            <div className="text-[13px] text-white/70 mt-1 font-medium uppercase tracking-wider">
              Quảng Ngãi
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
