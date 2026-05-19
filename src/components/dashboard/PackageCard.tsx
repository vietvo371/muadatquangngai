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
  color,
  selected,
  onSelect,
}: PackageCardProps) {
  const colorMap = {
    normal: {
      bg: 'bg-white',
      border: 'border-gray-200',
      text: 'text-gray-900',
      badge: 'bg-gray-100 text-gray-600',
      button: 'bg-gray-900 hover:bg-black',
      check: 'text-gray-600',
      activeBorder: 'border-gray-900'
    },
    vip: {
      bg: 'bg-yellow-50/30',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      badge: 'bg-yellow-500 text-white',
      button: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      check: 'text-yellow-600',
      activeBorder: 'border-yellow-500'
    },
    vip_plus: {
      bg: 'bg-orange-50/30',
      border: 'border-orange-200',
      text: 'text-orange-700',
      badge: 'bg-orange-500 text-white',
      button: 'bg-orange-500 hover:bg-orange-600 text-white',
      check: 'text-orange-600',
      activeBorder: 'border-orange-500'
    },
    diamond: {
      bg: 'bg-red-50/30',
      border: 'border-red-200',
      text: 'text-red-700',
      badge: 'bg-[#e03131] text-white',
      button: 'bg-[#e03131] hover:bg-[#c92a2a] text-white',
      check: 'text-[#e03131]',
      activeBorder: 'border-[#e03131]'
    }
  };

  const theme = colorMap[color];

  return (
    <div 
      className={cn(
        "relative rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden",
        theme.bg,
        selected ? `${theme.activeBorder} shadow-lg scale-[1.02]` : theme.border,
        !selected && "hover:shadow-md hover:-translate-y-1"
      )}
      onClick={() => onSelect(id)}
    >
      {isPopular && (
        <div className="absolute top-0 right-0 left-0 bg-primary text-white text-[11px] font-bold uppercase tracking-wider text-center py-1.5">
          Được ưa chuộng nhất
        </div>
      )}
      <div className={cn("p-6", isPopular && "pt-8")}>
        <div className={cn("inline-block px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider mb-4", theme.badge)}>
          {name}
        </div>
        <div className="mb-6 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-gray-900">{price === 0 ? 'Miễn phí' : formatPrice(price, 'total')}</span>
          {price > 0 && <span className="text-gray-500 text-[13px] font-medium">/{duration} ngày</span>}
        </div>
        
        <ul className="space-y-3 mb-8">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <Check className={cn("w-4 h-4 mt-0.5 shrink-0", theme.check)} />
              <span className="text-[14px] text-gray-700 font-medium leading-tight">{feature}</span>
            </li>
          ))}
        </ul>

        <Button 
          className={cn(
            "w-full h-11 font-bold text-[14px] transition-all", 
            selected ? theme.button : "bg-white border-2 border-gray-200 text-gray-900 hover:bg-gray-50"
          )}
          variant={selected ? "default" : "outline"}
        >
          {selected ? 'Đã chọn gói này' : 'Chọn gói này'}
        </Button>
      </div>
    </div>
  );
}
