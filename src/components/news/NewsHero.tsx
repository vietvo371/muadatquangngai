import Image from 'next/image';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface NewsHeroProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function NewsHero({ searchQuery, onSearchChange }: NewsHeroProps) {
  return (
    <section className="relative h-[320px] md:h-[380px] z-10 w-full overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/image_data/banner_hero.jpg"
          alt="Tin tức bất động sản Quảng Ngãi"
          fill
          className="object-cover object-center scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/60 to-gray-900/30" />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white drop-shadow-lg tracking-tight">
            Tin Tức Thị Trường
            <br className="sm:hidden" />
            <span className="text-primary sm:ml-2">Quảng Ngãi</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-base font-medium tracking-wide max-w-lg mx-auto leading-relaxed">
            Cập nhật xu hướng, đánh giá dự án và thông tin quy hoạch mới nhất để đầu tư hiệu quả.
          </p>
        </div>

        {/* Search */}
        <div className="w-full max-w-xl bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
            <Input
              placeholder="Tìm kiếm bài viết, tin tức..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 bg-white/20 border-transparent text-white placeholder:text-white/60 rounded-xl h-12 focus-visible:ring-1 focus-visible:ring-white/50 text-[15px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
