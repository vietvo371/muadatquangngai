import { directionText, furnitureText, legalText } from '@/lib/property-form-config';

/**
 * Mục "Thông tin chi tiết" trong cột trái (Notion 30/09 "Main Content – Details", "Details – Grid").
 *
 * Lưới 2 cột thay cho danh sách dài. CHỈ hiện thông số tin đăng thực sự có — tin thiếu số tầng
 * hay mặt tiền thì bỏ hẳn dòng đó, không in "Đang cập nhật" cho kín bảng.
 */

export interface PropertyDetailsData {
  id: string;
  categoryName: string;
  type: 'sell' | 'rent';
  area: number;
  areaLand: number | null;
  areaFloor: number | null;
  floors: number | null;
  bedrooms: number;
  bathrooms: number;
  toilets: number | null;
  parking: boolean;
  direction: string | null;
  balconyDirection: string | null;
  facade: number | null;
  roadWidth: number | null;
  furniture: string | null;
  legal: string | null;
  projectName: string | null;
}

const number = (value: number | null | undefined, unit: string) =>
  value != null && value > 0 ? `${value.toLocaleString('vi-VN')} ${unit}` : null;

const text = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/**
 * Nhãn của các trường chọn (hướng, nội thất, pháp lý). Các hàm *Text trả "Đang cập nhật" khi
 * thiếu giá trị — ở bảng này thì bỏ hẳn dòng, nên phải tự kiểm tra trước khi tra nhãn.
 */
const option = (value: string | null | undefined, toLabel: (v: string) => string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed !== 'Không xác định' ? toLabel(trimmed) : null;
};

export function PropertyDetailsGrid({ data }: { data: PropertyDetailsData }) {
  const rows: Array<[string, string | null]> = [
    ['Mã tin', `#${data.id}`],
    ['Loại hình', data.categoryName],
    ['Nhu cầu', data.type === 'sell' ? 'Bán' : 'Cho thuê'],
    ['Dự án', text(data.projectName)],
    ['Diện tích', number(data.area, 'm²')],
    ['Diện tích đất', number(data.areaLand, 'm²')],
    ['Diện tích sàn', number(data.areaFloor, 'm²')],
    ['Số tầng', number(data.floors, 'tầng')],
    ['Phòng ngủ', number(data.bedrooms, 'phòng')],
    ['Phòng tắm', number(data.bathrooms, 'phòng')],
    ['Nhà vệ sinh', number(data.toilets, 'phòng')],
    ['Chỗ để xe', data.parking ? 'Có' : null],
    ['Hướng nhà', option(data.direction, directionText)],
    ['Hướng ban công', option(data.balconyDirection, directionText)],
    ['Mặt tiền', number(data.facade, 'm')],
    ['Đường vào', number(data.roadWidth, 'm')],
    ['Nội thất', option(data.furniture, furnitureText)],
    ['Pháp lý', option(data.legal, legalText)],
  ];

  const visible = rows.filter((row): row is [string, string] => row[1] !== null);
  if (visible.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-[18px] font-bold tracking-tight text-gray-900">Thông tin chi tiết</h2>
      <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        {visible.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 border-b border-gray-100 py-2.5">
            <dt className="text-[13.5px] text-gray-500">{label}</dt>
            <dd className="text-right text-[13.5px] font-semibold text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
