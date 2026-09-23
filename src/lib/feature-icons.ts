import {
  Trees, Waves, Car, ArrowUpDown, Sun, Mountain, Sofa, Package, Route, ShoppingBasket,
  GraduationCap, PlusCircle, Anchor, Moon, Zap, Plug, Wifi, Shield, Video, CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

/**
 * Cột `features.icon` lưu TÊN icon lucide dạng kebab-case (vd. "arrow-up-down"). Tra bằng bảng
 * tĩnh thay vì import động cả thư viện để bundle chỉ chứa đúng các icon đang dùng. Tên lạ hoặc
 * rỗng (nhóm kho xưởng chưa gán icon) rơi về dấu tích.
 */
const FEATURE_ICONS: Record<string, LucideIcon> = {
  trees: Trees,
  waves: Waves,
  car: Car,
  'arrow-up-down': ArrowUpDown,
  sun: Sun,
  mountain: Mountain,
  sofa: Sofa,
  package: Package,
  road: Route,
  'shopping-basket': ShoppingBasket,
  'graduation-cap': GraduationCap,
  'plus-circle': PlusCircle,
  anchor: Anchor,
  moon: Moon,
  zap: Zap,
  plug: Plug,
  wifi: Wifi,
  shield: Shield,
  video: Video,
};

export function featureIcon(name?: string | null): LucideIcon {
  return (name && FEATURE_ICONS[name]) || CheckCircle2;
}

/** Bỏ chữ "Có " ở đầu tên tiện ích cho thẻ gọn ("Có hồ bơi" → "Hồ bơi"), giữ nguyên chữ hoa đầu. */
export function shortFeatureName(name: string): string {
  const trimmed = name.replace(/^Có\s+/i, '');
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
