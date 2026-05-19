import { Banknote, Maximize, Bed, Bath, Compass } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

interface SpecBoxesProps {
  price: number;
  priceUnit?: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  direction?: string;
}

export function SpecBoxes({ price, priceUnit, area, bedrooms, bathrooms, direction }: SpecBoxesProps) {
  const specs = [
    { icon: Banknote, label: 'Mức giá', value: formatPrice(price, priceUnit) },
    { icon: Maximize, label: 'Diện tích', value: `${area} m²` },
  ];

  if (bedrooms !== undefined) {
    specs.push({ icon: Bed, label: 'Phòng ngủ', value: `${bedrooms} PN` });
  }
  if (bathrooms !== undefined) {
    specs.push({ icon: Bath, label: 'Phòng tắm', value: `${bathrooms} PT` });
  }
  if (direction) {
    specs.push({ icon: Compass, label: 'Hướng nhà', value: direction });
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-5 border-y border-gray-100 mb-8">
      {specs.map((spec, i) => {
        const Icon = spec.icon;
        return (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-colors">
            <div className="p-2 bg-primary-light rounded-lg shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[11px] text-gray-500 uppercase tracking-wide truncate">{spec.label}</div>
              <div className="text-[14px] font-semibold text-gray-900 truncate">{spec.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
