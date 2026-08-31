import { Banknote, Maximize, Bed, Bath, Compass, SquareStack } from 'lucide-react';
import { formatPrice, formatPriceByMode, derivePrices } from '@/lib/formatters';

interface SpecBoxesProps {
  price: number;
  priceUnit?: string;
  priceNegotiable?: boolean;
  /** Cách hiển thị giá người đăng chọn (feedback I.3) — mặc định 'short' nếu không có. */
  priceDisplayFormat?: 'short' | 'million' | 'mixed';
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  direction?: string;
}

export function SpecBoxes({ price, priceUnit, priceNegotiable, priceDisplayFormat, area, bedrooms, bathrooms, direction }: SpecBoxesProps) {
  // Không tự chia price cho area: khi price_unit là 'per_m2' thì price đã LÀ giá mỗi m².
  const { total: totalPrice, perM2: pricePerM2 } = derivePrices(price, priceUnit, area);

  const specs: { icon: React.ElementType; label: string; value: string; sub?: string }[] = [
    {
      icon: Banknote,
      label: 'Mức giá',
      value: priceNegotiable
        ? 'Thỏa thuận'
        : formatPriceByMode(totalPrice ?? price, priceDisplayFormat, priceUnit === 'per_m2' ? undefined : priceUnit),
      sub: pricePerM2 && !priceNegotiable ? `${formatPrice(pricePerM2)}/m²` : undefined,
    },
    { icon: Maximize, label: 'Diện tích', value: `${area} m²` },
  ];

  if (bedrooms !== undefined && bedrooms > 0) {
    specs.push({ icon: Bed, label: 'Phòng ngủ', value: `${bedrooms} phòng` });
  }
  if (bathrooms !== undefined && bathrooms > 0) {
    specs.push({ icon: Bath, label: 'Phòng tắm', value: `${bathrooms} phòng` });
  }
  if (direction) {
    specs.push({ icon: Compass, label: 'Hướng nhà', value: direction });
  }
  if (pricePerM2 && !priceNegotiable && priceUnit !== 'per_month') {
    specs.push({ icon: SquareStack, label: 'Giá/m²', value: formatPrice(pricePerM2) });
  }

  const cols = specs.length <= 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

  return (
    <div className={`grid ${cols} gap-3 py-5 border-y border-gray-100 mb-6`}>
      {specs.map((spec, i) => {
        const Icon = spec.icon;
        // Ô "Mức giá" và "Diện tích" là hai thông số khách nhìn đầu tiên — làm nổi bật hơn.
        const isHighlight = i < 2;
        return (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
              isHighlight
                ? 'bg-primary-light border border-primary/20 col-span-2 sm:col-span-1'
                : 'bg-gray-50 border border-transparent hover:border-gray-100'
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${isHighlight ? 'bg-white' : 'bg-primary-light'}`}>
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[11px] text-gray-500 uppercase tracking-wide truncate">{spec.label}</div>
              <div
                className={`truncate ${
                  isHighlight ? 'text-[18px] font-extrabold text-primary leading-tight' : 'text-[14px] font-semibold text-gray-900'
                }`}
              >
                {spec.value}
              </div>
              {spec.sub && <div className="text-[11px] text-gray-500 truncate">{spec.sub}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
