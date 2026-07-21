import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/formatters';

interface PackageCardProps {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  isPopular?: boolean;
  color: 'normal' | 'vip' | 'vip_plus' | 'diamond';
  selected?: boolean;
  /** Gói chưa mở bán (chưa nối cổng thanh toán) — hiển thị mờ, không chọn được. */
  comingSoon?: boolean;
  onSelect: (id: string) => void;
}

export function PackageCard({
  id,
  name,
  price,
  duration,
  features,
  isPopular,
  selected,
  comingSoon,
  onSelect,
}: PackageCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 transition-all duration-300 overflow-hidden bg-white",
        comingSoon
          ? "border-gray-100 opacity-60 cursor-not-allowed"
          : selected
            ? "border-primary bg-primary-light shadow-md cursor-pointer"
            : "border-gray-100 hover:border-primary/50 hover:shadow-sm cursor-pointer"
      )}
      onClick={() => { if (!comingSoon) onSelect(id); }}
      aria-disabled={comingSoon}
    >
      {comingSoon ? (
        <div className="absolute top-0 right-0 bg-gray-400 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
          Sắp có
        </div>
      ) : isPopular && (
        <div className="absolute top-0 right-0 bg-primary text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
          Khuyên dùng
        </div>
      )}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 mb-2">{name}</h3>
        <div className="mb-4 flex items-baseline gap-1">
          <span className={cn("text-2xl font-extrabold", selected ? "text-primary" : "text-gray-900")}>
            {price === 0 ? 'Miễn phí' : formatPrice(price, 'total')}
          </span>
          {price > 0 && <span className="text-gray-500 text-[13px]">/{duration} ngày</span>}
        </div>
        
        <ul className="space-y-2.5 mb-6">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[13px] text-gray-600">
              <Check className={cn("w-4 h-4 shrink-0", selected ? "text-primary" : "text-gray-400")} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className={cn(
          "w-full h-10 rounded-xl flex items-center justify-center font-bold text-[14px] transition-colors",
          comingSoon
            ? "bg-gray-100 text-gray-400"
            : selected ? "bg-primary text-white" : "bg-gray-50 text-gray-700 group-hover:bg-gray-100"
        )}>
          {comingSoon ? 'Sắp ra mắt' : selected ? 'Đang chọn' : 'Chọn gói này'}
        </div>
      </div>
    </div>
  );
}
