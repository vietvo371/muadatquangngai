import {
  AirVent,
  ArrowUpDown,
  Bath,
  Bed,
  Car,
  CheckCircle,
  ChefHat,
  Dumbbell,
  Fence,
  Flower2,
  Landmark,
  Refrigerator,
  School,
  ShieldCheck,
  ShoppingCart,
  Sofa,
  Sun,
  Trees,
  Tv,
  Waves,
  Wifi,
  WashingMachine,
} from 'lucide-react';

interface FeatureItem {
  id?: number | string;
  name?: string;
}

interface FeatureListProps {
  features: FeatureItem[];
  title?: string;
}

/** Bảng tra icon theo từ khoá trong tên tiện ích — không có từ khoá khớp thì dùng dấu tích. */
const ICON_RULES: { keywords: string[]; icon: React.ElementType }[] = [
  { keywords: ['điều hòa', 'dieu hoa', 'máy lạnh'], icon: AirVent },
  { keywords: ['thang máy', 'thang may'], icon: ArrowUpDown },
  { keywords: ['nóng lạnh', 'bồn tắm', 'vệ sinh'], icon: Bath },
  { keywords: ['giường', 'phòng ngủ'], icon: Bed },
  { keywords: ['ô tô', 'oto', 'xe hơi', 'gara', 'garage', 'đỗ xe', 'bãi xe'], icon: Car },
  { keywords: ['bếp'], icon: ChefHat },
  { keywords: ['gym', 'thể thao', 'tập'], icon: Dumbbell },
  { keywords: ['sân vườn', 'vườn'], icon: Flower2 },
  { keywords: ['tường rào', 'hàng rào', 'tường bao'], icon: Fence },
  { keywords: ['ngân hàng', 'chợ đầu mối', 'trung tâm hành chính'], icon: Landmark },
  { keywords: ['tủ lạnh'], icon: Refrigerator },
  { keywords: ['trường', 'học'], icon: School },
  { keywords: ['an ninh', 'bảo vệ', 'camera'], icon: ShieldCheck },
  { keywords: ['chợ', 'siêu thị', 'tiện ích'], icon: ShoppingCart },
  { keywords: ['nội thất', 'sofa', 'full nt'], icon: Sofa },
  { keywords: ['ban công', 'thoáng', 'sáng'], icon: Sun },
  { keywords: ['công viên', 'cây xanh'], icon: Trees },
  { keywords: ['tivi', 'tv', 'truyền hình'], icon: Tv },
  { keywords: ['hồ bơi', 'bể bơi', 'biển', 'sông'], icon: Waves },
  { keywords: ['wifi', 'internet', 'mạng'], icon: Wifi },
  { keywords: ['máy giặt'], icon: WashingMachine },
];

function iconFor(name: string): React.ElementType {
  const lower = name.toLowerCase();
  const rule = ICON_RULES.find((r) => r.keywords.some((k) => lower.includes(k)));
  return rule?.icon ?? CheckCircle;
}

/**
 * Tiện ích & đặc điểm — danh sách 2-3 cột kèm icon trực quan.
 * Không có dữ liệu thì trả null để trang ẩn cả khối (không bịa tiện ích).
 */
export function FeatureList({ features, title = 'Tiện ích & Đặc điểm' }: FeatureListProps) {
  const items = (features ?? []).filter((f) => Boolean(f?.name));
  if (items.length === 0) return null;

  return (
    <div className="mb-8 pt-8 border-t border-gray-100">
      <h2 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((feature, i) => {
          const name = feature.name as string;
          const Icon = iconFor(name);
          return (
            <div
              key={feature.id ?? i}
              className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-2.5"
            >
              <span className="p-1.5 rounded-lg bg-primary-light shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <span className="text-[14px] text-gray-700 font-medium leading-snug">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
