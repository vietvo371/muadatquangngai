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
  onSelect,
}: PackageCardProps) {
  return (
    <div 
      className={cn(
        "relative rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden bg-white",
        selected ? "border-primary bg-primary-light shadow-md" : "border-gray-100 hover:border-primary/50 hover:shadow-sm"
      )}
      onClick={() => onSelect(id)}
    >
      {isPopular && (
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
          selected ? "bg-primary text-white" : "bg-gray-50 text-gray-700 group-hover:bg-gray-100"
        )}>
          {selected ? 'Đang chọn' : 'Chọn gói này'}
        </div>
      </div>
    </div>
  );
}
