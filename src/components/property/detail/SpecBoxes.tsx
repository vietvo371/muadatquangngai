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
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
      {specs.map((spec, i) => {
        const Icon = spec.icon;
        return (
          <div key={i} className="bg-gray-50 rounded-xl p-4 flex flex-col justify-center border border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <Icon className="w-4 h-4" />
              <span className="text-[13px] font-medium">{spec.label}</span>
            </div>
            <div className="text-[16px] font-bold text-gray-900">{spec.value}</div>
          </div>
        );
      })}
    </div>
  );
}
